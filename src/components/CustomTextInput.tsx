import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import { Text } from './Text';

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'outlined' | 'filled';
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  variant = 'outlined',
  secureTextEntry,
  ...rest
}) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error
    ? theme.colors.error
    : focused
    ? theme.colors.primary
    : theme.colors.border;

  const bg = variant === 'filled' ? theme.colors.surface : theme.colors.surfaceElevated;

  return (
    <View style={[{ marginBottom: theme.spacing.base }, containerStyle]}>
      {label && (
        <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.input,
          {
            borderColor,
            backgroundColor: bg,
            borderRadius: theme.radius.base,
          },
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={focused ? theme.colors.primary : theme.colors.textMuted}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontSize: 15,
            paddingVertical: 0,
          }}
        />
        {secureTextEntry ? (
          <Pressable hitSlop={10} onPress={() => setHidden(h => !h)}>
            <Icon
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable hitSlop={10} onPress={onRightIconPress}>
            <Icon name={rightIcon} size={20} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error && (
        <Text variant="caption" color="error" style={{ marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    paddingHorizontal: 14,
    height: 52,
  },
});
