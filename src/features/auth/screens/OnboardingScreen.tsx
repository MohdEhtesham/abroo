import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GradientButton, Screen, Text } from '../../../components';
import { useTheme } from '../../../theme';
import { SCREEN_WIDTH } from '../../../utils/dimensions';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Discover Premium Homes',
    subtitle: 'Curated listings from India\'s most trusted builders, all in one place.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=70',
  },
  {
    id: '2',
    title: 'Schedule Visits Effortlessly',
    subtitle: 'Book site visits in a few taps. Talk to dedicated property advisors.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=70',
  },
  {
    id: '3',
    title: 'Track Every Inquiry',
    subtitle: 'Real-time updates from inquiry to keys handover. Stay in control.',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=900&q=70',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const ref = useRef<FlatList<Slide>>(null);
  const [active, setActive] = useState(0);

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={{ width: SCREEN_WIDTH }}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <LinearGradient
          colors={['transparent', theme.colors.background]}
          style={styles.imageOverlay}
        />
      </View>
      <View style={styles.textWrap}>
        <Text variant="displayMd" weight="800" align="center" style={{ letterSpacing: -0.5 }}>
          {item.title}
        </Text>
        <Text
          variant="bodyLg"
          color="textSecondary"
          align="center"
          style={{ marginTop: 14, lineHeight: 24, paddingHorizontal: 28 }}
        >
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  return (
    <Screen edges={['top', 'bottom']}>
      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={s => s.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === active ? 28 : 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 4,
              backgroundColor: i === active ? theme.colors.primary : theme.colors.border,
            }}
          />
        ))}
      </View>
      <View style={styles.cta}>
        <GradientButton
          title={active === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={next}
          iconName="arrow-forward"
          size="lg"
        />
        {active < SLIDES.length - 1 && (
          <View style={{ marginTop: 10 }}>
            <GradientButton title="Skip" variant="ghost" onPress={onComplete} />
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  imageWrap: {
    height: '55%',
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
  textWrap: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 22,
  },
  cta: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
});
