import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedTales'>;

const SAVED_KEY = 'lepre_tales_saved_v1';

type Tale = { id: number; title: string; body: string };

const TALES: Tale[] = [
  {
    id: 1,
    title: 'The Whispering Leaf',
    body:
      'Deep in the forest, a lonely clover whispered to the wind that it wished to grow an extra leaf. The wind chuckled, spun around it, and said, “Work hard and stay patient.”\n\nA season later, the forest awoke to find a fourleaf shining brighter than morning dew.',
  },
  {
    id: 2,
    title: 'The Leprechaun’s Lantern',
    body:
      'One night, a leprechaun lost his way in the fog. He grabbed a clover, whispered a secret rhyme, and it began to glow like a lantern.\n\nEver since, the forest keeps a few glowing clovers hidden—only for those who truly need them.',
  },
  {
    id: 3,
    title: 'The Clover Knight',
    body:
      'A brave squirrel declared himself the “Clover Knight” and vowed to protect the rare fourleaf.\n\nHe guarded it fiercely… until he forgot where he put it.\n\nThey say it’s still somewhere in the grove. Keep searching.',
  },
  {
    id: 4,
    title: 'The Elder Tree’s Gift',
    body:
      'Once, an ancient oak tree shed a single golden leaf. Wherever it landed, clovers grew taller and greener than ever.\n\nSome believe that when clovers sparkle unusually bright, the oak’s magic is still there.',
  },
  {
    id: 5,
    title: 'The Trickster’s Test',
    body:
      'A leprechaun once challenged a fox:\n\n“If you find the fourleaf before sunset, I’ll grant you a wish.”\n\nThe fox searched all day but failed.\n\nHis wish? “Let me try again tomorrow.”\n\nThe leprechaun laughed and agreed.',
  },
  {
    id: 6,
    title: 'The Sleepy Clover Patch',
    body:
      'A patch of clovers loved to nap in the sun. One day, while dozing, one of them stretched… and accidentally grew an extra leaf.\n\nThe others never let it forget this “accidental achievement.”',
  },
  {
    id: 7,
    title: 'The Rainbow’s Secret',
    body:
      'After every rainbow, a hidden fourleaf sprouts somewhere beneath its final glow.\n\nLeprechauns call it “rainbow-born magic.”\n\nYou never know which patch it chooses.',
  },
  {
    id: 8,
    title: 'The Curious Caterpillar',
    body:
      'A tiny caterpillar wanted to see the world but was afraid to leave his leaf.\n\nA wise fourleaf told him, “Courage grows when you do.”\n\nHe crawled off—and returned as a butterfly.',
  },
  {
    id: 9,
    title: 'The Shy Fourleaf',
    body:
      'Some fourleafs don’t want to be found.\n\nThey blush a deeper green and hide behind taller clovers.\n\nBut when someone kind-hearted approaches, they quietly turn toward the light.',
  },
  {
    id: 10,
    title: 'The Forest’s Promise',
    body:
      'Long ago, the forest made a promise:\n\n“For every kind act, a fourleaf shall rise.”\n\nSince then, patches bloom unexpectedly—especially where kindness has taken root.',
  },
];

const BG_IMG = require('../assets/win_bg.png');
const GNOME_IMG = require('../assets/gnome_win.png');

function uniq(arr: number[]) {
  return Array.from(new Set(arr));
}

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(i, len - 1));
}

function pickNextIndex(current: number, len: number) {
  if (len <= 1) return 0;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * len);
  return next;
}

export default function SavedTalesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTiny = width < 350 || height < 690;
  const isSmall = width < 380 || height < 740;

  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
  };

  const loadSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_KEY);
      if (!raw) {
        setSavedIds([]);
        setLoaded(true);
        setIndex(0);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      const arr = Array.isArray(parsed) ? parsed : [];
      const cleaned = arr.filter((n) => Number.isFinite(n)).map((n) => Math.floor(Number(n)));
      setSavedIds(uniq(cleaned));
      setLoaded(true);
      setIndex(0);
    } catch {
      setSavedIds([]);
      setLoaded(true);
      setIndex(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadSaved();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [loadSaved]);

  const savedTales = useMemo(() => TALES.filter((t) => savedIds.includes(t.id)), [savedIds]);
  const hasAny = loaded && savedTales.length > 0;

  const tale = useMemo(() => {
    if (!hasAny) return null;
    const safe = clampIndex(index, savedTales.length);
    return savedTales[safe] ?? savedTales[0];
  }, [hasAny, index, savedTales]);

  useEffect(() => {
    if (!hasAny) return;
    if (index <= savedTales.length - 1) return;
    setIndex(0);
  }, [hasAny, index, savedTales.length]);

  const saveNow = async (nextIds: number[]) => {
    setSavedIds(nextIds);
    try {
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(nextIds));
    } catch {}
  };

  const animateSwap = (after: () => void) => {
    fade.stopAnimation();
    lift.stopAnimation();
    scale.stopAnimation();

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 10,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      after();
      lift.setValue(10);
      scale.setValue(0.985);

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const onNext = () => {
    if (!hasAny) return;
    animateSwap(() => {
      setIndex((i) => pickNextIndex(i, savedTales.length));
    });
  };

  const removeFromSaved = async () => {
    if (!tale) return;

    animateSwap(async () => {
      const nextIds = savedIds.filter((id) => id !== tale.id);
      await saveNow(nextIds);

      const nextSaved = savedTales.filter((t) => t.id !== tale.id);
      if (nextSaved.length <= 0) {
        setIndex(0);
        return;
      }
      setIndex((prev) => clampIndex(prev, nextSaved.length));
    });
  };

  const topBarW = Math.min(width - 24, 520);

  const cardW = Math.min(width - (isTiny ? 26 : isSmall ? 34 : 44), 560);
  const cardH = Math.round(height * (isTiny ? 0.30 : isSmall ? 0.32 : 0.33));
  const finalCardH = Math.max(cardH, isTiny ? 200 : 220);

  const padH = isTiny ? 16 : 18;
  const padV = isTiny ? 14 : 16;

  const titleSize = isTiny ? 18 : isSmall ? 19 : 20;
  const bodySize = isTiny ? 13 : isSmall ? 13.8 : 14.4;
  const lineH = isTiny ? 18 : isSmall ? 19 : 20;

  const maxBodyLines = isTiny ? 7 : isSmall ? 8 : 9;

  const gnomeW = isTiny ? 132 : isSmall ? 150 : 172;
  const gnomeH = Math.round(gnomeW * 1.12);

  const btnH = isTiny ? 36 : 38;
  const nextW = isTiny ? 116 : 124;
  const saveW = isTiny ? 54 : 56;

  const bottomPad = 18 + insets.bottom;
  const contentPadTop = Platform.OS === 'android' ? 6 : 0;

  return (
    <ImageBackground source={BG_IMG} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.topBarWrap, { paddingTop: contentPadTop }]}>
          <View style={[styles.topBar, { width: topBarW, marginTop: 16 }]}>
            <Pressable
              onPress={goHome}
              style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
              hitSlop={10}
            >
              <Text style={styles.backTxt}>←</Text>
            </Pressable>

            <Text style={styles.topTitle}>Saved Tales</Text>

            <View style={styles.backGhost} />
          </View>
        </View>

        <View style={[styles.content, { paddingBottom: bottomPad }]}>
          {!hasAny ? (
            <Text style={[styles.emptyTxt, { fontSize: isTiny ? 12.5 : 13.5 }]}>No saved tales yet.</Text>
          ) : (
            <>
              <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }, { scale }] }}>
                <View style={[styles.card, { width: cardW, height: finalCardH, paddingHorizontal: padH, paddingVertical: padV }]}>
                  <Text style={[styles.cardTitle, { fontSize: titleSize }]} numberOfLines={1} ellipsizeMode="tail">
                    {tale!.title}
                  </Text>

                  <View style={{ height: isTiny ? 10 : 12 }} />

                  <Text
                    style={[styles.cardBody, { fontSize: bodySize, lineHeight: lineH }]}
                    numberOfLines={maxBodyLines}
                    ellipsizeMode="tail"
                  >
                    {tale!.body}
                  </Text>
                </View>
              </Animated.View>

              <View style={[styles.bottomRow, { width: Math.min(width - 40, 520) }]}>
                <Image source={GNOME_IMG} style={{ width: gnomeW, height: gnomeH }} resizeMode="contain" />

                <View style={{ flex: 1 }} />

                <View style={[styles.btnRow, { gap: isTiny ? 10 : 12 }]}>
                  <Pressable
                    onPress={onNext}
                    style={({ pressed }) => [styles.nextBtn, { height: btnH, width: nextW }, pressed && styles.btnPressed]}
                  >
                    <Text style={styles.nextTxt}>Next</Text>
                  </Pressable>

                  <Pressable
                    onPress={removeFromSaved}
                    style={({ pressed }) => [
                      styles.saveBtn,
                      { height: btnH, width: saveW },
                      styles.saveBtnOn,
                      pressed && styles.btnPressed,
                    ]}
                    hitSlop={8}
                  >
                    <Text style={[styles.saveIcon, styles.saveIconOn]}>★</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },

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
  backTxt: { color: '#1b1b1b', fontSize: 18, fontWeight: 900 },
  backGhost: { width: 40, height: 34 },

  topTitle: { flex: 1, textAlign: 'center', color: '#111', fontWeight: 900, fontSize: 14.5 },

  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  emptyTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: 800,
    textAlign: 'center',
  },

  card: {
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(245, 214, 160, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: 'rgba(40,20,10,0.92)',
    fontWeight: 900,
    textAlign: 'center',
  },
  cardBody: {
    color: 'rgba(35,20,10,0.86)',
    fontWeight: 700,
    textAlign: 'center',
  },

  bottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 22,
  },

  nextBtn: {
    borderRadius: 999,
    backgroundColor: '#f2c34a',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  nextTxt: { color: '#1a1a1a', fontWeight: 900, fontSize: 14 },

  saveBtn: {
    borderRadius: 16,
    backgroundColor: '#f2c34a',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnOn: { backgroundColor: 'rgba(20, 120, 45, 0.70)', borderColor: 'rgba(20, 255, 110, 0.55)' },
  saveIcon: { color: '#1a1a1a', fontWeight: 900, fontSize: 20, marginTop: -1 },
  saveIconOn: { color: 'rgba(255,255,255,0.95)' },
});
