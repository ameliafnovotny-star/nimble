import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, FlatList, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useFitnessStore } from '../../store/useStore';
import { APP_COLORS } from '../../constants/Colors';

const MUSCLE_MAP: Record<string, string[]> = {
  Chest: [
    'bench press', 'chest press', 'chest fly', 'chest flye', 'pec deck', 'pec fly', 'pec ',
    'push-up', 'pushup', 'push up', 'bar dip', 'ring dip', 'assisted dip',
    'dumbbell fly', 'dumbbell flye', 'cable fly', 'cable chest', 'machine chest',
    'incline press', 'decline press', 'floor press', 'dumbbell pullover',
    'smith machine bench', 'smith machine incline',
  ],
  Shoulders: [
    'shoulder press', 'overhead press', 'lateral raise', 'front raise',
    'upright row', 'arnold press', 'arnold ', 'military press', 'ohp',
    'delt', 'handstand push', 'z press', 'landmine press', 'push press',
    'jerk', 'cuban press', 'machine shoulder', 'kettlebell press', 'seated press',
    'plate front raise', 'cable front raise', 'barbell front raise',
  ],
  Triceps: [
    'tricep', 'triceps', 'skull crusher', 'close-grip bench', 'close grip bench',
    'tricep pushdown', 'pushdown', 'bench dip', 'tate press',
    'lying triceps', 'overhead cable triceps', 'tricep extension',
    'ez bar lying', 'close-grip push', 'bodyweight tricep',
  ],
  Back: [
    'deadlift', 'barbell row', 'dumbbell row', 'cable row', 'machine row',
    'seated row', 'bent over row', 'pendlay row', 't-bar row', 'kroc row',
    'seal row', 'inverted row', 'gorilla row', 'chest supported row', 'renegade row',
    'lat pulldown', 'pulldown', 'pull-up', 'pullup', 'pull up',
    'chin-up', 'chinup', 'chin up', 'back extension', 'good morning',
    'hyperextension', 'superman raise', 'muscle-up', 'power clean', 'hang clean',
    'clean and jerk', 'hang snatch', 'power snatch', 'snatch', 'shrug',
    'rack pull', 'jefferson curl', 'straight arm lat', 'rope pulldown',
  ],
  Biceps: [
    'bicep', 'biceps', 'barbell curl', 'dumbbell curl', 'cable curl',
    'hammer curl', 'preacher curl', 'concentration curl', 'ez curl',
    'ez-bar curl', 'drag curl', 'spider curl', 'zottman', 'incline dumbbell curl',
    'machine bicep', 'resistance band curl', 'bayesian curl',
    'overhead cable curl', 'reverse barbell curl', 'reverse dumbbell curl',
    'lying bicep', 'arm curl',
  ],
  'Rear Delts': [
    'face pull', 'rear delt', 'reverse fly', 'reverse flye', 'reverse pec',
    'reverse cable fly', 'reverse machine fly', 'reverse dumbbell fly',
    'band pull-apart', 'banded face pull', 'incline reverse fly',
  ],
  Quads: [
    'squat', 'leg press', 'leg extension', 'lunge', 'hack squat', 'step up',
    'bulgarian split', 'pistol squat', 'split squat', 'goblet squat',
    'box jump', 'jump squat', 'zercher', 'box squat', 'front squat',
    'one-legged leg extension', 'standing cable leg extension', 'tibialis',
  ],
  Hamstrings: [
    'hamstring', 'leg curl', 'romanian', 'rdl', 'stiff leg', 'stiff-leg',
    'nordic', 'glute ham raise', 'good morning', 'death march',
    'single leg deadlift', 'lying leg curl', 'seated leg curl', 'standing leg curl',
    'bodyweight leg curl', 'reverse nordic',
  ],
  Glutes: [
    'glute', 'hip thrust', 'glute bridge', 'frog pump', 'kickback',
    'hip abduction', 'clamshell', 'donkey kick', 'fire hydrant',
    'cable pull through', 'reverse hyperextension', 'banded side kick',
    'lateral walk with band', 'sumo deadlift', 'sumo squat',
    'one-legged glute', 'hip extension',
  ],
  Calves: [
    'calf raise', 'calf ', 'calves', 'heel raise', 'heel drop',
    'donkey calf', 'seated calf', 'standing calf', 'calf raise in leg press',
  ],
  Core: [
    'crunch', 'sit-up', 'situp', 'sit up', 'plank', 'ab wheel', ' abs',
    'oblique', 'leg raise', 'russian twist', 'hollow', 'dragon flag',
    'mountain climber', 'wood chop', 'pallof', 'dead bug', 'l-sit',
    'windshield wiper', 'knee raise', 'hanging knee', 'hanging leg',
    'landmine rotation', 'bicycle crunch', 'jackknife', 'ball slam',
    'hanging sit-up', 'lying leg raise', 'captain', 'ab rollout',
  ],
  Cardio: [
    'run', 'jog', 'cycling', 'elliptical', 'treadmill', 'jump rope',
    'burpee', 'sprint', 'cardio', 'hiit', 'stair climber', 'rowing machine',
    'stationary bike', 'air bike', 'assault bike', 'sled push', 'sled pull',
  ],
};
const MUSCLE_GROUPS = Object.keys(MUSCLE_MAP);

function classifyExercise(name: string): string[] {
  const lower = ' ' + name.toLowerCase() + ' ';
  const found: string[] = [];
  for (const [muscle, keywords] of Object.entries(MUSCLE_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(muscle);
  }
  return found.length ? found : ['Other'];
}

function fmtDate(dateStr: string) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}`;
}

function fmtVal(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

const CHART_W = Dimensions.get('window').width - 72;

export default function ProgressScreen() {
  const { completedSessions } = useFitnessStore();

  const [mode, setMode]                   = useState<'exercise' | 'muscle'>('exercise');
  const [selectedEx, setSelectedEx]       = useState<string | null>(null);
  const [selectedMG, setSelectedMG]       = useState(MUSCLE_GROUPS[0]);
  const [metric, setMetric]               = useState<'max' | 'volume'>('max');
  const [showPicker, setShowPicker]       = useState(false);
  const [search, setSearch]               = useState('');

  const allExercises = useMemo(() => {
    const s = new Set<string>();
    completedSessions.forEach(cs => cs.exercises.forEach(e => s.add(e.exerciseName)));
    return Array.from(s).sort();
  }, [completedSessions]);

  const filteredExercises = useMemo(
    () => allExercises.filter(e => e.toLowerCase().includes(search.toLowerCase())),
    [allExercises, search],
  );

  const chartData = useMemo(() => {
    const sessions = [...completedSessions].sort((a, b) => a.date.localeCompare(b.date));

    if (mode === 'exercise') {
      if (!selectedEx) return [];
      return sessions
        .filter(s => s.exercises.some(e => e.exerciseName === selectedEx))
        .map(s => {
          const ex = s.exercises.find(e => e.exerciseName === selectedEx)!;
          const done = ex.sets.filter(st => st.completed);
          const value = metric === 'max'
            ? Math.max(...done.filter(st => st.weight > 0).map(st => st.weight), 0)
            : done.reduce((sum, st) => sum + st.weight * st.reps, 0);
          return { value, date: s.date };
        })
        .filter(d => d.value > 0);
    }

    return sessions
      .map(s => {
        const matching = s.exercises.filter(e => classifyExercise(e.exerciseName).includes(selectedMG));
        if (!matching.length) return null;
        const done = matching.flatMap(e => e.sets.filter(st => st.completed));
        const value = metric === 'max'
          ? Math.max(...done.filter(st => st.weight > 0).map(st => st.weight), 0)
          : done.reduce((sum, st) => sum + st.weight * st.reps, 0);
        return { value, date: s.date };
      })
      .filter((d): d is { value: number; date: string } => d !== null && d.value > 0);
  }, [completedSessions, mode, selectedEx, selectedMG, metric]);

  const stats = useMemo(() => {
    if (chartData.length < 1) return null;
    const vals = chartData.map(d => d.value);
    return {
      sessions: vals.length,
      best: Math.max(...vals),
      last: vals[vals.length - 1],
      change: vals[vals.length - 1] - vals[0],
    };
  }, [chartData]);

  const giftedData = chartData.map((d, i) => ({
    value: d.value,
    label: (i === 0 || i === chartData.length - 1 || chartData.length <= 6 || i % Math.ceil(chartData.length / 5) === 0)
      ? fmtDate(d.date) : '',
  }));

  const noSelection = mode === 'exercise' && !selectedEx;
  const hasData = chartData.length > 1;

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Mode toggle */}
        <View style={s.seg}>
          {(['exercise', 'muscle'] as const).map(m => (
            <TouchableOpacity key={m} style={[s.segBtn, mode === m && s.segBtnActive]} onPress={() => setMode(m)} activeOpacity={0.8}>
              <Text style={[s.segText, mode === m && s.segTextActive]}>
                {m === 'exercise' ? 'Exercise' : 'Muscle Group'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exercise picker */}
        {mode === 'exercise' && (
          <TouchableOpacity style={s.picker} onPress={() => setShowPicker(true)} activeOpacity={0.75}>
            <Text style={[s.pickerText, !selectedEx && s.placeholder]}>
              {selectedEx ?? 'Select an exercise…'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={APP_COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Muscle group chips */}
        {mode === 'muscle' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {MUSCLE_GROUPS.map(mg => (
              <TouchableOpacity
                key={mg}
                style={[s.chip, selectedMG === mg && s.chipActive]}
                onPress={() => setSelectedMG(mg)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, selectedMG === mg && s.chipTextActive]}>{mg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Metric toggle */}
        <View style={s.metricRow}>
          {(['max', 'volume'] as const).map(m => (
            <TouchableOpacity key={m} style={[s.metricBtn, metric === m && s.metricBtnActive]} onPress={() => setMetric(m)} activeOpacity={0.8}>
              <Text style={[s.metricText, metric === m && s.metricTextActive]}>
                {m === 'max' ? 'Max Weight' : 'Total Volume'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart card */}
        <View style={s.card}>
          {noSelection ? (
            <View style={s.empty}>
              <Ionicons name="trending-up-outline" size={44} color={APP_COLORS.border} />
              <Text style={s.emptyTitle}>Select an exercise</Text>
              <Text style={s.emptyHint}>Choose an exercise above to see your progress over time.</Text>
            </View>
          ) : !hasData ? (
            <View style={s.empty}>
              <Ionicons name="trending-up-outline" size={44} color={APP_COLORS.border} />
              <Text style={s.emptyTitle}>Not enough data</Text>
              <Text style={s.emptyHint}>Complete at least 2 sessions with this {mode === 'exercise' ? 'exercise' : 'muscle group'} to see a graph.</Text>
            </View>
          ) : (
            <LineChart
              data={giftedData}
              width={CHART_W}
              height={200}
              spacing={Math.max(44, Math.min(80, CHART_W / Math.max(giftedData.length - 1, 1)))}
              initialSpacing={8}
              color={APP_COLORS.primary}
              thickness={2.5}
              dataPointsColor={APP_COLORS.primary}
              dataPointsRadius={4}
              startFillColor={APP_COLORS.primary + '28'}
              endFillColor={APP_COLORS.primary + '04'}
              areaChart
              curved
              hideRules
              yAxisColor="transparent"
              xAxisColor={APP_COLORS.border}
              yAxisTextStyle={{ color: APP_COLORS.textSecondary, fontSize: 11 }}
              xAxisLabelTextStyle={{ color: APP_COLORS.textSecondary, fontSize: 10 }}
              noOfSections={4}
            />
          )}
        </View>

        {/* Stats */}
        {stats && (
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statVal}>{stats.sessions}</Text>
              <Text style={s.statLabel}>Sessions</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{fmtVal(stats.best)}</Text>
              <Text style={s.statLabel}>{metric === 'max' ? 'Best (lbs)' : 'Best vol'}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: stats.change >= 0 ? APP_COLORS.success : APP_COLORS.destructive }]}>
                {stats.change >= 0 ? '+' : ''}{fmtVal(stats.change)}
              </Text>
              <Text style={s.statLabel}>vs First</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Exercise picker modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <SafeAreaView style={s.modal} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Exercise</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setSearch(''); }}>
              <Text style={s.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={s.searchRow}>
            <Ionicons name="search" size={15} color={APP_COLORS.textSecondary} />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search…"
              placeholderTextColor={APP_COLORS.textSecondary}
              autoFocus
            />
          </View>

          {filteredExercises.length === 0 ? (
            <View style={s.modalEmpty}>
              <Text style={{ color: APP_COLORS.textSecondary, fontSize: 15 }}>No exercises found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={item => item}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.exRow, selectedEx === item && s.exRowActive]}
                  onPress={() => { setSelectedEx(item); setShowPicker(false); setSearch(''); }}
                  activeOpacity={0.75}
                >
                  <Text style={[s.exName, selectedEx === item && s.exNameActive]}>{item}</Text>
                  {selectedEx === item && <Ionicons name="checkmark" size={18} color={APP_COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.background },
  scroll: { padding: 16, paddingBottom: 48 },

  seg: { flexDirection: 'row', backgroundColor: APP_COLORS.card, borderRadius: 12, padding: 4, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  segBtnActive: { backgroundColor: APP_COLORS.primary },
  segText: { fontSize: 14, fontWeight: '600', color: APP_COLORS.textSecondary },
  segTextActive: { color: '#FFF' },

  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: APP_COLORS.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  pickerText: { fontSize: 15, fontWeight: '600', color: APP_COLORS.text },
  placeholder: { color: APP_COLORS.textSecondary, fontWeight: '400' },

  chips: { paddingBottom: 14, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.card },
  chipActive: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary },
  chipTextActive: { color: '#FFF' },

  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: APP_COLORS.border, backgroundColor: APP_COLORS.card },
  metricBtnActive: { borderColor: APP_COLORS.primary, backgroundColor: APP_COLORS.primary + '15' },
  metricText: { fontSize: 13, fontWeight: '600', color: APP_COLORS.textSecondary },
  metricTextActive: { color: APP_COLORS.primary },

  card: { backgroundColor: APP_COLORS.card, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: APP_COLORS.text },
  emptyHint: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },

  statsRow: { flexDirection: 'row', backgroundColor: APP_COLORS.card, borderRadius: 14, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: APP_COLORS.border },
  statVal: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: APP_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },

  modal: { flex: 1, backgroundColor: APP_COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.text },
  modalDone: { fontSize: 17, color: APP_COLORS.primary, fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: APP_COLORS.card, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 15, color: APP_COLORS.text },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  exRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: APP_COLORS.border },
  exRowActive: { backgroundColor: APP_COLORS.primary + '0D' },
  exName: { fontSize: 15, color: APP_COLORS.text },
  exNameActive: { fontWeight: '600', color: APP_COLORS.primary },
});
