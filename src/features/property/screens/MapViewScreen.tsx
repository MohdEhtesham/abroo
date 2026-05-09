import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { AnimatedHeader, Card, GradientButton, Screen, Text } from '../../../components';
import { useTheme } from '../../../theme';
import { formatCurrency } from '../../../utils/format';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types';

export const MapViewScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string;
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    propertyService.detail(id).then(setProperty);
  }, [id]);

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Location" onBackPress={() => navigation.goBack()} />
      <View style={styles.container}>
        <Image
          source={{
            uri: 'https://maps.googleapis.com/maps/api/staticmap?center=Gurgaon&zoom=12&size=600x800&maptype=roadmap',
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />
        <View style={styles.pinWrap}>
          <View style={[styles.pin, { backgroundColor: theme.colors.primary }]}>
            <Icon name="home" size={20} color="#fff" />
          </View>
        </View>
        {property && (
          <View style={styles.cardWrap}>
            <Card>
              <Text variant="bodyLg" weight="700">{property.title}</Text>
              <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4 }}>
                {property.address}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Text variant="h4" weight="700" style={{ color: theme.colors.primary }}>
                  {formatCurrency(property.priceMin)}+
                </Text>
                <Text variant="bodySm" color="textMuted">{property.locality}</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <GradientButton title="View Property" onPress={() => navigation.goBack()} size="md" />
              </View>
            </Card>
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pinWrap: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  cardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
});
