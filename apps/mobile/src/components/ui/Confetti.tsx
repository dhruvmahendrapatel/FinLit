import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const COLORS = ["#5B4DFF", "#FFC233", "#FF6B6B", "#14B8A6", "#EC4899", "#22C55E", "#3DA9FC"];

interface PieceSpec {
  x: number;
  delay: number;
  color: string;
  size: number;
  drift: number;
  spin: number;
}

function Piece({ spec, height }: { spec: PieceSpec; height: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(spec.delay, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }));
  }, [progress, spec.delay]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 + progress.value * (height + 80) },
      { translateX: Math.sin(progress.value * Math.PI * 2) * spec.drift },
      { rotate: `${progress.value * spec.spin}deg` },
    ],
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        { left: spec.x, width: spec.size, height: spec.size * 0.6, backgroundColor: spec.color, borderRadius: spec.size * 0.2 },
        style,
      ]}
    />
  );
}

/** Deterministic 0–1 noise so render stays pure; different per piece and per axis. */
function noise(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A one-shot confetti shower. Re-mount (change `key`) to fire again. */
export function Confetti({ count = 28 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo<PieceSpec[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i / count) * width + (noise(i, 1) - 0.5) * 40,
        delay: noise(i, 2) * 500,
        color: COLORS[i % COLORS.length] ?? "#5B4DFF",
        size: 10 + noise(i, 3) * 10,
        drift: 20 + noise(i, 4) * 50,
        spin: 360 + noise(i, 5) * 720,
      })),
    [count, width],
  );
  return (
    <View pointerEvents="none" style={styles.layer}>
      {pieces.map((p, i) => (
        <Piece key={i} spec={p} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", zIndex: 999 },
  piece: { position: "absolute", top: 0 },
});
