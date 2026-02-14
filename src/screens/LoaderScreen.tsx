import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

export default function LoaderScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<'web' | 'logo'>('web');

  const isSmall = height < 700 || width < 360;

  const boxSize = useMemo(() => {
    const base = Math.min(width, height);
    const s = Math.round(base * (isSmall ? 0.62 : 0.56));
    return clamp(s, isSmall ? 210 : 240, isSmall ? 320 : 360);
  }, [width, height, isSmall]);

  const logoSize = useMemo(() => clamp(Math.round(boxSize * 0.62), 120, 240), [boxSize]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 3000);
    const t2 = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigation]);

  const html = useMemo(() => getTreeLoaderHTML(), []);

  return (
    <ImageBackground
      source={require('../assets/loader_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={[styles.centerWrap, { paddingHorizontal: isSmall ? 16 : 24 }]}>
        <View style={[styles.centerBox, { width: boxSize, height: boxSize }]}>
          {phase === 'web' ? (
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={styles.web}
              scrollEnabled={false}
              javaScriptEnabled
              domStorageEnabled
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
            />
          ) : (
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/logo.png')}
                style={{ width: logoSize, height: logoSize }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <Text style={[styles.title, { marginTop: isSmall ? 14 : 18 }]}>Loading…</Text>
        <Text style={[styles.sub, { marginTop: 6, maxWidth: isSmall ? 260 : 320 }]}>
        </Text>
      </View>
    </ImageBackground>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getTreeLoaderHTML() {

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
      -webkit-text-size-adjust: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      background: transparent;
    }

    .tree {
      position: relative;
      width: 50px;
      height: 50px;
      transform-style: preserve-3d;
      transform: rotateX(-20deg) rotateY(30deg);
      animation: treeAnimate 5s linear infinite;
    }

    @keyframes treeAnimate {
      0% { transform: rotateX(-20deg) rotateY(360deg); }
      100% { transform: rotateX(-20deg) rotateY(0deg); }
    }

    .tree div {
      position: absolute;
      top: -50px;
      left: 0;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transform: translateY(calc(25px * var(--x))) translateZ(0px);
    }

    .tree div.branch span {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #69c069, #77dd77);
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
      border-bottom: 5px solid #00000019;
      transform-origin: bottom;
      transform: rotateY(calc(90deg * var(--i))) rotateX(30deg) translateZ(28.5px);
    }

    .tree div.stem span {
      position: absolute;
      top: 110px;
      left: calc(50% - 7.5px);
      width: 15px;
      height: 50%;
      background: linear-gradient(90deg, #bb4622, #df7214);
      border-bottom: 5px solid #00000019;
      transform-origin: bottom;
      transform: rotateY(calc(90deg * var(--i))) translateZ(7.5px);
    }

    .shadow {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 120px;
      height: 120px;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.35);
      filter: blur(18px);
      transform-style: preserve-3d;
      transform: translate(-50%, -50%) rotateX(90deg) translateZ(-65px);
      border-radius: 999px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="shadow"></div>

    <div class="tree">
      <div class="branch" style="--x:0">
        <span style="--i:0"></span><span style="--i:1"></span><span style="--i:2"></span><span style="--i:3"></span>
      </div>
      <div class="branch" style="--x:1">
        <span style="--i:0"></span><span style="--i:1"></span><span style="--i:2"></span><span style="--i:3"></span>
      </div>
      <div class="branch" style="--x:2">
        <span style="--i:0"></span><span style="--i:1"></span><span style="--i:2"></span><span style="--i:3"></span>
      </div>
      <div class="branch" style="--x:3">
        <span style="--i:0"></span><span style="--i:1"></span><span style="--i:2"></span><span style="--i:3"></span>
      </div>

      <div class="stem" style="--x:4">
        <span style="--i:0"></span><span style="--i:1"></span><span style="--i:2"></span><span style="--i:3"></span>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  centerBox: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },

  web: { flex: 1, backgroundColor: 'transparent' },

  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  sub: { color: '#d0d0d0', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
