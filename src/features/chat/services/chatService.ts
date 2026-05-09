import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiGet, apiPost } from '../../../services/apiClient';
import { MOCK_THREAD } from '../mockData/chat';
import type { AdvisorThread, ChatMessage } from '../types';

let thread: AdvisorThread = { ...MOCK_THREAD, messages: [...MOCK_THREAD.messages] };

const advisorReplies = [
  "That's a great question. Let me check and revert in a few minutes.",
  'Sure, I can arrange that. Would Saturday morning work for you?',
  "I'll send you the details right away.",
  'We have flexible payment options. Let me share the brochure.',
  "Absolutely! I'll connect with the builder and update you.",
];

const mock = {
  thread: (): Promise<AdvisorThread> => mockResponse(thread, 400),
  send: async (text: string): Promise<ChatMessage> => {
    const userMsg: ChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    thread = { ...thread, messages: [...thread.messages, userMsg] };
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `m${Date.now() + 1}`,
        role: 'advisor',
        text: advisorReplies[Math.floor(Math.random() * advisorReplies.length)],
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      thread = { ...thread, messages: [...thread.messages, reply] };
    }, 1400);
    return mockResponse(userMsg, 200);
  },
  requestCallback: async (input: { name: string; phone: string; preferredTime: string }) =>
    mockResponse({ success: true, ...input }, 700),
  poll: () => Promise.resolve(thread),
};

let realThread: AdvisorThread | null = null;
const real = {
  thread: async () => {
    const t = await apiGet<AdvisorThread>('/chat/thread');
    realThread = t;
    return t;
  },
  send: async (text: string) => {
    const t = await apiPost<AdvisorThread>('/chat/send', { text });
    realThread = t;
    return t.messages[t.messages.length - 1];
  },
  requestCallback: (input: { name: string; phone: string; preferredTime: string }) =>
    apiPost<{ success: boolean }>('/chat/callback', input),
  poll: async () => {
    if (!realThread) realThread = await apiGet<AdvisorThread>('/chat/thread');
    return realThread;
  },
};

export const chatService = USE_MOCK ? mock : real;
