import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  AnimatedHeader,
  Card,
  GradientButton,
  Screen,
  Text,
} from '../../../components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setSellerPlan } from '../../../store/slices/authSlice';
import { useTheme } from '../../../theme';
import type { SellerPlan } from '../../auth/types';

interface PlanDef {
  id: SellerPlan;
  name: string;
  priceMonthly: number;
  blurb: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    blurb: 'Try Aabroo with 1 free listing.',
    features: [
      '1 active listing',
      'Basic analytics',
      'Email leads only',
      'Standard placement',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 499,
    blurb: 'Best for individual sellers.',
    features: [
      '10 active listings',
      'Full analytics dashboard',
      'WhatsApp + Phone leads',
      'Priority placement in search',
      'Verified badge',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 1999,
    blurb: 'For builders and agencies.',
    features: [
      'Unlimited listings',
      'Advanced analytics & insights',
      'Featured placement on home',
      'Dedicated account manager',
      'Bulk listing tools',
      'API access (coming soon)',
    ],
    highlight: true,
  },
];

export const PlansScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const seller = useAppSelector(s => s.auth.user?.seller);

  const onSelect = (plan: SellerPlan) => {
    if (plan === seller?.plan) {
      Alert.alert("You're already on this plan");
      return;
    }
    if (plan === 'free') {
      Alert.alert(
        'Downgrade to Free?',
        'You will lose Pro features. You can re-upgrade anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Downgrade',
            onPress: () => {
              dispatch(setSellerPlan(plan));
            },
          },
        ],
      );
      return;
    }
    Alert.alert(
      `Subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)}?`,
      `Demo flow — no real payment. Mark as subscribed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            dispatch(setSellerPlan(plan));
            Alert.alert('Welcome aboard!', `You're now on ${plan.toUpperCase()} plan.`);
          },
        },
      ],
    );
  };

  return (
    <Screen edges={['top']}>
      <AnimatedHeader title="Plans" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text variant="displayMd" weight="800" style={{ letterSpacing: -0.5 }}>
            Grow faster
          </Text>
          <Text variant="body" color="textSecondary" style={{ marginTop: 6 }}>
            Pick a plan that fits your business. Cancel anytime.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 14 }}>
          {PLANS.map(plan => {
            const current = seller?.plan === plan.id;
            return (
              <Pressable key={plan.id} onPress={() => onSelect(plan.id)}>
                {plan.highlight ? (
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planCardHighlight}
                  >
                    <PlanContent plan={plan} current={current} highlight />
                  </LinearGradient>
                ) : (
                  <Card style={[styles.planCard, current && { borderColor: theme.colors.success, borderWidth: 1.5 }]}>
                    <PlanContent plan={plan} current={current} />
                  </Card>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Card>
            <Text variant="h4" weight="700">FAQ</Text>
            <View style={{ height: 8 }} />
            <FaqItem
              q="Is this a real subscription?"
              a="No — this is a demo. No payments are processed. The plan badge changes locally to show how the SaaS flow works."
            />
            <FaqItem
              q="Can I switch plans anytime?"
              a="Yes. Upgrade or downgrade with one tap; changes are instant."
            />
            <FaqItem
              q="Do unsold listings expire?"
              a="No. Listings stay live until you mark them sold or paused. Quotas only count active listings."
            />
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
};

const PlanContent: React.FC<{ plan: PlanDef; current: boolean; highlight?: boolean }> = ({
  plan,
  current,
  highlight,
}) => {
  const theme = useTheme();
  const fg = highlight ? '#fff' : theme.colors.text;
  const fgMuted = highlight ? 'rgba(255,255,255,0.85)' : theme.colors.textSecondary;
  const accent = highlight ? theme.colors.accent : theme.colors.primary;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="h2" weight="800" style={{ color: fg, flex: 1 }}>
          {plan.name}
        </Text>
        {plan.highlight && (
          <View style={[styles.popularBadge, { backgroundColor: theme.colors.accent }]}>
            <Icon name="star" size={11} color="#fff" />
            <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 4 }}>
              POPULAR
            </Text>
          </View>
        )}
        {current && (
          <View style={[styles.popularBadge, { backgroundColor: theme.colors.success, marginLeft: 6 }]}>
            <Icon name="checkmark" size={11} color="#fff" />
            <Text variant="caption" weight="700" style={{ color: '#fff', marginLeft: 4 }}>
              CURRENT
            </Text>
          </View>
        )}
      </View>
      <Text variant="bodySm" style={{ color: fgMuted, marginTop: 4 }}>
        {plan.blurb}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 }}>
        <Text variant="displayMd" weight="800" style={{ color: fg, lineHeight: 38 }}>
          ₹{plan.priceMonthly}
        </Text>
        <Text variant="bodySm" style={{ color: fgMuted, marginBottom: 6, marginLeft: 6 }}>
          / month
        </Text>
      </View>
      <View style={{ marginTop: 14, gap: 8 }}>
        {plan.features.map(f => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon
              name="checkmark-circle"
              size={16}
              color={highlight ? theme.colors.accent : theme.colors.success}
            />
            <Text variant="bodySm" style={{ color: fg, marginLeft: 8 }}>
              {f}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 16 }}>
        {current ? (
          <View style={[styles.cta, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text weight="700" style={{ color: highlight ? '#fff' : theme.colors.success }}>
              Active plan
            </Text>
          </View>
        ) : (
          <GradientButton
            title={plan.priceMonthly === 0 ? 'Switch to Free' : `Subscribe to ${plan.name}`}
            variant={highlight ? 'accent' : 'primary'}
            size="md"
            onPress={() => {}}
          />
        )}
      </View>
    </View>
  );
};

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => (
  <View style={{ marginTop: 12 }}>
    <Text weight="700">{q}</Text>
    <Text variant="bodySm" color="textSecondary" style={{ marginTop: 4, lineHeight: 19 }}>
      {a}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  planCard: {
    padding: 18,
  },
  planCardHighlight: {
    padding: 18,
    borderRadius: 16,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
