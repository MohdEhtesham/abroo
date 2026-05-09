import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { initials } from '../utils/format';
import { Text } from './Text';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
  /**
   * Use on dark/colored backgrounds (e.g. inside the hero gradient). Switches
   * the initials fallback to white-on-translucent so it stays legible.
   */
  inverse?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 48, inverse = false }) => {
  const theme = useTheme();
  const [errored, setErrored] = useState(false);

  // Reset error state when uri changes — otherwise a stale broken-uri flag
  // would prevent a freshly-set valid uri from rendering.
  useEffect(() => {
    setErrored(false);
  }, [uri]);

  const trimmedUri = typeof uri === 'string' ? uri.trim() : '';
  const showImage = !!trimmedUri && !errored;

  if (showImage) {
    return (
      <Image
        source={{ uri: trimmedUri }}
        onError={() => setErrored(true)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: inverse ? 'rgba(255,255,255,0.18)' : theme.colors.divider,
        }}
      />
    );
  }

  // Fallback: initials chip. Two variants so we always contrast with the bg.
  const bg = inverse ? 'rgba(255,255,255,0.22)' : theme.colors.primary + '22';
  const fg = inverse ? '#fff' : theme.colors.primary;

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: inverse ? 1.5 : 0,
          borderColor: 'rgba(255,255,255,0.35)',
        },
      ]}
    >
      <Text weight="800" style={{ color: fg, fontSize: size * 0.36 }}>
        {initials(name) || '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
