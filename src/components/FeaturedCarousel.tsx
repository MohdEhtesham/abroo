import React, { useEffect, useRef, useState } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import type { Property } from '../features/property/types';
import { SCREEN_WIDTH } from '../utils/dimensions';
import { formatCurrency } from '../utils/format';
import { Text } from './Text';

interface FeaturedCarouselProps {
  data: Property[];
  onPress: (p: Property) => void;
  height?: number;
  autoplay?: boolean;
}

const ITEM_W = SCREEN_WIDTH - 40;

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  data,
  onPress,
  height = 240,
  autoplay = true,
}) => {
  const theme = useTheme();
  const [active, setActive] = useState(0);
  const ref = useRef<FlatList>(null);

  useEffect(() => {
    if (!autoplay || data.length < 2) return;
    const t = setInterval(() => {
      const next = (active + 1) % data.length;
      ref.current?.scrollToOffset({ offset: next * (ITEM_W + 12), animated: true });
    }, 4000);
    return () => clearInterval(t);
  }, [active, autoplay, data.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (ITEM_W + 12));
    if (i !== active) setActive(i);
  };

  const renderItem: ListRenderItem<Property> = ({ item }) => (
    <Pressable
      onPress={() => onPress(item)}
      style={[
        styles.card,
        {
          width: ITEM_W,
          height,
          borderRadius: theme.radius.xl,
          ...theme.shadows.lg,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <Image source={{ uri: item.images[0] }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
        <Icon name="star" size={11} color="#fff" />
        <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 4 }}>
          FEATURED
        </Text>
      </View>
      <View style={styles.content}>
        <Text variant="caption" weight="600" style={{ color: theme.colors.accent, letterSpacing: 1.4 }}>
          {item.builder.toUpperCase()}
        </Text>
        <Text variant="h2" weight="700" style={{ color: '#fff', marginTop: 6 }} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.row}>
          <Icon name="location" size={14} color="#fff" />
          <Text variant="bodySm" style={{ color: '#fff', marginLeft: 4, opacity: 0.9 }} numberOfLines={1}>
            {item.locality}, {item.city}
          </Text>
        </View>
        <View style={[styles.row, { marginTop: 10, justifyContent: 'space-between' }]}>
          <View>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Starting at</Text>
            <Text variant="h3" weight="700" style={{ color: '#fff' }}>
              {formatCurrency(item.priceMin)}
            </Text>
          </View>
          <View style={[styles.cta, { backgroundColor: theme.colors.accent }]}>
            <Text weight="700" style={{ color: '#fff' }}>View</Text>
            <Icon name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_W + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      <View style={styles.dots}>
        {data.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === active ? 22 : 6,
              height: 6,
              borderRadius: 3,
              marginHorizontal: 3,
              backgroundColor: i === active ? theme.colors.primary : theme.colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
});
