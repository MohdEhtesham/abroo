import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnimatedHeader,
  Avatar,
  BottomSheet,
  CustomTextInput,
  GradientButton,
  Screen,
  Text,
} from '../../../components';
import { useTheme } from '../../../theme';
import { formatTime } from '../../../utils/format';
import { chatService } from '../services/chatService';
import type { AdvisorThread, ChatMessage } from '../types';

export const ChatScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [thread, setThread] = useState<AdvisorThread | null>(null);
  const [text, setText] = useState('');
  const [callback, setCallback] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('Anytime');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    chatService.thread().then(setThread);
    const t = setInterval(async () => {
      const updated = await chatService.poll();
      setThread({ ...updated });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    const t = text.trim();
    setText('');
    await chatService.send(t);
    const updated = await chatService.poll();
    setThread({ ...updated });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const submitCallback = async () => {
    await chatService.requestCallback({ name, phone, preferredTime: time });
    setCallback(false);
    setName('');
    setPhone('');
  };

  if (!thread) {
    return (
      <Screen edges={['top', 'bottom']}>
        <AnimatedHeader title="Chat" onBackPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.colors.divider }]}>
          <Icon name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 10 }}>
          <View>
            <Avatar name={thread.advisorName} size={42} />
            {thread.online && <View style={[styles.onlineDot, { backgroundColor: theme.colors.success, borderColor: theme.colors.surface }]} />}
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text variant="bodyLg" weight="700">{thread.advisorName}</Text>
            <Text variant="caption" style={{ color: thread.online ? theme.colors.success : theme.colors.textMuted }}>
              {thread.online ? 'Online now' : 'Offline'}
            </Text>
          </View>
        </View>
        <Pressable style={[styles.iconBtn, { backgroundColor: theme.colors.divider }]} onPress={() => setCallback(true)}>
          <Icon name="call-outline" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      >
        <FlatList
          ref={listRef}
          data={thread.messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 12 }}
          renderItem={({ item }) => {
            const mine = item.role === 'user';
            return (
              <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : null]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 }
                      : { backgroundColor: theme.colors.surfaceElevated, borderBottomLeftRadius: 4 },
                  ]}
                >
                  <Text style={{ color: mine ? '#fff' : theme.colors.text, fontSize: 15, lineHeight: 20 }}>
                    {item.text}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: mine ? 'rgba(255,255,255,0.75)' : theme.colors.textMuted,
                      marginTop: 4,
                      alignSelf: 'flex-end',
                    }}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
        <View style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.divider }]}>
          <View style={[styles.inputWrap, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              style={{ flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: 0, maxHeight: 100 }}
            />
          </View>
          <Pressable onPress={send} style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}>
            <Icon name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={callback} onClose={() => setCallback(false)} title="Request a callback">
        <Text variant="bodySm" color="textSecondary" style={{ marginBottom: 16 }}>
          Our advisor will call you back at your preferred time.
        </Text>
        <CustomTextInput label="Your name" value={name} onChangeText={setName} leftIcon="person-outline" />
        <CustomTextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          leftIcon="call-outline"
          keyboardType="number-pad"
          maxLength={10}
        />
        <Text variant="bodySm" weight="600" color="textSecondary" style={{ marginTop: 4, marginBottom: 8 }}>
          Preferred time
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {['Anytime', 'Morning', 'Afternoon', 'Evening'].map(t => {
            const active = time === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTime(t)}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text variant="bodySm" weight="600" style={{ color: active ? '#fff' : theme.colors.text }}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <GradientButton title="Request Callback" onPress={submitCallback} size="lg" />
      </BottomSheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
