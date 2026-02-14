import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = height < 700 || width < 360;

  const logoAnim = useRef(new Animated.Value(0)).current;
  const btnsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    logoAnim.setValue(0);
    btnsAnim.setValue(0);

    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(btnsAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoAnim, btnsAnim]);

  const contentMaxW = Math.min(width - (isSmall ? 28 : 40), 420);

  const logoW = useMemo(() => {
    const base = Math.round(width * (isSmall ? 0.72 : 0.78));
    return clamp(base, 240, 360);
  }, [width, isSmall]);

  const logoH = useMemo(() => {
    const base = Math.round(height * (isSmall ? 0.28 : 0.30));
    return clamp(base, 170, 250);
  }, [height, isSmall]);

  const btnH = isSmall ? 52 : 58;
  const btnRadius = 24;
  const btnGap = isSmall ? 14 : 16;

  const topOffset = Math.max(insets.top, 10) + (Platform.OS === 'android' ? 10 : 4);

  return (
    <ImageBackground source={require('../assets/loader_bg.png')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.wrap, { paddingTop: topOffset, paddingBottom: insets.bottom + 26 }]}>
          <View style={{ width: contentMaxW, alignSelf: 'center' }}>
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: logoAnim,
                  transform: [
                    {
                      translateY: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                    },
                    {
                      scale: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('../assets/logo.png')}
                style={{ width: logoW, height: logoH }}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.buttonsWrap,
                {
                  opacity: btnsAnim,
                  transform: [
                    {
                      translateY: btnsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <GoldButton
                title="Main Quest"
                height={btnH}
                radius={btnRadius}
                onPress={() => navigation.navigate('MainQuest')}
              />
              <View style={{ height: btnGap }} />
              <GoldButton
                title="Trophy Shelf"
                height={btnH}
                radius={btnRadius}
                onPress={() => navigation.navigate('TrophyShelf')}
              />
              <View style={{ height: btnGap }} />
              <GoldButton
                title="LepreTales"
                height={btnH}
                radius={btnRadius}
                onPress={() => navigation.navigate('LepreTales')}
              />
              <View style={{ height: btnGap }} />
              <GoldButton
                title="Saved Tales"
                height={btnH}
                radius={btnRadius}
                onPress={() => navigation.navigate('SavedTales')}
              />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function GoldButton({
  title,
  onPress,
  height,
  radius,
}: {
  title: string;
  onPress: () => void;
  height: number;
  radius: number;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { height, borderRadius: radius }, pressed && styles.btnPressed]}>
      <View style={[styles.btnInner, { borderRadius: radius - 2 }]}>
        <Text style={styles.btnText}>{title}</Text>
      </View>
    </Pressable>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const GOLD = '#F2C34A';
const GOLD_SOFT = 'rgba(242,195,74,0.55)';

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  safe: { flex: 1 },

  wrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  buttonsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },

  btn: {
    width: '100%',
    borderWidth: 2,
    borderColor: GOLD_SOFT,
    backgroundColor: 'rgba(0,0,0,0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  },
  btnInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  btnText: {
    color: GOLD,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
