import React, { useEffect, useState } from 'react';
import { TextStyle } from 'react-native';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text, TextProps } from './Text';

interface CountUpProps extends Omit<TextProps, 'children'> {
  to: number;
  /** Animation duration in ms (default 1100) */
  duration?: number;
  /** Delay before starting (default 0) */
  delay?: number;
  /** Decimal places to show (default 0) */
  decimals?: number;
  /** Optional suffix appended to formatted number, e.g. '%' or '+' */
  suffix?: string;
  /** Optional prefix prepended to formatted number, e.g. '₹' */
  prefix?: string;
  /** Format using locale separators (Indian commas etc.) — default true */
  localized?: boolean;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  duration = 700,
  delay = 0,
  decimals = 0,
  suffix = '',
  prefix = '',
  localized = true,
  ...textProps
}) => {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState<string>(() => format(0));

  function format(n: number) {
    const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
    if (localized && decimals === 0) {
      return prefix + Math.round(n).toLocaleString('en-IN') + suffix;
    }
    return prefix + fixed + suffix;
  }

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, to, duration, delay]);

  useAnimatedReaction(
    () => progress.value,
    p => {
      const current = p * to;
      runOnJS(setDisplay)(format(current));
    },
    [to, decimals, suffix, prefix, localized],
  );

  return <Text {...textProps}>{display}</Text>;
};
