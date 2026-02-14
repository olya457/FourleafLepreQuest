import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

type Page = {
  key: string;
  image: any;
  title: string;
  body: string;
  primary: string;
};

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = height < 700 || width < 360;

  const pages: Page[] = useMemo(
    () => [
      {
        key: 'p1',
        image: require('../assets/onb_1.png'),
        title: 'Welcome to the Lepre Quest',
        body:
          'Begin your journey into the enchanted forest and test your eyes in the hunt for the rare fourleaf clover.',
        primary: 'Start',
      },
      {
        key: 'p2',
        image: require('../assets/onb_2.png'),
        title: 'How the Main Quest Works',
        body:
          'Each level hides one fourleaf clover among many look-alikes. Find it before time runs out.',
        primary: 'Next',
      },
      {
        key: 'p3',
        image: require('../assets/onb_3.png'),
        title: 'Earn Trophies & Unlock Tales',
        body:
          'Complete levels to earn trophies and unlock new LepreTales. Every victory brings a new story closer.',
        primary: 'Next',
      },
      {
        key: 'p4',
        image: require('../assets/onb_4.png'),
        title: 'Save Your Favorite Tales',
        body:
          'Collect the tales you love most. Save them and return anytime for a little dash of leprechaun magic.',
        primary: 'Begin the Quest',
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const animateIn = () => {
    fade.setValue(0);
    slide.setValue(10);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const next = () => {
    if (idx >= pages.length - 1) {
      goHome();
      return;
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: -6,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIdx((v) => v + 1);
      animateIn();
    });
  };

  const page = pages[idx];

  const topImageH = clamp(Math.round(height * (isSmall ? 0.54 : 0.60)), isSmall ? 300 : 360, isSmall ? 420 : 520);
  const topImageW = width * (isSmall ? 0.86 : 0.88);

  const containerWidth = Math.min(width - (isSmall ? 32 : 48), 420);

  const cardPaddingH = isSmall ? 14 : 18;
  const cardPaddingTop = isSmall ? 14 : 18;
  const cardPaddingBottom = isSmall ? 12 : 14;

  const titleSize = isSmall ? 17.5 : 20;
  const bodySize = isSmall ? 12.2 : 13.5;

  const bottomPad = 30 + insets.bottom; 

  return (
    <ImageBackground source={require('../assets/loader_bg.png')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.page}>
          <Animated.View
            style={[
              styles.topWrap,
              {
                opacity: fade,
                transform: [{ translateY: slide }],
                paddingTop: Platform.OS === 'android' ? 6 : 0,
              },
            ]}
          >
            <Image source={page.image} style={[styles.topImage, { width: topImageW, height: topImageH }]} resizeMode="contain" />
          </Animated.View>

          <View style={[styles.bottomWrap, { paddingBottom: bottomPad, paddingHorizontal: isSmall ? 16 : 24 }]}>
            <Animated.View
              style={[
                styles.card,
                {
                  width: containerWidth,
                  paddingHorizontal: cardPaddingH,
                  paddingTop: cardPaddingTop,
                  paddingBottom: cardPaddingBottom,
                  opacity: fade,
                  transform: [{ translateY: slide }],
                },
              ]}
            >
              <Text style={[styles.cardTitle, { fontSize: titleSize }]}>{page.title}</Text>
              <Text style={[styles.cardBody, { fontSize: bodySize }]}>{page.body}</Text>

              <View style={{ height: isSmall ? 12 : 14 }} />

              <Pressable onPress={next} style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}>
                <Text style={styles.primaryText}>{page.primary}</Text>
              </Pressable>

              {idx < 3 ? (
                <Pressable onPress={goHome} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
              ) : (
                <View style={{ height: 18 }} />
              )}
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.30)' },
  safe: { flex: 1 },

  page: { flex: 1 },

  topWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topImage: { borderRadius: 22 },

  bottomWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  card: {
    borderRadius: 22,
    backgroundColor: 'rgba(10, 60, 20, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 60, 0.65)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  cardTitle: {
    color: '#f7d26a',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  cardBody: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 18,
  },

  primaryBtn: {
    alignSelf: 'center',
    height: 34,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#f2c34a',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  primaryText: { color: '#1a1a1a', fontWeight: '900', fontSize: 13.5 },

  skipBtn: { marginTop: 10, alignSelf: 'center' },
  skipText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12.5 },
});
