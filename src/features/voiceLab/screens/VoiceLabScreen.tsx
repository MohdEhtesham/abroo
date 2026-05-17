import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import Sound from 'react-native-sound';
import LinearGradient from 'react-native-linear-gradient';
import {
  AnimatedHeader,
  Card,
  GradientButton,
  Screen,
  Text,
} from '../../../components';
import { useTheme } from '../../../theme';
import {
  VOICE_PRESETS,
  VoicePreset,
  VoicePresetCategory,
  cacheInputFile,
  convertVoice,
} from '../services/voiceLabService';

Sound.setCategory('Playback');

interface PickedFile {
  uri: string;          // app-private cache copy ready for ffmpeg
  name: string;
  type?: string;
  size?: number;
}

export const VoiceLabScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<VoicePreset | null>(null);
  const [playing, setPlaying] = useState<'none' | 'input' | 'output'>('none');
  // Default to Studio — that's the YouTube-ready use case. Effects tucked
  // behind a tap so the legitimate workflow leads the UX.
  const [category, setCategory] = useState<VoicePresetCategory>('studio');
  const soundRef = useRef<Sound | null>(null);

  const visiblePresets = VOICE_PRESETS.filter(p => p.category === category);

  // Clean up any active sound on unmount.
  useEffect(() => {
    return () => {
      try { soundRef.current?.stop(); soundRef.current?.release(); } catch {}
      soundRef.current = null;
    };
  }, []);

  const stopAnyPlayback = useCallback(() => {
    try { soundRef.current?.stop(); soundRef.current?.release(); } catch {}
    soundRef.current = null;
    setPlaying('none');
  }, []);

  const pickFile = async () => {
    try {
      const res: DocumentPickerResponse = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.audio],
        copyTo: 'cachesDirectory',
      });
      const finalUri = res.fileCopyUri ?? res.uri;
      if (!finalUri) {
        Alert.alert('Could not read file', 'Try picking a different audio file.');
        return;
      }
      const cached = await cacheInputFile(finalUri, res.name ?? 'audio.mp3');
      stopAnyPlayback();
      setPicked({ uri: cached, name: res.name ?? 'audio', type: res.type ?? undefined, size: res.size ?? undefined });
      setOutput(null);
      setActivePreset(null);
    } catch (e: any) {
      if (DocumentPicker.isCancel(e)) return;
      Alert.alert('Could not pick file', e?.message ?? 'Please try again.');
    }
  };

  const apply = async (preset: VoicePreset) => {
    if (!picked || busy) return;
    stopAnyPlayback();
    setBusy(true);
    setActivePreset(preset);
    try {
      const res = await convertVoice(picked.uri, preset);
      setOutput(res.outputPath);
    } catch (e: any) {
      Alert.alert('Conversion failed', e?.message ?? 'Try again with a different file.');
    } finally {
      setBusy(false);
    }
  };

  const play = (which: 'input' | 'output') => {
    const path = which === 'input' ? picked?.uri : output;
    if (!path) return;
    stopAnyPlayback();
    // Sound supports raw file paths via empty basePath.
    const s = new Sound(path, '', err => {
      if (err) {
        Alert.alert('Playback error', String(err.message ?? err));
        return;
      }
      setPlaying(which);
      s.play(() => {
        setPlaying('none');
        try { s.release(); } catch {}
        if (soundRef.current === s) soundRef.current = null;
      });
    });
    soundRef.current = s;
  };

  const shareOutput = async () => {
    if (!output) return;
    try {
      await Share.open({
        url: `file://${output}`,
        type: 'audio/mp3',
        failOnCancel: false,
      });
    } catch (e: any) {
      // user-cancelled share is fine; only alert on real errors
      if (e?.message && !/cancel/i.test(e.message)) {
        Alert.alert('Share failed', e.message);
      }
    }
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Voice Lab" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* HERO */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.hero}
        >
          <View style={styles.heroOrb} pointerEvents="none" />
          <Icon name="mic" size={26} color="#fff" />
          <Text variant="h3" weight="800" style={{ color: '#fff', marginTop: 8 }}>
            Free voice changer
          </Text>
          <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Pick any audio file, tap an effect — process happens fully on-device.
          </Text>
        </LinearGradient>

        {/* Picker */}
        <Card padding={14} style={{ marginTop: 14 }}>
          <Text variant="caption" weight="700" color="textMuted" style={styles.label}>
            SOURCE FILE
          </Text>
          {picked ? (
            <>
              <View style={styles.fileRow}>
                <View style={[styles.fileIcon, { backgroundColor: theme.colors.primary + '14' }]}>
                  <Icon name="musical-notes" size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text variant="body" weight="700" numberOfLines={1}>
                    {picked.name}
                  </Text>
                  {!!picked.size && (
                    <Text variant="caption" color="textMuted">
                      {(picked.size / 1024).toFixed(1)} KB
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => play('input')}
                  style={[styles.iconBtn, { backgroundColor: theme.colors.primary + '14' }]}
                >
                  <Icon
                    name={playing === 'input' ? 'pause' : 'play'}
                    size={18}
                    color={theme.colors.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={pickFile}
                  style={[styles.iconBtn, { backgroundColor: theme.colors.divider, marginLeft: 8 }]}
                  hitSlop={6}
                >
                  <Icon name="swap-horizontal" size={16} color={theme.colors.text} />
                </Pressable>
              </View>
            </>
          ) : (
            <GradientButton
              title="Choose audio file"
              iconName="folder-open-outline"
              iconPosition="left"
              size="lg"
              onPress={pickFile}
            />
          )}
        </Card>

        {/* Presets */}
        {picked && (
          <>
            <View style={[styles.tabRow, { marginTop: 18 }]}>
              {(
                [
                  { id: 'studio' as const, label: 'Studio', subtitle: 'YouTube-ready masters' },
                  { id: 'effect' as const, label: 'Effects', subtitle: 'Fun voice transforms' },
                ]
              ).map(t => {
                const active = category === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setCategory(t.id)}
                    style={[
                      styles.tabBtn,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      weight="800"
                      style={{ color: active ? '#fff' : theme.colors.text, fontSize: 14 }}
                    >
                      {t.label}
                    </Text>
                    <Text
                      variant="caption"
                      style={{
                        color: active ? 'rgba(255,255,255,0.85)' : theme.colors.textMuted,
                        marginTop: 1,
                        fontSize: 11,
                      }}
                    >
                      {t.subtitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text variant="caption" weight="700" color="textMuted" style={[styles.label, { marginTop: 14 }]}>
              {category === 'studio' ? 'CHOOSE STUDIO PRESET' : 'CHOOSE EFFECT'}
            </Text>
            <FlatList
              data={visiblePresets}
              keyExtractor={p => p.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
              renderItem={({ item }) => {
                const active = activePreset?.id === item.id;
                const loading = busy && active;
                return (
                  <Pressable
                    disabled={busy}
                    onPress={() => apply(item)}
                    style={[
                      styles.presetCard,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        opacity: busy && !active ? 0.4 : 1,
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                    )}
                    <Text
                      variant="bodySm"
                      weight="700"
                      numberOfLines={1}
                      style={{ marginTop: 4, color: active ? '#fff' : theme.colors.text }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </>
        )}

        {/* Output */}
        {output && activePreset && (
          <Card padding={14} style={{ marginTop: 18 }}>
            <Text variant="caption" weight="700" color="textMuted" style={styles.label}>
              RESULT
            </Text>
            <View style={styles.fileRow}>
              <View style={[styles.fileIcon, { backgroundColor: theme.colors.success + '14' }]}>
                <Text style={{ fontSize: 20 }}>{activePreset.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text variant="body" weight="700">
                  {activePreset.label} version
                </Text>
                <Text variant="caption" color="textMuted">
                  Saved to your device
                </Text>
              </View>
              <Pressable
                onPress={() => play('output')}
                style={[styles.iconBtn, { backgroundColor: theme.colors.success + '14' }]}
              >
                <Icon
                  name={playing === 'output' ? 'pause' : 'play'}
                  size={18}
                  color={theme.colors.success}
                />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <GradientButton
                  title="Share"
                  iconName="share-social-outline"
                  iconPosition="left"
                  size="md"
                  onPress={shareOutput}
                />
              </View>
              <View style={{ flex: 1 }}>
                <GradientButton
                  title="Try another effect"
                  iconName="sparkles-outline"
                  iconPosition="left"
                  variant="ghost"
                  size="md"
                  onPress={() => {
                    stopAnyPlayback();
                    setOutput(null);
                    setActivePreset(null);
                  }}
                />
              </View>
            </View>
          </Card>
        )}

        <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 18 }}>
          Powered by FFmpeg • 100% on-device • no internet needed once installed
        </Text>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    padding: 18,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 12,
  },
  heroOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -50,
    right: -40,
  },
  label: {
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
