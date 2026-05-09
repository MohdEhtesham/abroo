import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { initials } from '../utils/format';
import { Text } from './Text';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 48 }) => {
  const theme = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary + '22',
        },
      ]}
    >
      <Text weight="700" style={{ color: theme.colors.primary, fontSize: size * 0.36 }}>
        {initials(name)}
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
