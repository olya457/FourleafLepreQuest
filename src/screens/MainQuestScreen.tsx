import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MainQuest'>;

type Stage = 'intro' | 'play' | 'resultWin' | 'resultLose';

type Pos = { c: number; r: number };

type LevelSpec = {
  cols: number;
  rows: number;
  tiles: Pos[];
  target: Pos;
};

const TOTAL_LEVELS = 50;
const ROUND_SECONDS = 30;

const STORAGE_KEY = 'mq_progress_v1';

type ProgressState = {
  currentLevel: number;
  trophies: number[];
};

const DEFAULT_PROGRESS: ProgressState = { currentLevel: 1, trophies: [] };

export default function MainQuestScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTiny = width < 350 || height < 690;
  const isSmall = width < 380 || height < 740;

  const [loaded, setLoaded] = useState(false);

  const [stage, setStage] = useState<Stage>('intro');
  const [level, setLevel] = useState(1);

  const [trophies, setTrophies] = useState<number[]>([]);

  const [foundTarget, setFoundTarget] = useState(false);
  const [targetPressed, setTargetPressed] = useState(false);
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  const fade = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  const breathe = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(0)).current;

  const spec = useMemo(() => getLevelSpec(level), [level]);

  const contentPadTop = Platform.OS === 'android' ? 6 : 0;
  const topBarMarginTop = 6 + 10;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  const readProgress = async (): Promise<ProgressState> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PROGRESS;

      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      const currentLevel = clampInt(Number(parsed.currentLevel ?? 1), 1, TOTAL_LEVELS);

      const trophiesArr = Array.isArray(parsed.trophies)
        ? parsed.trophies
            .filter((n) => Number.isFinite(n))
            .map((n) => clampInt(Number(n), 1, 5))
        : [];

      return { currentLevel, trophies: uniq(trophiesArr) };
    } catch {
      return DEFAULT_PROGRESS;
    }
  };

  const writeProgress = async (next: ProgressState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const p = await readProgress();
      if (!mounted) return;

      setLevel(p.currentLevel);
      setTrophies(p.trophies);
      setStage('intro');
      setLoaded(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void writeProgress({ currentLevel: level, trophies });
  }, [loaded, level, trophies]);

  const animateIn = () => {
    fade.setValue(0);
    lift.setValue(12);
    pop.setValue(0.97);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (!loaded) return;
    animateIn();
  }, [loaded, stage, level]);

  useEffect(() => {
    if (!loaded) return;

    if (stage !== 'play') {
      breathe.stopAnimation();
      breathe.setValue(0);
      return;
    }

    breathe.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [loaded, stage, breathe]);

  useEffect(() => {
    if (!loaded) return;

    if (stage !== 'play' || timeLeft > 5 || timeLeft <= 0 || foundTarget) {
      timerPulse.stopAnimation();
      timerPulse.setValue(0);
      return;
    }

    timerPulse.setValue(0);
    Animated.sequence([
      Animated.timing(timerPulse, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(timerPulse, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [loaded, stage, timeLeft, foundTarget, timerPulse]);

  useEffect(() => {
    if (!loaded) return;
    if (stage !== 'play') return;
    if (foundTarget) return;

    const t = setInterval(() => {
      setTimeLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [loaded, stage, foundTarget]);

  useEffect(() => {
    if (!loaded) return;
    if (stage !== 'play') return;
    if (foundTarget) return;
    if (timeLeft > 0) return;

    setStage('resultLose');
  }, [loaded, stage, foundTarget, timeLeft]);

  const topBarH = 52;

  const bottomPadding = 24 + insets.bottom;
  const playBottomPadding = 24; 

  const contentW = Math.min(width - (isTiny ? 24 : isSmall ? 30 : 40), 460);

  const headerBlockH = insets.top + contentPadTop + topBarMarginTop + topBarH;
  const playAreaH = height - headerBlockH - playBottomPadding;

  const cell = useMemo(() => {
    const s1 = Math.floor(contentW / spec.cols);
    const s2 = Math.floor(playAreaH / spec.rows);
    return clamp(
      Math.min(s1, s2),
      isTiny ? 30 : isSmall ? 34 : 38,
      isTiny ? 52 : isSmall ? 56 : 60
    );
  }, [contentW, playAreaH, spec.cols, spec.rows, isTiny, isSmall]);

  const boardW = cell * spec.cols;
  const boardH = cell * spec.rows;

  const introImgW = clamp(Math.round(width * (isTiny ? 0.68 : isSmall ? 0.72 : 0.78)), 210, 420);
  const introImgH = clamp(Math.round(introImgW * 0.95), 190, 420);

  const bounds = useMemo(() => {
    let minC = 999;
    let maxC = -999;
    let minR = 999;
    let maxR = -999;

    for (const p of spec.tiles) {
      if (p.c < minC) minC = p.c;
      if (p.c > maxC) maxC = p.c;
      if (p.r < minR) minR = p.r;
      if (p.r > maxR) maxR = p.r;
    }

    if (spec.target.c < minC) minC = spec.target.c;
    if (spec.target.c > maxC) maxC = spec.target.c;
    if (spec.target.r < minR) minR = spec.target.r;
    if (spec.target.r > maxR) maxR = spec.target.r;

    const spanC = maxC - minC + 1;
    const spanR = maxR - minR + 1;

    const freeC = Math.max(0, spec.cols - spanC);
    const freeR = Math.max(0, spec.rows - spanR);

    const offsetC = Math.floor(freeC / 2) - minC;
    const offsetR = Math.floor(freeR / 2) - minR;

    return { offsetC, offsetR };
  }, [spec.tiles, spec.target, spec.cols, spec.rows]);

  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] });
  const timerScale = timerPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
  };

  const start = () => {
    setStage('play');
    setFoundTarget(false);
    setTargetPressed(false);
    setWrongKey(null);
    setTimeLeft(ROUND_SECONDS);
  };

  const flashWrong = (key: string) => {
    setWrongKey(key);
    setTimeout(() => {
      setWrongKey((cur) => (cur === key ? null : cur));
    }, 650);
  };

  const unlockTrophyIfNeeded = async (justCompletedLevel: number) => {
    if (justCompletedLevel % 10 !== 0) return;
    const trophyId = clampInt(justCompletedLevel / 10, 1, 5);
    if (trophies.includes(trophyId)) return;

    const nextTrophies = uniq([...trophies, trophyId]).sort((a, b) => a - b);
    setTrophies(nextTrophies);
    await writeProgress({ currentLevel: level, trophies: nextTrophies });
  };

  const nextLevel = async () => {
    await unlockTrophyIfNeeded(level);

    if (level >= TOTAL_LEVELS) {
      goHome();
      return;
    }

    const next = level + 1;
    setLevel(next);
    setStage('play');
    setFoundTarget(false);
    setTargetPressed(false);
    setWrongKey(null);
    setTimeLeft(ROUND_SECONDS);

    await writeProgress({ currentLevel: next, trophies });
  };

  const tryAgain = () => {
    setStage('play');
    setFoundTarget(false);
    setTargetPressed(false);
    setWrongKey(null);
    setTimeLeft(ROUND_SECONDS);
  };

  const onTilePress = (p: Pos) => {
    if (stage !== 'play') return;
    if (foundTarget) return;
    if (timeLeft <= 0) return;

    const isTarget = p.c === spec.target.c && p.r === spec.target.r;

    if (isTarget) {
      setFoundTarget(true);
      setTargetPressed(true);

      Animated.sequence([
        Animated.timing(pop, { toValue: 1.05, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();

      setTimeout(() => setStage('resultWin'), 520);
    } else {
      flashWrong(`${p.c}-${p.r}`);
    }
  };

  if (!loaded) {
    return (
      <ImageBackground source={require('../assets/loader_bg.png')} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.centerFill}>
            <Text style={styles.loadingTxt}>Loading…</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (stage === 'intro') {
    const btnLabel = level > 1 ? `Continue (Level ${level})` : 'Start';

    return (
      <ImageBackground source={require('../assets/loader_bg.png')} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={[styles.topBarWrap, { paddingTop: contentPadTop }]}>
            <View style={[styles.topBar, { width: Math.min(width - 24, 520), marginTop: topBarMarginTop }]}>
              <Pressable onPress={goHome} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]} hitSlop={10}>
                <Text style={styles.backTxt}>←</Text>
              </Pressable>

              <Text style={styles.topTitle}>Main Quest</Text>

              <View style={styles.backGhost} />
            </View>
          </View>

          <View style={[styles.centerFill, { paddingBottom: bottomPadding }]}>
            <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
              <Image
                source={require('../assets/quest_intro.png')}
                style={{ width: introImgW, height: introImgH, alignSelf: 'center' }}
                resizeMode="contain"
              />

              <View style={{ height: isTiny ? 12 : 16 }} />

              <Pressable onPress={start} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
                <Text style={styles.primaryText}>{btnLabel}</Text>
              </Pressable>

              <Text style={[styles.hintText, { marginTop: isTiny ? 10 : 12 }]}>
                Find the fourleaf before time runs out.
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (stage === 'resultWin') {
    return (
      <ImageBackground source={require('../assets/win_bg.png')} style={styles.bg} resizeMode="cover">
        <View style={styles.overlaySoft} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={[styles.centerFill, { paddingBottom: bottomPadding, paddingHorizontal: 18 }]}>
            <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
              <Image
                source={require('../assets/gnome_win.png')}
                style={{
                  width: isTiny ? 210 : isSmall ? 235 : 270,
                  height: isTiny ? 260 : isSmall ? 295 : 340,
                  alignSelf: 'center',
                }}
                resizeMode="contain"
              />

              <Text style={[styles.resultTitle, { marginTop: 6 }]}>Level Complete</Text>
              <Text style={styles.resultSub}>You caught the fourleaf in time!</Text>

              <View style={{ height: isTiny ? 12 : 16 }} />

              <View style={[styles.resultButtonsRow, { width: Math.min(width - 48, 420) }]}>
                <Pressable onPress={goHome} style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}>
                  <Text style={styles.iconBtnTxt}>⌂</Text>
                </Pressable>

                <Pressable onPress={nextLevel} style={({ pressed }) => [styles.primaryBtnWide, pressed && styles.btnPressed]}>
                  <Text style={styles.primaryText}>{level >= TOTAL_LEVELS ? 'Finish' : 'Next Level'}</Text>
                </Pressable>
              </View>

              {level % 10 === 0 ? <Text style={styles.trophyHint}>Trophy unlocked! Check Trophy Shelf.</Text> : null}
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (stage === 'resultLose') {
    return (
      <ImageBackground source={require('../assets/lose_bg.png')} style={styles.bg} resizeMode="cover">
        <View style={styles.overlaySoft} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={[styles.centerFill, { paddingBottom: bottomPadding, paddingHorizontal: 18 }]}>
            <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
              <Image
                source={require('../assets/gnome_lose.png')}
                style={{
                  width: isTiny ? 210 : isSmall ? 235 : 270,
                  height: isTiny ? 260 : isSmall ? 295 : 340,
                  alignSelf: 'center',
                }}
                resizeMode="contain"
              />

              <Text style={[styles.resultTitle, { color: '#b20d0d', marginTop: 6 }]}>Game Over</Text>
              <Text style={styles.resultSub}>Time is up.</Text>

              <View style={{ height: isTiny ? 12 : 16 }} />

              <View style={[styles.resultButtonsRow, { width: Math.min(width - 48, 420) }]}>
                <Pressable onPress={goHome} style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}>
                  <Text style={styles.iconBtnTxt}>⌂</Text>
                </Pressable>

                <Pressable onPress={tryAgain} style={({ pressed }) => [styles.primaryBtnWide, pressed && styles.btnPressed]}>
                  <Text style={styles.primaryText}>Try Again</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../assets/loader_bg.png')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.topBarWrap, { paddingTop: contentPadTop }]}>
          <View style={[styles.topBar, { width: Math.min(width - 24, 520), marginTop: topBarMarginTop }]}>
            <Pressable onPress={goHome} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]} hitSlop={10}>
              <Text style={styles.backTxt}>←</Text>
            </Pressable>

            <Text style={styles.topTitle}>{`Level ${level}`}</Text>

            <Animated.View style={[styles.timerPill, { transform: [{ scale: timerScale }] }]}>
              <Text style={styles.timerText}>{timeLeft}</Text>
            </Animated.View>
          </View>
        </View>

        <View
          style={[
            styles.playArea,
            {
              paddingTop: playBottomPadding / 2,
              paddingBottom: playBottomPadding / 2,
            },
          ]}
        >
          <Animated.View
            style={{
              width: boardW,
              height: boardH,
              opacity: fade,
              transform: [{ translateY: lift }, { scale: pop }, { scale: breatheScale }],
            }}
          >
            {spec.tiles.map((t) => {
              const key = `${t.c}-${t.r}`;
              const isTarget = t.c === spec.target.c && t.r === spec.target.r;

              const glowGreen = targetPressed && isTarget;
              const flashRed = wrongKey === key;

              return (
                <Pressable
                  key={key}
                  onPress={() => onTilePress(t)}
                  style={[
                    styles.tile,
                    {
                      width: cell,
                      height: cell,
                      left: (t.c + bounds.offsetC) * cell,
                      top: (t.r + bounds.offsetR) * cell,
                    },
                    glowGreen && styles.tileGlow,
                    flashRed && styles.tileWrong,
                  ]}
                >
                  <Image
                    source={isTarget ? require('../assets/clover_4.png') : require('../assets/clover_3.png')}
                    style={{ width: cell * 0.78, height: cell * 0.78 }}
                    resizeMode="contain"
                  />
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}


function getLevelSpec(level: number): LevelSpec {
  const base = getBaseSpec(((level - 1) % 10) + 1);

  const dx = ((level * 3) % 3) - 1;
  const dy = ((level * 5) % 3) - 1;

  const maxC = base.cols - 1;
  const maxR = base.rows - 1;

  const tiles = base.tiles.map((p) => ({
    c: clampInt(p.c + dx, 0, maxC),
    r: clampInt(p.r + dy, 0, maxR),
  }));

  const tdx = ((level * 7) % 3) - 1;
  const tdy = ((level * 11) % 3) - 1;

  const target = {
    c: clampInt(base.target.c + dx + tdx, 0, maxC),
    r: clampInt(base.target.r + dy + tdy, 0, maxR),
  };

  if (!tiles.some((p) => p.c === target.c && p.r === target.r)) {
    tiles.push({ c: target.c, r: target.r });
  }

  return { ...base, tiles: uniqPos(tiles), target };
}

function getBaseSpec(i: number): LevelSpec {
  const L: Record<number, LevelSpec> = {
    1: {
      cols: 7,
      rows: 9,
      tiles: [
        { c: 2, r: 2 }, { c: 3, r: 2 }, { c: 4, r: 2 },
        { c: 2, r: 3 }, { c: 3, r: 3 }, { c: 4, r: 3 },
        { c: 1, r: 4 }, { c: 2, r: 4 }, { c: 3, r: 4 }, { c: 4, r: 4 }, { c: 5, r: 4 },
        { c: 2, r: 5 }, { c: 3, r: 5 }, { c: 4, r: 5 },
        { c: 2, r: 6 }, { c: 3, r: 6 }, { c: 4, r: 6 },
      ],
      target: { c: 4, r: 4 },
    },
    2: { cols: 8, rows: 9, tiles: box(1, 2, 6, 6), target: { c: 2, r: 7 } },
    3: {
      cols: 8,
      rows: 9,
      tiles: box(1, 2, 6, 6).filter((t) => !((t.c === 2 && t.r === 3) || (t.c === 5 && t.r === 6))),
      target: { c: 6, r: 4 },
    },
    4: {
      cols: 7,
      rows: 9,
      tiles: [
        { c: 0, r: 2 }, { c: 6, r: 2 },
        { c: 1, r: 4 }, { c: 5, r: 4 },
        { c: 2, r: 5 }, { c: 3, r: 5 }, { c: 4, r: 5 },
        { c: 2, r: 6 }, { c: 3, r: 6 }, { c: 4, r: 6 },
        { c: 1, r: 7 }, { c: 5, r: 7 },
        { c: 0, r: 8 }, { c: 6, r: 8 },
      ],
      target: { c: 3, r: 5 },
    },
    5: { cols: 9, rows: 10, tiles: box(1, 2, 7, 7), target: { c: 1, r: 2 } },
    6: { cols: 9, rows: 10, tiles: box(1, 2, 7, 7), target: { c: 7, r: 8 } },
    7: { cols: 9, rows: 10, tiles: diamond(4, 5, 4), target: { c: 4, r: 7 } },
    8: {
      cols: 9,
      rows: 10,
      tiles: [...box(2, 2, 5, 2), ...box(2, 4, 5, 2), ...box(2, 6, 5, 2), ...row(1, 7, 7, 8)],
      target: { c: 6, r: 2 },
    },
    9: {
      cols: 9,
      rows: 10,
      tiles: box(1, 2, 7, 7).filter((t) => !((t.c === 4 && t.r === 4) || (t.c === 4 && t.r === 6))),
      target: { c: 2, r: 6 },
    },
    10: {
      cols: 9,
      rows: 10,
      tiles: box(1, 2, 7, 7).filter(
        (t) => !((t.c === 3 && t.r === 3) || (t.c === 5 && t.r === 5) || (t.c === 4 && t.r === 6))
      ),
      target: { c: 6, r: 6 },
    },
  };

  return L[i] ?? L[1];
}

function box(left: number, top: number, w: number, h: number): Pos[] {
  const out: Pos[] = [];
  for (let r = top; r < top + h; r++) for (let c = left; c < left + w; c++) out.push({ c, r });
  return out;
}

function row(left: number, _top: number, w: number, r: number): Pos[] {
  const out: Pos[] = [];
  for (let c = left; c < left + w; c++) out.push({ c, r });
  return out;
}

function diamond(cx: number, cy: number, radius: number): Pos[] {
  const out: Pos[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    const span = radius - Math.abs(dy);
    for (let dx = -span; dx <= span; dx++) out.push({ c: cx + dx, r: cy + dy });
  }
  return out;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function clampInt(v: number, min: number, max: number) {
  const n = Math.floor(v);
  return Math.max(min, Math.min(max, n));
}

function uniq(arr: number[]) {
  return Array.from(new Set(arr));
}

function uniqPos(arr: Pos[]) {
  const s = new Set<string>();
  const out: Pos[] = [];
  for (const p of arr) {
    const k = `${p.c}-${p.r}`;
    if (s.has(k)) continue;
    s.add(k);
    out.push(p);
  }
  return out;
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  overlaySoft: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },

  topBarWrap: { paddingHorizontal: 12 },
  topBar: {
    alignSelf: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(180, 195, 90, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    width: 40,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { color: '#1b1b1b', fontSize: 18, fontWeight: '900' },
  backGhost: { width: 40, height: 34 },

  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#111',
    fontWeight: '900',
    fontSize: 14.5,
  },

  timerPill: {
    minWidth: 44,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  timerText: { color: '#111', fontWeight: '900', fontSize: 14 },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  loadingTxt: { color: 'rgba(255,255,255,0.9)', fontWeight: '900' },

  hintText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 18,
  },

  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(35, 25, 12, 0.55)',
    borderWidth: 1.2,
    borderColor: 'rgba(220, 150, 40, 0.55)',
  },

  tileGlow: {
    backgroundColor: 'rgba(10, 255, 90, 0.28)',
    borderColor: 'rgba(10, 255, 90, 1)',
    borderWidth: 2.6,
    shadowColor: '#00ff66',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },

  tileWrong: {
    backgroundColor: 'rgba(255, 50, 50, 0.22)',
    borderColor: 'rgba(255, 60, 60, 0.95)',
    borderWidth: 2,
    shadowColor: '#ff3b30',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },

  primaryBtn: {
    alignSelf: 'center',
    height: 40,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: '#f2c34a',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnWide: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#f2c34a',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  primaryText: { color: '#1a1a1a', fontWeight: '900', fontSize: 14.5 },

  resultTitle: { color: '#2a7bff', fontWeight: '900', fontSize: 28, textAlign: 'center' },
  resultSub: { color: 'rgba(255,255,255,0.9)', marginTop: 8, fontSize: 13.5, textAlign: 'center' },

  trophyHint: {
    marginTop: 12,
    textAlign: 'center',
    color: 'rgba(242,195,74,0.95)',
    fontWeight: '800',
    fontSize: 12.5,
  },

  resultButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
  },
  iconBtn: {
    width: 44,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#f2c34a',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnTxt: { color: '#1a1a1a', fontWeight: '900', fontSize: 16 },
});
