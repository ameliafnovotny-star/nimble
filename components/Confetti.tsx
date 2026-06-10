import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFC300', '#A29BFE', '#FF8E53', '#2ECC71', '#E91E63'];
const PIECE_COUNT = 90;

interface Piece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  startX: number;
  w: number;
  h: number;
  isCircle: boolean;
}

interface Props {
  active: boolean;
  onDone: () => void;
}

export function Confetti({ active, onDone }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;

    const { width: screenW, height: screenH } = Dimensions.get('window');

    const newPieces: Piece[] = Array.from({ length: PIECE_COUNT }, (_, id) => ({
      id,
      x: new Animated.Value(0),
      y: new Animated.Value(-10),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      startX: Math.random() * screenW,
      w: Math.random() * 8 + 5,
      h: Math.random() * 14 + 6,
      isCircle: Math.random() > 0.6,
    }));

    setPieces(newPieces);

    requestAnimationFrame(() => {
      const animations = newPieces.map((p) => {
        const duration = Math.random() * 1400 + 1800;
        const spread = (Math.random() - 0.5) * 360;
        const rotTarget = Math.random() > 0.5 ? 720 : -720;
        return Animated.parallel([
          Animated.timing(p.y, { toValue: screenH + 60, duration, useNativeDriver: true }),
          Animated.timing(p.x, { toValue: spread, duration, useNativeDriver: true }),
          Animated.timing(p.rotate, { toValue: rotTarget, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(duration * 0.55),
            Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.45, useNativeDriver: true }),
          ]),
        ]);
      });

      Animated.parallel(animations).start(() => {
        setPieces([]);
        onDone();
      });
    });
  }, [active]);

  if (!pieces.length) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.startX,
            top: 0,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? p.w / 2 : 2,
            opacity: p.opacity,
            transform: [
              { translateY: p.y },
              { translateX: p.x },
              { rotate: p.rotate.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
