import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import { useFitnessStore } from '../store/useStore';

const { width } = Dimensions.get('window');

const SLIDES: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  color: string;
}[] = [
  {
    icon: 'barbell-outline',
    title: 'Welcome to Nimble',
    description: 'Your personal fitness tracker. Build workouts, schedule your week, and watch your progress grow.',
    color: APP_COLORS.primary,
  },
  {
    icon: 'calendar-outline',
    title: 'Calendar',
    description: 'Schedule your workouts by day and see your entire training plan at a glance.',
    color: '#4ECDC4',
  },
  {
    icon: 'play-circle-outline',
    title: 'Current',
    description: 'Start a live session and track every set as you go, with a built-in timer.',
    color: '#FF6B6B',
  },
  {
    icon: 'barbell-outline',
    title: 'Workouts',
    description: 'Create and organize your workouts with custom exercises, sets, reps, and weights.',
    color: '#45B7D1',
  },
  {
    icon: 'sparkles-outline',
    title: 'Trainer',
    description: 'Get smart suggestions to improve your workout structure and muscle balance.',
    color: '#FFC300',
  },
  {
    icon: 'trending-up-outline',
    title: 'Progress',
    description: 'View your session history, volume over time, and personal records.',
    color: '#2ECC71',
  },
  {
    icon: 'person-circle-outline',
    title: 'Account',
    description: 'Sign in to back up your data to the cloud and sync across all your devices.',
    color: '#A29BFE',
  },
];

export function OnboardingModal() {
  const hasSeenOnboarding = useFitnessStore((s) => s.hasSeenOnboarding);
  const markOnboardingSeen = useFitnessStore((s) => s.markOnboardingSeen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      markOnboardingSeen();
    }
  };

  const onScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  if (hasSeenOnboarding) return null;

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          style={styles.scroller}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={styles.slide}>
              <View style={[styles.iconCircle, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon} size={56} color={s.color} />
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.description}>{s.description}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex && { backgroundColor: APP_COLORS.primary, width: 20 },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={goToNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>

          {!isLast && (
            <TouchableOpacity onPress={markOnboardingSeen} activeOpacity={0.7}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroller: { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: APP_COLORS.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.border,
  },
  btn: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: {
    fontSize: 15,
    color: APP_COLORS.textSecondary,
    fontWeight: '500',
  },
});
