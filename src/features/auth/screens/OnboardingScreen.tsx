import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { GradientButton, Screen, Text } from '../../../components';
import { APP_NAME } from '../../../constants';
import { useTheme } from '../../../theme';
import { SCREEN_WIDTH } from '../../../utils/dimensions';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  iconName: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Discover Premium Homes',
    subtitle: "Curated listings from India's most trusted builders, all in one place.",
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70',
    iconName: 'sparkles',
  },
  {
    id: '2',
    title: 'Schedule Visits Effortlessly',
    subtitle: 'Book site visits in a few taps. Talk to dedicated property advisors.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=70',
    iconName: 'calendar',
  },
  {
    id: '3',
    title: 'Track Every Inquiry',
    subtitle: 'Real-time updates from inquiry to keys handover. Stay in control.',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=900&q=70',
    iconName: 'shield-checkmark',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const ref = useRef<FlatList<Slide>>(null);
  const [active, setActive] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== active) setActive(idx);
  };

  const next = () => {
    if (active < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: active + 1 });
    } else {
      onComplete();
    }
  };

  const renderItem: ListRenderItem<Slide> = ({ item, index }) => (
    <SlideView item={item} index={index} scrollX={scrollX} accent={theme.colors.accent} />
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={[styles.brandDot, { backgroundColor: theme.colors.primary }]}>
          <Icon name="home" size={14} color="#fff" />
        </View>
        <Text weight="800" style={{ marginLeft: 8, letterSpacing: 0.4 }}>
          {APP_NAME}
        </Text>
        <View style={{ flex: 1 }} />
        {active < SLIDES.length - 1 && (
          <Pressable hitSlop={10} onPress={onComplete}>
            <Text variant="bodySm" weight="700" color="textMuted">
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <AnimatedFlatList
        ref={ref as any}
        data={SLIDES}
        keyExtractor={s => s.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      />

      {/* Segmented progress bar */}
      <View style={styles.progressRow}>
        {SLIDES.map((_, i) => (
          <ProgressSegment
            key={i}
            index={i}
            active={i === active}
            done={i < active}
            primary={theme.colors.primary}
            border={theme.colors.border}
          />
        ))}
      </View>

      <View style={styles.cta}>
        <GradientButton
          title={active === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={next}
          iconName="arrow-forward"
          size="lg"
        />
        <Text variant="caption" color="textMuted" align="center" style={{ marginTop: 14 }}>
          {active + 1} of {SLIDES.length}
        </Text>
      </View>
    </Screen>
  );
};

const SlideView: React.FC<{
  item: Slide;
  index: number;
  scrollX: SharedValue<number>;
  accent: string;
}> = ({ item, index, scrollX, accent }) => {
  const theme = useTheme();
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [-60, 0, 60],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP),
      },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollX.value,
          inputRange,
          [40, 0, 40],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ width: SCREEN_WIDTH }}>
      <Animated.View style={[styles.imageWrap, imageStyle]}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <LinearGradient
          colors={['transparent', theme.colors.background]}
          style={styles.imageOverlay}
        />
        <View style={[styles.iconBadge, { backgroundColor: accent }]}>
          <Icon name={item.iconName as any} size={20} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text variant="displayMd" weight="800" align="center" style={{ letterSpacing: -0.5 }}>
          {item.title}
        </Text>
        <Text
          variant="bodyLg"
          color="textSecondary"
          align="center"
          style={{ marginTop: 12, lineHeight: 24, paddingHorizontal: 28 }}
        >
          {item.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
};

const ProgressSegment: React.FC<{
  index: number;
  active: boolean;
  done: boolean;
  primary: string;
  border: string;
}> = ({ active, done, primary, border }) => {
  const fill = useSharedValue(active || done ? 1 : 0);

  React.useEffect(() => {
    fill.value = active || done ? 1 : 0;
  }, [fill, active, done]);

  const style = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={[styles.segmentTrack, { backgroundColor: border }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: primary }, style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    height: '60%',
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  textWrap: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 14,
    gap: 6,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: 2,
  },
  cta: {
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
});
