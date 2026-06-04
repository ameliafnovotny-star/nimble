import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { WorkoutExercise, SetEntry } from '../store/types';
import { APP_COLORS } from '../constants/Colors';

interface Props {
  exercise: WorkoutExercise;
  onUpdateName: (name: string) => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: Partial<Omit<SetEntry, 'id'>>) => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
}

export function ExerciseCard({ exercise, onUpdateName, onAddSet, onUpdateSet, onRemoveSet, onRemove }: Props) {
  const [name, setName] = useState(exercise.name);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          onBlur={() => { if (name.trim()) onUpdateName(name.trim()); }}
          placeholder="Exercise name"
          placeholderTextColor={APP_COLORS.textSecondary}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Remove Exercise', `Remove "${exercise.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: onRemove },
            ]);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.setHeaders}>
        <Text style={[styles.setHeaderCell, styles.setNumCol]}>SET</Text>
        <Text style={[styles.setHeaderCell, styles.inputCol]}>REPS</Text>
        <Text style={[styles.setHeaderCell, styles.inputCol]}>LBS</Text>
        <View style={styles.deleteCol} />
      </View>

      {exercise.sets.map((set, idx) => (
        <SetRow
          key={set.id}
          set={set}
          index={idx + 1}
          canRemove={exercise.sets.length > 1}
          onUpdate={(u) => onUpdateSet(set.id, u)}
          onRemove={() => onRemoveSet(set.id)}
        />
      ))}

      <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet} activeOpacity={0.7}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

interface SetRowProps {
  set: SetEntry;
  index: number;
  canRemove: boolean;
  onUpdate: (updates: Partial<Omit<SetEntry, 'id'>>) => void;
  onRemove: () => void;
}

function SetRow({ set, index, canRemove, onUpdate, onRemove }: SetRowProps) {
  const [weightText, setWeightText] = useState(set.weight === 0 ? '' : String(set.weight));

  return (
    <View style={styles.setRow}>
      <View style={[styles.setNumCol, styles.setNumContainer]}>
        <Text style={styles.setNum}>{index}</Text>
      </View>
      <TextInput
        style={[styles.input, styles.inputCol]}
        value={String(set.reps)}
        onChangeText={(v) => onUpdate({ reps: parseInt(v) || 0 })}
        keyboardType="number-pad"
        selectTextOnFocus
      />
      <TextInput
        style={[styles.input, styles.inputCol]}
        value={weightText}
        onChangeText={setWeightText}
        onBlur={() => {
          const val = parseFloat(weightText.replace(',', '.')) || 0;
          onUpdate({ weight: val });
          setWeightText(val === 0 ? '' : String(val));
        }}
        keyboardType="decimal-pad"
        selectTextOnFocus
        placeholder="0"
        placeholderTextColor={APP_COLORS.textSecondary}
      />
      <TouchableOpacity
        style={styles.deleteCol}
        onPress={onRemove}
        disabled={!canRemove}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
      >
        <Text style={[styles.removeSetIcon, !canRemove && styles.dimmed]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    borderBottomWidth: 1.5,
    borderBottomColor: APP_COLORS.primary + '70',
    paddingBottom: 5,
    paddingTop: 2,
  },
  removeIcon: { fontSize: 16, color: APP_COLORS.destructive },
  setHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  setHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  setNumCol: { width: 36, textAlign: 'center' },
  setNumContainer: { alignItems: 'center', justifyContent: 'center' },
  inputCol: { flex: 1, textAlign: 'center' },
  deleteCol: { width: 32, alignItems: 'center', justifyContent: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  setNum: {
    width: 36,
    textAlign: 'center',
    fontSize: 13,
    color: APP_COLORS.textSecondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    paddingVertical: 8,
    fontSize: 15,
    color: APP_COLORS.text,
    marginHorizontal: 3,
    fontWeight: '500',
  },
  removeSetIcon: { fontSize: 13, color: APP_COLORS.destructive, opacity: 0.8 },
  dimmed: { opacity: 0.2 },
  addSetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary + '50',
    borderStyle: 'dashed',
  },
  addSetText: { fontSize: 13, fontWeight: '600', color: APP_COLORS.primary },
});
