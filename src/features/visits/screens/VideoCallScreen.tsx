import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/Ionicons';
import { io, Socket } from 'socket.io-client';
import { Text } from '../../../components';
import { API_BASE_URL } from '../../../config/env';
import { useAppSelector } from '../../../store';

type VideoCallParams = {
  VideoCall: { visitId: string; propertyTitle?: string };
};

// Free STUN + Open Relay free TURN. STUN handles ~70-80% of NAT scenarios;
// the TURN servers are needed for symmetric NATs / restrictive carrier
// networks. Open Relay is community-funded and rate-limited but adequate
// for low-volume use; swap for self-hosted coturn when traffic warrants.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

type ConnState = 'idle' | 'requesting-permissions' | 'connecting' | 'waiting-for-peer' | 'connected' | 'ended' | 'failed';

const requestAndroidPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);
  return (
    granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
    granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
  );
};

export const VideoCallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<VideoCallParams, 'VideoCall'>>();
  const { visitId, propertyTitle } = route.params;
  const token = useAppSelector(s => s.auth.token);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<ConnState>('idle');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);

  // Refs because the socket / pc need to be referenced inside event handlers
  // without re-binding through state setters.
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const peerSocketIdRef = useRef<string | null>(null);
  const isInitiatorRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const teardownRef = useRef<() => void>(() => {});

  const teardown = useCallback(() => {
    try { socketRef.current?.emit('leave', { visitId }); } catch {}
    try { socketRef.current?.disconnect(); } catch {}
    socketRef.current = null;

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
  }, [visitId]);
  teardownRef.current = teardown;

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // @ts-ignore — RN-WebRTC's typings don't fully align with the spec
    pc.addEventListener('icecandidate', (event: any) => {
      const peerId = peerSocketIdRef.current;
      if (event.candidate && peerId) {
        socketRef.current?.emit('signal', {
          to: peerId,
          data: { type: 'ice-candidate', candidate: event.candidate.toJSON() },
        });
      }
    });

    // @ts-ignore
    pc.addEventListener('track', (event: any) => {
      const [stream] = event.streams;
      if (stream) setRemoteStream(stream);
    });

    // @ts-ignore — older fallback for environments where 'track' isn't fired
    pc.addEventListener('addstream', (event: any) => {
      if (event.stream) setRemoteStream(event.stream);
    });

    // @ts-ignore
    pc.addEventListener('connectionstatechange', () => {
      const cs = (pc as any).connectionState;
      if (cs === 'connected') setState('connected');
      if (cs === 'failed' || cs === 'closed') setState(prev => (prev === 'ended' ? prev : 'failed'));
    });

    return pc;
  }, []);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    const peerId = peerSocketIdRef.current;
    if (!pc || !peerId) return;
    try {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('signal', {
        to: peerId,
        data: { type: 'offer', sdp: offer.sdp },
      });
    } catch (e) {
      console.warn('[webrtc] createOffer failed', e);
      setState('failed');
    }
  }, []);

  const handleSignal = useCallback(
    async ({ from, data }: { from: string; data: any }) => {
      peerSocketIdRef.current = from;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (data.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit('signal', {
            to: from,
            data: { type: 'answer', sdp: answer.sdp },
          });
        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        } else if (data.type === 'ice-candidate' && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (e) {
        console.warn('[webrtc] handleSignal failed', e);
      }
    },
    [],
  );

  // Single bootstrap: permissions → media → socket → peer connection.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState('requesting-permissions');
      const ok = await requestAndroidPermissions();
      if (!ok) {
        Alert.alert('Permissions required', 'Camera and microphone are needed for the virtual tour.');
        setState('failed');
        return;
      }

      let stream: MediaStream;
      try {
        stream = (await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24 },
          },
        })) as unknown as MediaStream;
      } catch (e) {
        console.warn('[webrtc] getUserMedia failed', e);
        Alert.alert('Camera error', 'Could not access camera or microphone.');
        setState('failed');
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (!token) {
        Alert.alert('Auth required', 'Please log in again to start the call.');
        setState('failed');
        return;
      }

      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach(track => {
        // @ts-ignore — addTrack overload differs in rn-webrtc typings
        pc.addTrack(track, stream);
      });

      const socket = io(`${API_BASE_URL}/visit-call`, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 15000,
      });
      socketRef.current = socket;
      setState('connecting');

      socket.on('connect', () => {
        socket.emit('join', { visitId }, (ack: any) => {
          if (cancelled) return;
          if (!ack?.ok) {
            Alert.alert('Cannot join', ack?.error ?? 'Unable to join the call.');
            setState('failed');
            return;
          }
          if (Array.isArray(ack.peers) && ack.peers.length > 0) {
            // Peer is already in the room → we initiate the offer.
            peerSocketIdRef.current = ack.peers[0].socketId;
            isInitiatorRef.current = true;
            setState('connecting');
            createOffer();
          } else {
            setState('waiting-for-peer');
          }
        });
      });

      socket.on('peer-joined', ({ socketId }: { socketId: string }) => {
        // The pre-existing peer always initiates so we don't both create
        // simultaneous offers (glare). When this side was the only peer
        // when joining, it becomes the initiator on peer-joined.
        peerSocketIdRef.current = socketId;
        isInitiatorRef.current = true;
        setState('connecting');
        createOffer();
      });

      socket.on('signal', handleSignal);

      socket.on('peer-left', () => {
        peerSocketIdRef.current = null;
        setRemoteStream(null);
        setState('waiting-for-peer');
      });

      socket.on('error', payload => {
        Alert.alert('Call error', payload?.message ?? 'Connection error');
        setState('failed');
      });

      socket.on('connect_error', err => {
        console.warn('[socket] connect_error', err.message);
        setState('failed');
      });
    })();

    return () => {
      cancelled = true;
      teardownRef.current();
    };
  }, [createOffer, createPeerConnection, handleSignal, token, visitId]);

  const onToggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStream?.getAudioTracks().forEach(t => {
      t.enabled = !next;
    });
  };

  const onToggleVideo = () => {
    const next = !videoOff;
    setVideoOff(next);
    localStream?.getVideoTracks().forEach(t => {
      t.enabled = !next;
    });
  };

  const onSwitchCamera = () => {
    localStream?.getVideoTracks().forEach(t => {
      // @ts-ignore — _switchCamera is a rn-webrtc extension
      if (typeof t._switchCamera === 'function') t._switchCamera();
    });
    setUsingFrontCamera(prev => !prev);
  };

  const onEnd = () => {
    setState('ended');
    teardown();
    navigation.goBack();
  };

  const statusLabel: Record<ConnState, string> = {
    idle: 'Starting…',
    'requesting-permissions': 'Requesting camera & mic…',
    connecting: 'Connecting…',
    'waiting-for-peer': 'Waiting for the other side to join…',
    connected: 'Live',
    ended: 'Call ended',
    failed: 'Call failed',
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Remote stream — fullscreen */}
      <View style={styles.remoteWrap}>
        {remoteStream ? (
          <RTCView streamURL={(remoteStream as any).toURL()} style={styles.remote} objectFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator color="#fff" size="large" />
            <Text variant="bodyLg" weight="700" style={{ color: '#fff', marginTop: 16 }}>
              {statusLabel[state]}
            </Text>
            {!!propertyTitle && (
              <Text variant="bodySm" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
                {propertyTitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Local preview — picture in picture */}
      {localStream && (
        <View style={styles.pip}>
          <RTCView
            streamURL={(localStream as any).toURL()}
            style={styles.pipVideo}
            objectFit="cover"
            mirror={usingFrontCamera}
          />
          {videoOff && (
            <View style={styles.pipDim}>
              <Icon name="videocam-off" size={20} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Top status pill */}
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: state === 'connected' ? '#22c55e' : state === 'failed' ? '#ef4444' : '#f59e0b' },
            ]}
          />
          <Text variant="caption" weight="700" style={{ color: '#fff' }}>
            {statusLabel[state]}
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <CtrlBtn icon={muted ? 'mic-off' : 'mic'} onPress={onToggleMute} active={muted} />
        <CtrlBtn icon={videoOff ? 'videocam-off' : 'videocam'} onPress={onToggleVideo} active={videoOff} />
        <CtrlBtn icon="camera-reverse-outline" onPress={onSwitchCamera} />
        <Pressable onPress={onEnd} style={[styles.ctrlBtn, { backgroundColor: '#ef4444' }]}>
          <Icon name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>
      </View>
    </View>
  );
};

const CtrlBtn: React.FC<{ icon: string; onPress: () => void; active?: boolean }> = ({
  icon,
  onPress,
  active,
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.ctrlBtn,
      { backgroundColor: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)' },
    ]}
  >
    <Icon name={icon as any} size={24} color={active ? '#111' : '#fff'} />
  </Pressable>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  remoteWrap: { flex: 1, backgroundColor: '#000' },
  remote: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pip: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  pipVideo: { flex: 1 },
  pipDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 18,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  controls: {
    position: 'absolute',
    bottom: 38,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  ctrlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
