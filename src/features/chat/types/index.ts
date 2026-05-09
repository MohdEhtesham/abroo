export type ChatRole = 'user' | 'advisor';
export type ChatMsgStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
  status?: ChatMsgStatus;
}

export interface AdvisorThread {
  id: string;
  advisorName: string;
  advisorAvatar?: string;
  advisorTitle: string;
  online: boolean;
  lastActive: string;
  messages: ChatMessage[];
}
