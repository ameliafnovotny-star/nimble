import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Category, Workout } from '../store/types';
import { CategoryBadge } from './CategoryBadge';
import { APP_COLORS } from '../constants/Colors';

interface Props {
  workout: Workout;
  category?: Category;
  onPress: () => void;
  onLongPress?: () => void;
}

export function WorkoutCard({ workout, category, onPress, onLongPress }: Props) {
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <View style={[styles.stripe, { backgroundColor: category?.color ?? APP_COLORS.border }]} />
      <View style={styles.body}>
        <Text style={styles.name}>{workout.name}</Text>
        <View style={styles.meta}>
          {category && <CategoryBadge category={category} small />}
          <Text style={styles.metaText}>
            {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
            {totalSets > 0 ? ` · ${totalSets} sets` : ''}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  stripe: { width: 5, alignSelf: 'stretch' },
  body: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, gap: 6 },
  name: { fontSize: 16, fontWeight: '600', color: APP_COLORS.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: APP_COLORS.textSecondary },
  chevron: { fontSize: 22, color: APP_COLORS.border, paddingRight: 14, fontWeight: '300' },
});
