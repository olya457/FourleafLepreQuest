import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrophyShelf'>;

const STORAGE_KEY = 'mq_progress_v1';

type ProgressState = {
  currentLevel: number;
  trophies: number[];
};

type TrophyItem = {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  image: any;
};

export default function TrophyShelfScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTiny = width < 350 || height < 690;
  const isSmall = width < 380 || height < 740;

  const [trophies, setTrophies] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  const contentPadTop = Platform.OS === 'android' ? 6 : 0;
  const topBarMarginTop = 6 + 10;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (!raw) {
          setTrophies([]);
          setLoaded(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<ProgressState>;
        const t = Array.isArray(parsed.trophies)
          ? parsed.trophies
              .filter((n) => Number.isFinite(n))
              .map((n) => clampInt(Number(n), 1, 5))
          : [];

        setTrophies(uniq(t));
        setLoaded(true);
      } catch {
        setTrophies([]);
        setLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const items: TrophyItem[] = useMemo(
    () => [
      { id: 1, title: 'Forest Seeker Trophy', image: require('../assets/trophy_1.png') },
      { id: 2, title: 'Forest Seeker Trophy', image: require('../assets/trophy_2.png') },
      { id: 3, title: 'Forest Seeker Trophy', image: require('../assets/trophy_3.png') },
      { id: 4, title: 'Forest Seeker Trophy', image: require('../assets/trophy_4.png') },
      { id: 5, title: 'Forest Seeker Trophy', image: require('../assets/trophy_5.png') },
    ],
    []
  );

  const topBarW = Math.min(width - 24, 520);
  const containerW = Math.min(width - (isTiny ? 22 : isSmall ? 28 : 40), 440);

  const hasAny = loaded && trophies.length > 0;
  const unlockedItems = items.filter((it) => trophies.includes(it.id));

  const frameSize = isTiny ? 78 : isSmall ? 86 : 92;
  const iconSize = Math.round(frameSize * 0.68);

  const gap = isTiny ? 14 : isSmall ? 18 : 22;
  const titlePillW = Math.min(containerW, isTiny ? 240 : 260);

  const bottomPadding = 22 + insets.bottom;

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' as never }] });
  };

  return (
    <ImageBackground source={require('../assets/loader_bg.png')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.topBarWrap, { paddingTop: contentPadTop }]}>
          <View style={[styles.topBar, { width: topBarW, marginTop: topBarMarginTop }]}>
            <Pressable onPress={goHome} style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]} hitSlop={10}>
              <Text style={styles.backTxt}>←</Text>
            </Pressable>

            <Text style={styles.topTitle}>Trophies</Text>

            <View style={styles.backGhost} />
          </View>
        </View>

        <View style={[styles.content, { paddingBottom: bottomPadding }]}>
          {!hasAny ? (
            <Text style={[styles.emptyTxt, { fontSize: isTiny ? 12.5 : 13.5 }]}>You don’t have any trophies...</Text>
          ) : (
            <View style={{ width: containerW, alignItems: 'center', gap }}>
              {unlockedItems.map((it) => (
                <View key={it.id} style={styles.trophyBlock}>
                  <View
                    style={[
                      styles.trophyFrame,
                      {
                        width: frameSize,
                        height: frameSize,
                        borderRadius: isTiny ? 16 : 18,
                      },
                    ]}
                  >
                    <Image source={it.image} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
                  </View>

                  <View style={{ height: isTiny ? 8 : 10 }} />

                  <View style={[styles.namePill, { width: titlePillW, height: isTiny ? 32 : 34 }]}>
                    <Text style={[styles.nameTxt, { fontSize: isTiny ? 12 : 12.5 }]} numberOfLines={1}>
                      {it.title}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function uniq(arr: number[]) {
  return Array.from(new Set(arr));
}

function clampInt(v: number, min: number, max: number) {
  const n = Math.floor(v);
  return Math.max(min, Math.min(max, n));
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },

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

  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  emptyTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    textAlign: 'center',
  },

  trophyBlock: { alignItems: 'center' },

  trophyFrame: {
    backgroundColor: 'rgba(20, 120, 45, 0.65)',
    borderWidth: 2,
    borderColor: 'rgba(20, 255, 110, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  namePill: {
    borderRadius: 10,
    backgroundColor: 'rgba(70, 45, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  nameTxt: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
  },
});
