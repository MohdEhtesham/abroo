import type { Amenity } from '../types';

export const ALL_AMENITIES: Amenity[] = [
  { id: 'a1', name: 'Swimming Pool', iconName: 'water-outline' },
  { id: 'a2', name: 'Gymnasium', iconName: 'barbell-outline' },
  { id: 'a3', name: 'Clubhouse', iconName: 'business-outline' },
  { id: 'a4', name: 'Kids Play Area', iconName: 'happy-outline' },
  { id: 'a5', name: 'Landscaped Garden', iconName: 'leaf-outline' },
  { id: 'a6', name: '24x7 Security', iconName: 'shield-checkmark-outline' },
  { id: 'a7', name: 'Power Backup', iconName: 'flash-outline' },
  { id: 'a8', name: 'Covered Parking', iconName: 'car-outline' },
  { id: 'a9', name: 'Jogging Track', iconName: 'walk-outline' },
  { id: 'a10', name: 'Spa & Sauna', iconName: 'flower-outline' },
  { id: 'a11', name: 'Tennis Court', iconName: 'tennisball-outline' },
  { id: 'a12', name: 'Mini Theatre', iconName: 'film-outline' },
  { id: 'a13', name: 'Concierge', iconName: 'person-outline' },
  { id: 'a14', name: 'EV Charging', iconName: 'battery-charging-outline' },
  { id: 'a15', name: 'Yoga Deck', iconName: 'body-outline' },
  { id: 'a16', name: 'Indoor Games', iconName: 'game-controller-outline' },
];

export const pickAmenities = (count: number): Amenity[] => {
  const shuffled = [...ALL_AMENITIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
