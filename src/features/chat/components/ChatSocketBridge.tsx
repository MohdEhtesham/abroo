import React from 'react';
import { useChatSocket } from '../hooks/useChatSocket';

/**
 * Mount-only component. Lives at the app root inside the authenticated
 * portion of the tree so the chat socket auto-connects on login and
 * auto-disconnects on logout. Returns null — purely a side-effect host.
 */
export const ChatSocketBridge: React.FC = () => {
  useChatSocket();
  return null;
};
