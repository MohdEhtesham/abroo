import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../components';
import { useTheme } from '../../../theme';
import {
  LocationSearchResult,
  searchIndianLocations,
} from '../services/locationService';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: LocationSearchResult) => void;
  /** Quick-pick chips shown above the search results when the input is empty. */
  recents?: LocationSearchResult[];
  onClearRecents?: () => void;
}

/**
 * Modal location picker with live search across all of India via the
 * OpenStreetMap Nominatim API. Debounces the input by 350ms (well under
 * Nominatim's 1 req/sec policy) and aborts in-flight requests on every
 * subsequent keystroke so we never paint stale results.
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  recents = [],
  onClearRecents,
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search; the previous in-flight request gets aborted so we
  // don't render stale results when the user is still typing.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setErr(null);
      return;
    }

    setLoading(true);
    setErr(null);

    debounceRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      searchIndianLocations(query, ctrl.signal)
        .then(rows => {
          setResults(rows);
          setLoading(false);
        })
        .catch(e => {
          if (e?.name === 'AbortError') return;
          setLoading(false);
          setErr('Could not search right now. Check your connection and try again.');
        });
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Reset state when the modal closes so reopening starts fresh.
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setErr(null);
      setLoading(false);
      if (abortRef.current) abortRef.current.abort();
    }
  }, [visible]);

  const handleSelect = useCallback(
    (r: LocationSearchResult) => {
      onSelect(r);
      onClose();
    },
    [onSelect, onClose],
  );

  const showRecents = !query.trim() && recents.length > 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.headerBtn}>
            <Icon name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text variant="bodyLg" weight="800" style={{ flex: 1, marginLeft: 8 }}>
            Choose location
          </Text>
        </View>

        <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <Icon name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            placeholder="City, locality or area (e.g. Powai, Indiranagar)"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={[styles.input, { color: theme.colors.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodySm" color="textMuted" style={{ marginLeft: 8 }}>
              Searching across India…
            </Text>
          </View>
        )}

        {!loading && err && (
          <View style={[styles.statusRow, { backgroundColor: theme.colors.error + '12', borderRadius: 10 }]}>
            <Icon name="alert-circle" size={16} color={theme.colors.error} />
            <Text variant="bodySm" style={{ marginLeft: 8, color: theme.colors.error }}>
              {err}
            </Text>
          </View>
        )}

        {showRecents && (
          <>
            <View style={styles.sectionRow}>
              <Text variant="caption" weight="800" color="textMuted" style={styles.sectionLabel}>
                RECENT
              </Text>
              {onClearRecents && (
                <Pressable onPress={onClearRecents} hitSlop={8}>
                  <Text variant="caption" weight="700" style={{ color: theme.colors.primary }}>
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>
            {recents.map(r => (
              <Row key={`recent-${r.id}`} item={r} onPress={handleSelect} icon="time-outline" />
            ))}
          </>
        )}

        {!loading && query.trim().length >= 2 && results.length === 0 && !err && (
          <View style={styles.empty}>
            <Icon name="location-outline" size={32} color={theme.colors.textMuted} />
            <Text variant="bodySm" color="textMuted" style={{ marginTop: 10, textAlign: 'center' }}>
              No matches in India for "{query.trim()}".
            </Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={r => r.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <Row item={item} onPress={handleSelect} icon="location-outline" />}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: theme.colors.divider }]} />
          )}
        />

        {!query.trim() && recents.length === 0 && !loading && (
          <View style={styles.empty}>
            <Icon name="search" size={32} color={theme.colors.textMuted} />
            <Text variant="bodySm" color="textMuted" style={{ marginTop: 10, textAlign: 'center' }}>
              Type any city, suburb or locality name to search across India.
            </Text>
          </View>
        )}

        <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
          <Text variant="caption" color="textMuted" align="center">
            Location data © OpenStreetMap contributors
          </Text>
        </View>
      </View>
    </Modal>
  );
};

interface RowProps {
  item: LocationSearchResult;
  onPress: (item: LocationSearchResult) => void;
  icon: string;
}

const Row: React.FC<RowProps> = ({ item, onPress, icon }) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress(item)}
      android_ripple={{ color: theme.colors.primary + '14' }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.primary + '08' : 'transparent' },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.colors.primary + '14' }]}>
        <Icon name={icon as any} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text variant="body" weight="700" numberOfLines={1}>
          {item.primary}
        </Text>
        {!!item.secondary && (
          <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginTop: 1 }}>
            {item.secondary}
          </Text>
        )}
      </View>
      <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    marginHorizontal: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
  },
  sectionLabel: { letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  empty: {
    paddingTop: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
