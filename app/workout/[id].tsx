import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFitnessStore } from '../../store/useStore';
import { ExerciseCard } from '../../components/ExerciseCard';
import { APP_COLORS } from '../../constants/Colors';
import { COMMON_EXERCISES } from '../../constants/exercises';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    workouts,
    categories,
    updateWorkout,
    deleteWorkout,
    addExercise,
    updateExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
  } = useFitnessStore();

  const workout = workouts.find((w) => w.id === id);
  const category = categories.find((c) => c.id === workout?.categoryId);

  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseName, setExerciseName] = useState('');

  const defaultSuggestionCount = 14;
  const hasSearchQuery = exerciseName.trim().length > 0;

  const suggestions = useMemo(() => {
    const q = exerciseName.trim().toLowerCase();
    if (!q) return COMMON_EXERCISES.slice(0, defaultSuggestionCount);
    return COMMON_EXERCISES.filter((e) => e.toLowerCase().includes(q));
  }, [exerciseName]);


  if (!workout) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Workout not found.</Text>
      </View>
    );
  }

  const handleAddExercise = (name = exerciseName) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addExercise(id!, trimmed);
    setExerciseName('');
    setShowAddExercise(false);
  };

  const handleSelectSuggestion = (item: string) => {
    handleAddExercise(item);
  };

  const handleDelete = () => {
    const msg = `Delete "${workout.name}"? This cannot be undone.`;
    Alert.alert('Delete Workout', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteWorkout(id!); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: workout.name || 'Workout',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={{ marginRight: 8 }}>
              <Ionicons name="trash-outline" size={21} color={APP_COLORS.destructive} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.nameSection}>
          <TextInput
            style={styles.nameInput}
            value={workout.name}
            onChangeText={(text) => updateWorkout(id!, { name: text })}
            placeholder="Workout Name"
            placeholderTextColor={APP_COLORS.textSecondary}
          />
        </View>

        <View style={styles.catSection}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={[styles.catSelector, { borderColor: category?.color ?? APP_COLORS.border }]}
            onPress={() => setShowCatPicker(true)}
            activeOpacity={0.8}
          >
            {category && <View style={[styles.catDot, { backgroundColor: category.color }]} />}
            <Text style={[styles.catSelectorText, { color: category?.color ?? APP_COLORS.textSecondary }]}>
              {category?.name ?? 'Select Category'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={15}
              color={category?.color ?? APP_COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={workout.notes ?? ''}
            onChangeText={(text) => updateWorkout(id!, { notes: text })}
            placeholder="Rest times, cues, goals..."
            placeholderTextColor={APP_COLORS.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.exercisesSection}>
          <Text style={styles.label}>Exercises</Text>

          {workout.exercises.length === 0 && (
            <View style={styles.noExercises}>
              <Text style={styles.noExercisesText}>Add your first exercise below.</Text>
            </View>
          )}

          {workout.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onUpdateName={(name) => updateExercise(id!, ex.id, { name })}
              onAddSet={() => addSet(id!, ex.id)}
              onUpdateSet={(setId, u) => updateSet(id!, ex.id, setId, u)}
              onRemoveSet={(setId) => removeSet(id!, ex.id, setId)}
              onRemove={() => removeExercise(id!, ex.id)}
            />
          ))}

          <TouchableOpacity
            style={styles.addExBtn}
            onPress={() => { setExerciseName(''); setShowAddExercise(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color={APP_COLORS.primary} />
            <Text style={styles.addExText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category picker */}
      <Modal
        visible={showCatPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCatPicker(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Category</Text>
            <TouchableOpacity onPress={() => setShowCatPicker(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catRow, workout.categoryId === cat.id && styles.catRowSelected]}
              onPress={() => { updateWorkout(id!, { categoryId: cat.id }); setShowCatPicker(false); }}
              activeOpacity={0.8}
            >
              <View style={[styles.catRowDot, { backgroundColor: cat.color }]} />
              <Text style={styles.catRowName}>{cat.name}</Text>
              {workout.categoryId === cat.id && (
                <Ionicons name="checkmark" size={20} color={APP_COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.manageCats}
            onPress={() => { setShowCatPicker(false); router.push('/categories'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={16} color={APP_COLORS.primary} />
            <Text style={styles.manageCatsText}>Manage Categories</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Add exercise */}
      <Modal
        visible={showAddExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddExercise(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddExercise(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={() => handleAddExercise()} disabled={!exerciseName.trim()}>
              <Text style={[styles.modalDone, !exerciseName.trim() && styles.dim]}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={APP_COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="Search or enter exercise name..."
              placeholderTextColor={APP_COLORS.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => handleAddExercise()}
            />
            {exerciseName.length > 0 && (
              <TouchableOpacity onPress={() => setExerciseName('')}>
                <Ionicons name="close-circle" size={18} color={APP_COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
            contentContainerStyle={styles.suggestionsContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={() => (
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsHeaderText}>
                  {hasSearchQuery ? 'Search results' : 'Popular exercises'}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionRow}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="barbell-outline" size={18} color={APP_COLORS.textSecondary} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item}</Text>
                <Ionicons name="add" size={20} color={APP_COLORS.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No matches — tap Add to use "{exerciseName}"</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { paddingBottom: 60 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: APP_COLORS.textSecondary },
  nameSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  nameInput: {
    fontSize: 26,
    fontWeight: '700',
    color: APP_COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.primary + '50',
    paddingBottom: 8,
  },
  catSection: { paddingHorizontal: 20, marginBottom: 24 },
  notesSection: { paddingHorizontal: 20, marginBottom: 24 },
  notesInput: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: APP_COLORS.text,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  catSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catSelectorText: { fontSize: 15, fontWeight: '600' },
  exercisesSection: { paddingHorizontal: 16 },
  noExercises: { alignItems: 'center', paddingVertical: 24 },
  noExercisesText: { fontSize: 14, color: APP_COLORS.textSecondary },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary + '55',
    borderStyle: 'dashed',
  },
  addExText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.primary },
  modal: { flex: 1, backgroundColor: APP_COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  modalDone: { fontSize: 17, color: APP_COLORS.primary, fontWeight: '600' },
  modalCancel: { fontSize: 17, color: APP_COLORS.textSecondary },
  dim: { opacity: 0.3 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLORS.border,
  },
  catRowSelected: { backgroundColor: APP_COLORS.primary + '08' },
  catRowDot: { width: 14, height: 14, borderRadius: 7 },
  catRowName: { flex: 1, fontSize: 16, fontWeight: '500', color: APP_COLORS.text },
  manageCats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  manageCatsText: { fontSize: 15, color: APP_COLORS.primary, fontWeight: '500' },
  field: { paddingHorizontal: 20, marginTop: 4 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  fieldInput: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: APP_COLORS.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.text,
    marginLeft: 8,
  },
  suggestionsList: { flex: 1 },
  suggestionsContent: { paddingBottom: 24 },
  suggestionsHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  suggestionsHeaderText: {
    color: APP_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: APP_COLORS.border, marginHorizontal: 16 },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: APP_COLORS.card,
    borderRadius: 14,
    marginHorizontal: 16,
  },
  suggestionIcon: { marginRight: 12 },
  suggestionText: { flex: 1, fontSize: 16, color: APP_COLORS.text },
  noResults: { alignItems: 'center', paddingVertical: 24 },
  noResultsText: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'center' },
});
