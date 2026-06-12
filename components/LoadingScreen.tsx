import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { APP_COLORS } from '../constants/Colors';

export function LoadingScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.name}>Nimble</Text>
        <Text style={styles.tagline}>Your fitness, your way</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 22,
    marginBottom: 4,
  },
  name: {
    fontSize: 36,
    fontWeight: '700',
    color: APP_COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
});
