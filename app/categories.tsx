import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFitnessStore } from '../store/useStore';
import { Category } from '../store/types';
import { PRESET_COLORS, APP_COLORS } from '../constants/Colors';

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFitnessStore();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormColor(PRESET_COLORS[0]);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setFormName(cat.name);
    setFormColor(cat.color);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editing) {
      updateCategory(editing.id, { name: formName.trim(), color: formColor });
    } else {
      addCategory(formName.trim(), formColor);
    }
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hint}>
            Color-code your workouts for a quick visual overview on the calendar.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <Text style={styles.rowName}>{item.name}</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const msg = `Delete "${item.name}"?`;
                if (typeof window !== 'undefined') {
                  if (window.confirm(msg)) deleteCategory(item.id);
                } else {
                  Alert.alert('Delete Category', msg, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(item.id) },
                  ]);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add Category</Text>
          </TouchableOpacity>
        }
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editing ? 'Edit Category' : 'New Category'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={!formName.trim()}>
              <Text style={[styles.modalSave, !formName.trim() && styles.dim]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Push, Pull, Legs..."
              placeholderTextColor={APP_COLORS.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    formColor === color && styles.colorCircleSelected,
                  ]}
                  onPress={() => setFormColor(color)}
                  activeOpacity={0.8}
                >
                  {formColor === color && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={[styles.previewBadge, { backgroundColor: formColor + '28' }]}>
                <View style={[styles.previewDot, { backgroundColor: formColor }]} />
                <Text style={[styles.previewText, { color: formColor }]}>
                  {formName || 'Category'}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  list: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 14, color: APP_COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  swatch: { width: 20, height: 20, borderRadius: 10 },
  rowName: { flex: 1, fontSize: 16, fontWeight: '500', color: APP_COLORS.text },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primary + '14',
  },
  editBtnText: { fontSize: 13, color: APP_COLORS.primary, fontWeight: '600' },
  deleteIcon: { fontSize: 16, color: APP_COLORS.textSecondary },
  addBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: APP_COLORS.primary + '55',
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.primary },
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
  modalSave: { fontSize: 17, color: APP_COLORS.primary, fontWeight: '600' },
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
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  checkmark: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  previewRow: { marginTop: 18, gap: 8 },
  previewLabel: { fontSize: 12, color: APP_COLORS.textSecondary, fontWeight: '600' },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewText: { fontSize: 14, fontWeight: '600' },
});
