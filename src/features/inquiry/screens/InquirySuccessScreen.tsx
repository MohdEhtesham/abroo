import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { GradientButton, Screen, Text } from '../../../components';
import { useTheme } from '../../../theme';

export const InquirySuccessScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const inquiryId = route.params?.inquiryId as string;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.exp) }));
  }, [scale, opacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 12 }],
  }));

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.icon,
            iconStyle,
            { backgroundColor: theme.colors.success + '22' },
          ]}
        >
          <Icon name="checkmark-circle" size={68} color={theme.colors.success} />
        </Animated.View>
        <Animated.View style={textStyle}>
          <Text variant="displayMd" weight="800" align="center" style={{ marginTop: 28, letterSpacing: -0.5 }}>
            Inquiry submitted!
          </Text>
          <Text variant="body" color="textSecondary" align="center" style={{ marginTop: 12, lineHeight: 22 }}>
            A property advisor will get back to you within 30 minutes. You can track progress under "Inquiries".
          </Text>
        </Animated.View>
      </View>
      <View style={styles.cta}>
        <GradientButton
          title="View Inquiry"
          size="lg"
          onPress={() => navigation.replace('InquiryDetail', { id: inquiryId })}
        />
        <View style={{ height: 10 }} />
        <GradientButton
          title="Continue Browsing"
          variant="outline"
          size="lg"
          onPress={() => navigation.popToTop()}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
