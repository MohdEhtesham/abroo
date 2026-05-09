import React from 'react';
import { ViewStyle, StyleProp, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface KeyboardScreenProps {
  children: React.ReactNode;
  /** Padding around the scroll content. Bottom default is generous so the
   *  focused field always clears the keyboard on Android. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra space added above the focused input so it isn't hugging the
   *  keyboard. Useful on tight layouts. */
  extraScrollHeight?: number;
  /** Used by Android to land the focused input X pixels above the keyboard
   *  top. Higher number = more breathing room. */
  extraHeight?: number;
  showsVerticalScrollIndicator?: boolean;
  /** Convenience: hand the underlying scroll a ref. */
  innerRef?: (node: any) => void;
}

/**
 * Drop-in replacement for ScrollView on screens that contain TextInputs.
 *
 * Wraps `react-native-keyboard-aware-scroll-view`, which:
 *   - listens for keyboardWillShow / keyboardDidShow
 *   - measures the focused input's position
 *   - scrolls it into view above the keyboard, with a configurable margin
 *
 * This avoids all the brittle `KeyboardAvoidingView` + `behavior=padding` /
 * Android `adjustResize` quirks that were leaving fields hidden under the
 * keyboard, especially on screens with custom headers, transformed Views,
 * or lots of vertical content.
 */
export const KeyboardScreen: React.FC<KeyboardScreenProps> = ({
  children,
  contentContainerStyle,
  extraScrollHeight = 24,
  extraHeight = Platform.OS === 'android' ? 140 : 80,
  showsVerticalScrollIndicator = false,
  innerRef,
}) => (
  <KeyboardAwareScrollView
    style={{ flex: 1 }}
    contentContainerStyle={[{ flexGrow: 1, paddingBottom: 32 }, contentContainerStyle]}
    keyboardShouldPersistTaps="handled"
    enableOnAndroid
    enableResetScrollToCoords={false}
    extraScrollHeight={extraScrollHeight}
    extraHeight={extraHeight}
    showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    innerRef={innerRef}
  >
    {children}
  </KeyboardAwareScrollView>
);
