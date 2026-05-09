import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import { GradientButton } from './GradientButton';
import { Text } from './Text';

interface EmptyStateProps {
  iconName?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'sparkles-outline',
  title,
  message,
  actionLabel,
  onActionPress,
  style,
}) => {
  const theme = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: theme.colors.primary + '14' },
        ]}
      >
        <Icon name={iconName} size={36} color={theme.colors.primary} />
      </View>
      <Text variant="h3" weight="700" align="center" style={{ marginTop: 18 }}>
        {title}
      </Text>
      {message && (
        <Text
          variant="body"
          color="textSecondary"
          align="center"
          style={{ marginTop: 8, maxWidth: 280, lineHeight: 22 }}
        >
          {message}
        </Text>
      )}
      {actionLabel && (
        <View style={{ marginTop: 24, width: '70%' }}>
          <GradientButton title={actionLabel} onPress={onActionPress ?? (() => {})} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
