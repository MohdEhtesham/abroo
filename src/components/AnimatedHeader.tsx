import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Text } from './Text';

interface AnimatedHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightLabel?: string;
  transparent?: boolean;
  style?: ViewStyle;
  centerTitle?: boolean;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  showBack = true,
  onBackPress,
  rightIcon,
  onRightPress,
  rightLabel,
  transparent = false,
  style,
  centerTitle = true,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: transparent ? insets.top + 6 : 8,
          backgroundColor: transparent ? 'transparent' : theme.colors.surface,
          borderBottomColor: transparent ? 'transparent' : theme.colors.divider,
          borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            hitSlop={10}
            onPress={onBackPress}
            style={[
              styles.iconBtn,
              {
                backgroundColor: transparent
                  ? 'rgba(0,0,0,0.35)'
                  : theme.colors.divider,
              },
            ]}
          >
            <Icon
              name="chevron-back"
              size={22}
              color={transparent ? '#fff' : theme.colors.text}
            />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        {centerTitle && title && (
          <Text variant="h4" weight="700" align="center" numberOfLines={1} style={{ flex: 1, color: transparent ? '#fff' : theme.colors.text }}>
            {title}
          </Text>
        )}
        {rightIcon ? (
          <Pressable
            hitSlop={10}
            onPress={onRightPress}
            style={[
              styles.iconBtn,
              {
                backgroundColor: transparent
                  ? 'rgba(0,0,0,0.35)'
                  : theme.colors.divider,
              },
            ]}
          >
            <Icon
              name={rightIcon}
              size={20}
              color={transparent ? '#fff' : theme.colors.text}
            />
          </Pressable>
        ) : rightLabel ? (
          <Pressable hitSlop={10} onPress={onRightPress}>
            <Text variant="bodySm" weight="600" style={{ color: theme.colors.primary }}>
              {rightLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
      {!centerTitle && title && (
        <Text variant="h2" weight="700" style={{ paddingHorizontal: 20, marginTop: 8 }}>
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
