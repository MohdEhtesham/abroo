import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { io, Socket } from 'socket.io-client';
import { Avatar, Text } from '../../../components';
import { API_BASE_URL } from '../../../config/env';
import { navigationRef } from '../../../navigation/RootNavigator';
import { useAppSelector } from '../../../store';
import { useTheme } from '../../../theme';

interface IncomingCallPayload {
  visitId: string;
  callerName: string;
  callerRole: 'buyer' | 'seller';
  propertyTitle?: string;
}

// Long-press style ring pattern: 800ms vibrate, 1500ms pause, repeat.
// Vibration.vibrate(pattern, repeat) is supported on Android & iOS.
const RING_PATTERN = [0, 800, 1500];

/**
 * App-wide listener for incoming virtual-tour calls.
 *
 * Mounts a tiny socket connection to the /visit-call namespace whenever the
 * user is authenticated. On `incoming-call` it shows a fullscreen overlay
 * with Accept / Decline. The actual WebRTC peer connection is set up later
 * inside VideoCallScreen when the user accepts.
 *
 * Lives near the navigation root so the overlay paints on top of any screen,
 * just like a native phone call UI.
 */
export const IncomingCallOverlay: React.FC = () => {
  const theme = useTheme();
  const token = useAppSelector(s => s.auth.token);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  const [incoming, setIncoming] = useState<IncomingCallPayload | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Open / close the global ring socket as auth state flips.
  useEffect(() => {
    if (!isAuthenticated || !token) {
      try { socketRef.current?.disconnect(); } catch {}
      socketRef.current = null;
      return;
    }

    const socket = io(`${API_BASE_URL}/visit-call`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 15000,
    });
    socketRef.current = socket;

    socket.on('incoming-call', (payload: IncomingCallPayload) => {
      // Only show if we don't already have one in flight (avoid double-ring
      // if both transports deliver the event during a reconnect window).
      setIncoming(prev => prev ?? payload);
    });

    socket.on('incoming-call-cancelled', ({ visitId }: { visitId: string }) => {
      setIncoming(prev => (prev?.visitId === visitId ? null : prev));
    });

    return () => {
      try { socket.disconnect(); } catch {}
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  // Vibrate + play the system ringtone while the modal is up. Both are
  // wrapped in try/catch because:
  //   - Vibration.vibrate throws if the VIBRATE permission isn't declared
  //     (it now is, but old installs may not have re-granted yet).
  //   - InCallManager talks to native code; if its module isn't autolinked
  //     yet (fresh build pending), it should not take down the JS thread.
  useEffect(() => {
    if (!incoming) return;
    try {
      Vibration.vibrate(RING_PATTERN, true);
    } catch (e) {
      console.warn('[ring] vibrate failed', e);
    }
    try {
      // _DEFAULT_ asks Android to play the user's chosen system ringtone.
      // The other args (category / fileType / seconds) are optional at
      // runtime — the lib's TS typings overstate them, so cast through.
      (InCallManager.startRingtone as any)('_DEFAULT_', undefined, 'incomingCall', 30);
    } catch (e) {
      console.warn('[ring] startRingtone failed', e);
    }
    return () => {
      try { Vibration.cancel(); } catch {}
      try { InCallManager.stopRingtone(); } catch {}
    };
  }, [incoming]);

  const dismiss = useCallback(() => {
    setIncoming(null);
    try { Vibration.cancel(); } catch {}
    try { InCallManager.stopRingtone(); } catch {}
  }, []);

  const onAccept = useCallback(() => {
    if (!incoming) return;
    const { visitId, propertyTitle } = incoming;
    dismiss();
    // Navigate to the call screen — it'll set up its own WebRTC peer
    // connection. This top-level socket stays connected for future rings.
    if (navigationRef.isReady()) {
      // navigationRef is generic but the runtime API accepts (name, params).
      (navigationRef as any).navigate('VideoCall', { visitId, propertyTitle });
    }
  }, [dismiss, incoming]);

  const onDecline = useCallback(() => {
    if (!incoming) return;
    socketRef.current?.emit('decline-call', { visitId: incoming.visitId });
    dismiss();
  }, [dismiss, incoming]);

  if (!incoming) return null;

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      onRequestClose={onDecline}
      // Avoid statusBarTranslucent + a child StatusBar combo — that's a
      // known Android crash on some system-UI implementations. The gradient
      // already paints edge-to-edge.
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.root}
      >
        <View style={{ alignItems: 'center', marginTop: 80 }}>
          <Text variant="caption" weight="700" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1.4 }}>
            INCOMING VIRTUAL TOUR
          </Text>
          <View style={{ marginTop: 24 }}>
            <Avatar name={incoming.callerName} size={120} inverse />
          </View>
          <Text variant="h2" weight="800" style={{ color: '#fff', marginTop: 22 }} numberOfLines={1}>
            {incoming.callerName}
          </Text>
          {!!incoming.propertyTitle && (
            <Text
              variant="bodySm"
              style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, paddingHorizontal: 28, textAlign: 'center' }}
              numberOfLines={2}
            >
              {incoming.propertyTitle}
            </Text>
          )}
          <View style={styles.ringingRow}>
            <View style={styles.ringingDot} />
            <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginLeft: 8 }}>
              Ringing…
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onDecline} style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}>
            <Icon name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
          <Pressable onPress={onAccept} style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}>
            <Icon name="videocam" size={32} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.actionLabels}>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', width: 80 }}>
            Decline
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', width: 80 }}>
            Accept
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'space-between',
  },
  ringingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  ringingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
  },
  actionBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    marginTop: 10,
  },
});
