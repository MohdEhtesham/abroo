import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  EmptyState,
  PropertyCard,
  Screen,
  SearchBar,
  SectionHeader,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { toggleSaved } from '../../../store/slices/propertySlice';
import { useTheme } from '../../../theme';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';

const RECENT = ['DLF Camellias', 'Bangalore villas', 'Noida 3 BHK', 'Mumbai sea view'];
const TRENDING_TAGS = ['Ready to Move', 'Under 1 Cr', 'Sea view', 'New Launch', 'Villa', '4 BHK'];

export const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const saved = useAppSelector(s => s.property.saved);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await propertyService.search(trimmed);
      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [trimmed]);

  const showSuggestions = useMemo(() => trimmed.length < 2, [trimmed]);

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Search" onBackPress={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search projects, builders, cities…"
          autoFocus
          onFilterPress={() => navigation.navigate('Filters')}
        />
      </View>

      {showSuggestions ? (
        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <SectionHeader title="Recent searches" style={{ paddingHorizontal: 0 }} />
          {RECENT.map(r => (
            <Pressable
              key={r}
              onPress={() => setQuery(r)}
              style={[styles.row, { borderBottomColor: theme.colors.divider }]}
            >
              <Icon name="time-outline" size={18} color={theme.colors.textMuted} />
              <Text variant="body" style={{ marginLeft: 10, flex: 1 }}>{r}</Text>
              <Icon name="arrow-up-outline" size={16} color={theme.colors.textMuted} style={{ transform: [{ rotate: '-45deg' }] }} />
            </Pressable>
          ))}
          <SectionHeader title="Trending searches" style={{ paddingHorizontal: 0, marginTop: 16 }} />
          <View style={styles.tagWrap}>
            {TRENDING_TAGS.map(t => (
              <Pressable
                key={t}
                onPress={() => setQuery(t)}
                style={[styles.tag, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              >
                <Text variant="bodySm" weight="600">{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              variant="horizontal"
              onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
              saved={saved.includes(item.id)}
              onSavePress={() => dispatch(toggleSaved(item.id))}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 }}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                iconName="search-outline"
                title="No results"
                message={`No matches for "${trimmed}". Try another keyword.`}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
