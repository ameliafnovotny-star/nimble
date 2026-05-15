import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../store/types';

interface Props {
  category: Category;
  small?: boolean;
}

export function CategoryBadge({ category, small }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: category.color + '28' }, small && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: category.color }, small && styles.dotSmall]} />
      <Text style={[styles.text, { color: category.color }, small && styles.textSmall]}>
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSmall: { paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  dotSmall: { width: 5, height: 5, borderRadius: 2.5 },
  text: { fontSize: 13, fontWeight: '600' },
  textSmall: { fontSize: 11 },
});
