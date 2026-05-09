import React from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import type { Property } from '../features/property/types';
import { formatCurrency } from '../utils/format';
import { Text } from './Text';
import { StatusBadge } from './StatusBadge';

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  onSavePress?: () => void;
  saved?: boolean;
  variant?: 'standard' | 'wide' | 'horizontal';
  style?: ViewStyle;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onSavePress,
  saved = false,
  variant = 'standard',
  style,
}) => {
  const theme = useTheme();

  if (variant === 'horizontal') {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.hCard,
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.lg,
            ...theme.shadows.sm,
            shadowColor: theme.colors.shadow,
          },
          style,
        ]}
      >
        <Image source={{ uri: property.images[0] }} style={styles.hImage} />
        <View style={styles.hBody}>
          <Text variant="h4" weight="700" numberOfLines={1}>
            {property.title}
          </Text>
          <View style={styles.row}>
            <Icon name="location-outline" size={13} color={theme.colors.textMuted} />
            <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
              {property.locality}, {property.city}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text variant="bodySm" weight="700" style={{ color: theme.colors.primary }}>
              {formatCurrency(property.priceMin)}
              {property.priceMax > property.priceMin ? ` - ${formatCurrency(property.priceMax)}` : ''}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <StatusBadge label={property.configuration[0]} tone="info" />
            <View style={{ width: 6 }} />
            <StatusBadge label={property.possessionStatus} tone="accent" />
          </View>
        </View>
      </Pressable>
    );
  }

  const cardWidth = variant === 'wide' ? '100%' : 280;
  const imageHeight = variant === 'wide' ? 200 : 180;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          width: cardWidth as any,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          ...theme.shadows.md,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}
    >
      <View>
        <Image
          source={{ uri: property.images[0] }}
          style={[styles.image, { height: imageHeight, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg }]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={[styles.imageOverlay, { borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg }]}
        />
        {property.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: theme.colors.accent }]}>
            <Icon name="star" size={10} color="#fff" />
            <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 4 }}>
              FEATURED
            </Text>
          </View>
        )}
        <Pressable
          onPress={onSavePress}
          hitSlop={10}
          style={[styles.heartBtn, { backgroundColor: 'rgba(255,255,255,0.95)' }]}
        >
          <Icon
            name={saved ? 'heart' : 'heart-outline'}
            size={18}
            color={saved ? theme.colors.error : theme.colors.text}
          />
        </Pressable>
        <View style={styles.imageBottomRow}>
          <View style={[styles.glassChip, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Icon name="images-outline" size={11} color="#fff" />
            <Text variant="caption" weight="600" style={{ color: '#fff', marginLeft: 4 }}>
              {property.images.length}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <Text variant="h4" weight="700" numberOfLines={1}>
          {property.title}
        </Text>
        <View style={[styles.row, { marginTop: 4 }]}>
          <Icon name="location-outline" size={13} color={theme.colors.textMuted} />
          <Text variant="caption" color="textMuted" numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
            {property.locality}, {property.city}
          </Text>
        </View>
        <View style={[styles.priceRow, { borderTopColor: theme.colors.divider }]}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textMuted">Starting at</Text>
            <Text variant="h4" weight="700" style={{ color: theme.colors.primary, marginTop: 2 }}>
              {formatCurrency(property.priceMin)}
            </Text>
          </View>
          <View style={[styles.row, { gap: 6 }]}>
            <StatusBadge label={property.configuration[0]} tone="info" />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginBottom: 4,
  },
  image: {
    width: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  body: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  hImage: {
    width: 110,
    height: 110,
  },
  hBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
});
