import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Avatar,
  Card,
  GradientButton,
  Screen,
  SectionHeader,
  StatusBadge,
  Text,
  TimelineTracker,
  TimelineStep,
} from '../../../components';
import { useTheme } from '../../../theme';
import { formatDateTime } from '../../../utils/format';
import { inquiryService } from '../services/inquiryService';
import type { Inquiry } from '../types';
import { statusMeta } from '../utils/status';

export const InquiryDetailScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string;

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    inquiryService.detail(id).then(setInquiry);
  }, [id]);

  if (!inquiry) {
    return (
      <Screen edges={['top']}>
        <AnimatedHeader title="Inquiry" onBackPress={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  const meta = statusMeta(inquiry.status);
  const steps: TimelineStep[] = inquiry.events.map((e, idx) => {
    const last = idx === inquiry.events.length - 1;
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      timestamp: formatDateTime(e.timestamp),
      status: last && inquiry.status !== 'closed' ? 'active' : 'completed',
    };
  });

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Inquiry Details" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <Card padding={12}>
          <View style={{ flexDirection: 'row' }}>
            <Image source={{ uri: inquiry.propertyImage }} style={styles.image} />
            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
              <View>
                <Text variant="bodyLg" weight="700" numberOfLines={1}>{inquiry.propertyTitle}</Text>
                <Text variant="caption" color="textMuted" style={{ marginTop: 2 }} numberOfLines={1}>
                  {inquiry.propertyLocation}
                </Text>
              </View>
              <StatusBadge label={meta.label} tone={meta.tone} />
            </View>
          </View>
        </Card>

        {inquiry.advisorName && (
          <Card style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={inquiry.advisorName} size={48} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="caption" color="textMuted">Your dedicated advisor</Text>
                <Text variant="bodyLg" weight="700">{inquiry.advisorName}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.iconBtn, { backgroundColor: theme.colors.primary }]}>
                  <Icon name="call" size={18} color="#fff" />
                </View>
                <View style={[styles.iconBtn, { backgroundColor: theme.colors.success }]}>
                  <Icon name="chatbubbles" size={18} color="#fff" />
                </View>
              </View>
            </View>
          </Card>
        )}

        <SectionHeader title="Status timeline" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <Card>
          <TimelineTracker steps={steps} />
        </Card>

        <SectionHeader title="Your inquiry" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <Card>
          <Text variant="caption" color="textMuted">Name</Text>
          <Text variant="body" weight="600">{inquiry.fullName}</Text>
          <View style={{ height: 12 }} />
          <Text variant="caption" color="textMuted">Phone</Text>
          <Text variant="body" weight="600">+91 {inquiry.phone}</Text>
          <View style={{ height: 12 }} />
          <Text variant="caption" color="textMuted">Email</Text>
          <Text variant="body" weight="600">{inquiry.email}</Text>
          {inquiry.message && (
            <>
              <View style={{ height: 12 }} />
              <Text variant="caption" color="textMuted">Message</Text>
              <Text variant="body">{inquiry.message}</Text>
            </>
          )}
          <View style={{ height: 12 }} />
          <Text variant="caption" color="textMuted">Submitted on</Text>
          <Text variant="body" weight="600">{formatDateTime(inquiry.createdAt)}</Text>
        </Card>

        <View style={{ marginTop: 22 }}>
          <GradientButton
            title="Schedule a Site Visit"
            iconName="calendar-outline"
            iconPosition="left"
            onPress={() =>
              navigation.navigate('VisitsStack', {
                screen: 'ScheduleVisit',
                params: { propertyId: inquiry.propertyId },
              })
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
