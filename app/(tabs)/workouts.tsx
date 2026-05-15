import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFitnessStore } from '../../store/useStore';
import { WorkoutCard } from '../../components/WorkoutCard';
import { APP_COLORS, PRESET_COLORS } from '../../constants/Colors';

export default function WorkoutsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { categories, workouts, addWorkout, addCategory, deleteWorkout } = useFitnessStore();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [pickedCategoryId, setPickedCategoryId] = useState('');

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/categories')}
          style={{ marginRight: 16 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="options-outline" size={22} color={APP_COLORS.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, []);

  const openNew = () => {
    setNewName('');
    setPickedCategoryId(categories[0]?.id ?? '');
    setShowNewCat(false);
    setNewCatName('');
    setNewCatColor(PRESET_COLORS[0]);
    setShowNew(true);
  };

  const handleSaveNewCat = () => {
    if (!newCatName.trim()) return;
    const cat = addCategory(newCatName.trim(), newCatColor);
    setPickedCategoryId(cat.id);
    setShowNewCat(false);
    setNewCatName('');
    setNewCatColor(PRESET_COLORS[0]);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const w = addWorkout(newName.trim(), pickedCategoryId || (categories[0]?.id ?? ''));
    setShowNew(false);
    router.push(`/workout/${w.id}`);
  };

  const grouped = categories
    .map((cat) => ({ cat, items: workouts.filter((w) => w.categoryId === cat.id) }))
    .filter((g) => g.items.length > 0);

  const uncategorized = workouts.filter((w) => !categories.find((c) => c.id === w.categoryId));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={60} color={APP_COLORS.border} />
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptyText}>
              Build your first workout to start tracking your training.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openNew} activeOpacity={0.85}>
              <Text style={styles.emptyBtnText}>Create Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {grouped.map(({ cat, items }) => (
              <View key={cat.id} style={styles.section}>
                <View style={styles.sectionRow}>
                  <View style={[styles.sectionDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.sectionName}>{cat.name}</Text>
                  <Text style={styles.sectionCount}>{items.length}</Text>
                </View>
                {items.map((w) => (
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    category={cat}
                    onPress={() => router.push(`/workout/${w.id}`)}
                    onLongPress={() =>
                      Alert.alert('Delete Workout', `Delete "${w.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(w.id) },
                      ])
                    }
                  />
                ))}
              </View>
            ))}
            {uncategorized.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onPress={() => router.push(`/workout/${w.id}`)}
                onLongPress={() =>
                  Alert.alert('Delete Workout', `Delete "${w.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(w.id) },
                  ])
                }
              />
            ))}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openNew} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showNew}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNew(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNew(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Workout</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!newName.trim()}>
              <Text style={[styles.modalCreate, !newName.trim() && styles.dim]}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Push Day, Leg Day..."
              placeholderTextColor={APP_COLORS.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chips}>
                {categories.map((cat) => {
                  const selected = pickedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.chip,
                        { borderColor: cat.color },
                        selected && { backgroundColor: cat.color },
                      ]}
                      onPress={() => {
                        setPickedCategoryId(cat.id);
                        setShowNewCat(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, { color: selected ? '#FFF' : cat.color }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.chip, styles.newCatChip, showNewCat && styles.newCatChipActive]}
                  onPress={() => {
                    setShowNewCat((v) => !v);
                    setPickedCategoryId('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, showNewCat ? styles.newCatTextActive : styles.newCatText]}>
                    + New
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {showNewCat && (
              <View style={styles.newCatForm}>
                <TextInput
                  style={styles.newCatInput}
                  value={newCatName}
                  onChangeText={setNewCatName}
                  placeholder="Category name..."
                  placeholderTextColor={APP_COLORS.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveNewCat}
                  autoFocus
                />
                <View style={styles.colorRow}>
                  {PRESET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        newCatColor === color && styles.colorCircleSelected,
                      ]}
                      onPress={() => setNewCatColor(color)}
                      activeOpacity={0.8}
                    >
                      {newCatColor === color && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.addCatBtn, !newCatName.trim() && styles.dim]}
                  onPress={handleSaveNewCat}
                  disabled={!newCatName.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addCatBtnText}>Add Category</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: APP_COLORS.text, marginTop: 12 },
  emptyText: { fontSize: 15, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  section: { marginBottom: 6 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 8,
    gap: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: APP_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: { fontSize: 12, color: APP_COLORS.textSecondary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: APP_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: APP_COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modal: { flex: 1, backgroundColor: APP_COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text },
  modalCancel: { fontSize: 17, color: APP_COLORS.textSecondary },
  modalCreate: { fontSize: 17, color: APP_COLORS.primary, fontWeight: '600' },
  dim: { opacity: 0.3 },
  field: { paddingHorizontal: 20, marginBottom: 28 },
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
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 2,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  newCatChip: {
    borderColor: APP_COLORS.primary,
    borderStyle: 'dashed',
  },
  newCatChipActive: {
    backgroundColor: APP_COLORS.primary,
  },
  newCatText: { color: APP_COLORS.primary },
  newCatTextActive: { color: '#FFF' },
  newCatForm: {
    marginTop: 16,
    backgroundColor: APP_COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  newCatInput: {
    backgroundColor: APP_COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: APP_COLORS.text,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  checkmark: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  addCatBtn: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addCatBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
