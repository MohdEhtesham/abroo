import React from 'react';
import { Pressable, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  onPress?: () => void;
  onFilterPress?: () => void;
  showFilter?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search projects, locations, builders…',
  onPress,
  onFilterPress,
  showFilter = true,
  editable = true,
  style,
  autoFocus,
}) => {
  const theme = useTheme();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.base,
          ...theme.shadows.sm,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
    >
      <Icon name="search" size={20} color={theme.colors.textMuted} />
      <TextInput
        editable={editable && !onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoFocus={autoFocus}
        placeholderTextColor={theme.colors.textMuted}
        style={{
          flex: 1,
          marginLeft: 10,
          color: theme.colors.text,
          fontSize: 15,
          paddingVertical: 0,
        }}
      />
      {showFilter && (
        <Pressable hitSlop={10} onPress={onFilterPress}>
          <View
            style={[
              styles.filterBtn,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <Icon name="options-outline" size={18} color="#fff" />
          </View>
        </Pressable>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
