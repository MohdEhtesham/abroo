import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  Screen,
  SectionHeader,
  Text,
} from '../../../components';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../../constants';
import { useTheme } from '../../../theme';

const FAQS = [
  {
    q: 'How do I submit an inquiry?',
    a: 'On any property page, tap the "Inquire Now" button at the bottom. Fill in your details and we\'ll connect you with a dedicated advisor within 30 minutes.',
  },
  {
    q: 'How do I schedule a site visit?',
    a: 'Go to a property and tap "Schedule Visit". Pick a date, time slot and visit mode (in-person or virtual). You can reschedule or cancel anytime.',
  },
  {
    q: 'Are the listings RERA-verified?',
    a: 'Yes. Every property listed on Aabroo displays its RERA registration ID and has been verified by our compliance team.',
  },
  {
    q: 'Is there a fee to use the app?',
    a: 'No. Aabroo is completely free. Builders pay us a success fee only after a successful sale.',
  },
  {
    q: 'How do I change my preferences?',
    a: 'Go to Profile → Requirement Preferences. Pick your cities, property types, configurations and budget — we\'ll personalize your home feed.',
  },
];

export const HelpSupportScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Help & Support" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <SectionHeader title="Get in touch" style={{ paddingHorizontal: 0 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            style={[styles.contactCard, { backgroundColor: theme.colors.primary + '12' }]}
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: theme.colors.primary }]}>
              <Icon name="call" size={20} color="#fff" />
            </View>
            <Text weight="700" style={{ marginTop: 10 }}>Call us</Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>{SUPPORT_PHONE}</Text>
          </Pressable>
          <Pressable
            style={[styles.contactCard, { backgroundColor: theme.colors.success + '12' }]}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <View style={[styles.contactIcon, { backgroundColor: theme.colors.success }]}>
              <Icon name="mail" size={20} color="#fff" />
            </View>
            <Text weight="700" style={{ marginTop: 10 }}>Email us</Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }} numberOfLines={1}>
              {SUPPORT_EMAIL}
            </Text>
          </Pressable>
        </View>

        <SectionHeader title="FAQs" style={{ paddingHorizontal: 0, marginTop: 22 }} />
        <Card padding={0}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Pressable
                key={i}
                onPress={() => setOpen(isOpen ? null : i)}
                style={[
                  styles.faqItem,
                  i < FAQS.length - 1 && {
                    borderBottomColor: theme.colors.divider,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text weight="700" style={{ flex: 1 }}>{f.q}</Text>
                  <Icon
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </View>
                {isOpen && (
                  <Text variant="bodySm" color="textSecondary" style={{ marginTop: 8, lineHeight: 20 }}>
                    {f.a}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Card>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  contactCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
