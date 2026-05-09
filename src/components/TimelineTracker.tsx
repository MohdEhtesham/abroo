import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'pending';
  iconName?: string;
}

interface TimelineTrackerProps {
  steps: TimelineStep[];
}

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({ steps }) => {
  const theme = useTheme();

  return (
    <View>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const dotColor =
          step.status === 'completed'
            ? theme.colors.success
            : step.status === 'active'
            ? theme.colors.primary
            : theme.colors.border;

        const lineColor =
          step.status === 'completed' ? theme.colors.success : theme.colors.border;

        return (
          <View key={step.id} style={styles.row}>
            <View style={styles.left}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: dotColor,
                    borderColor:
                      step.status === 'active' ? theme.colors.primary + '40' : 'transparent',
                  },
                ]}
              >
                {step.status === 'completed' ? (
                  <Icon name="checkmark" size={14} color="#fff" />
                ) : step.status === 'active' ? (
                  <View style={[styles.innerDot, { backgroundColor: '#fff' }]} />
                ) : null}
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
            </View>
            <View style={styles.body}>
              <Text
                variant="bodyLg"
                weight="700"
                style={{
                  color:
                    step.status === 'pending' ? theme.colors.textMuted : theme.colors.text,
                }}
              >
                {step.title}
              </Text>
              {step.description && (
                <Text variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>
                  {step.description}
                </Text>
              )}
              {step.timestamp && (
                <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                  {step.timestamp}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  left: {
    width: 36,
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  body: {
    flex: 1,
    paddingBottom: 24,
    paddingLeft: 12,
  },
});
