import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { SCREEN_WIDTH } from '../utils/dimensions';

interface ImageCarouselProps {
  images: string[];
  height?: number;
  width?: number;
  borderRadius?: number;
  style?: ViewStyle;
  onIndexChange?: (i: number) => void;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 220,
  width = SCREEN_WIDTH - 40,
  borderRadius,
  style,
  onIndexChange,
}) => {
  const theme = useTheme();
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== active) {
      setActive(idx);
      onIndexChange?.(idx);
    }
  };

  return (
    <View style={[{ height }, style]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={{
              width,
              height,
              borderRadius: borderRadius ?? 0,
            }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === active ? 22 : 6,
                backgroundColor: i === active ? theme.colors.accent : 'rgba(255,255,255,0.6)',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
});
