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
import InCallManager from 'react-native-incall-manager';
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
  // ICE candidates that arrive before we've called setRemoteDescription
  // can't be applied yet — pc.addIceCandidate will throw / silently drop
  // them. Queue and flush after the remote SDP lands.
  const pendingIceRef = useRef<any[]>([]);
  const remoteDescSetRef = useRef(false);

  const teardown = useCallback(() => {
    try {
      // If we never connected to a peer, we're the caller bailing out —
      // tell the server to dismiss the incoming-call overlay on the
      // other side. If a peer already joined, `leave` is enough.
      if (!peerSocketIdRef.current) {
        socketRef.current?.emit('cancel-call', { visitId });
      }
      socketRef.current?.emit('leave', { visitId });
    } catch {}
    try { socketRef.current?.disconnect(); } catch {}
    socketRef.current = null;

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    // Release VoIP audio routing + wakelock the moment the call ends.
    try { InCallManager.stop(); } catch {}

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
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      // @ts-ignore — modern WebRTC on RN supports Unified Plan; ensures
      // 'track' events fire reliably across both peers.
      sdpSemantics: 'unified-plan',
    });

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
      console.log('[webrtc] connectionState →', cs);
      if (cs === 'connected') setState('connected');
      if (cs === 'failed' || cs === 'closed') setState(prev => (prev === 'ended' ? prev : 'failed'));
    });

    // ICE state is more granular than connectionState and surfaces NAT
    // traversal failures (e.g. symmetric NAT requiring TURN) earlier.
    // @ts-ignore
    pc.addEventListener('iceconnectionstatechange', () => {
      const ic = (pc as any).iceConnectionState;
      console.log('[webrtc] iceConnectionState →', ic);
      if (ic === 'connected' || ic === 'completed') setState('connected');
      if (ic === 'failed' || ic === 'disconnected') {
        setState(prev => (prev === 'ended' ? prev : 'failed'));
      }
    });

    // @ts-ignore
    pc.addEventListener('signalingstatechange', () => {
      console.log('[webrtc] signalingState →', (pc as any).signalingState);
    });

    return pc;
  }, []);

  // Apply queued ICE candidates — called once we've successfully set the
  // remote description (post-offer for the answerer, post-answer for the
  // offerer).
  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queue = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[webrtc] queued addIceCandidate failed', e);
      }
    }
  }, []);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    const peerId = peerSocketIdRef.current;
    if (!pc || !peerId) return;
    try {
      console.log('[webrtc] createOffer →', peerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
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
          // We must be the answerer. setRemoteDescription(offer) → create
          // & set local answer → send back. Then drain any ICE candidates
          // the offerer fired before we were ready to consume them.
          console.log('[webrtc] ← offer, replying with answer');
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
          remoteDescSetRef.current = true;
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit('signal', {
            to: from,
            data: { type: 'answer', sdp: answer.sdp },
          });
          await flushPendingIce();
        } else if (data.type === 'answer') {
          console.log('[webrtc] ← answer');
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
          remoteDescSetRef.current = true;
          await flushPendingIce();
        } else if (data.type === 'ice-candidate' && data.candidate) {
          if (remoteDescSetRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            // Buffer until SDP exchange completes; many candidates arrive
            // before the answer in a typical handshake.
            pendingIceRef.current.push(data.candidate);
          }
        }
      } catch (e) {
        console.warn('[webrtc] handleSignal failed', e);
      }
    },
    [flushPendingIce],
  );

  // Single bootstrap: permissions → media → socket → peer connection.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Switch the device into VoIP mode: routes audio to the speaker
      // for video calls, takes a wakelock so the screen stays on, and
      // ensures any ringtone playing from the overlay stops cleanly.
      try { InCallManager.stopRingtone(); } catch {}
      try { InCallManager.start({ media: 'video' }); } catch {}
      try { InCallManager.setKeepScreenOn(true); } catch {}
      try { InCallManager.setSpeakerphoneOn(true); } catch {}

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
        console.log('[socket] connected, joining visit room…', visitId);
        socket.emit('join', { visitId }, (ack: any) => {
          if (cancelled) return;
          if (!ack?.ok) {
            Alert.alert('Cannot join', ack?.error ?? 'Unable to join the call.');
            setState('failed');
            return;
          }
          if (Array.isArray(ack.peers) && ack.peers.length > 0) {
            // We are the SECOND joiner. The other peer is already there,
            // so we drive the SDP exchange by sending the offer. The other
            // side will set our offer as remoteDescription and reply with
            // an answer.
            console.log('[socket] joined, peer already present →', ack.peers[0]);
            peerSocketIdRef.current = ack.peers[0].socketId;
            isInitiatorRef.current = true;
            setState('connecting');
            createOffer();
          } else {
            // We're the FIRST in the room. Wait for the other side to
            // arrive — they will create the offer; we only respond.
            console.log('[socket] joined first, waiting for peer…');
            setState('waiting-for-peer');
          }
        });
      });

      socket.on('peer-joined', ({ socketId }: { socketId: string }) => {
        // The newcomer is the initiator; we (the first joiner) just
        // record their socket id so our ICE candidates can be routed.
        // Creating an offer here would cause GLARE — both sides ending
        // up with local=offer and a corrupted SDP state machine. The
        // call would forever read 'connecting' but never connect.
        console.log('[socket] peer-joined →', socketId);
        peerSocketIdRef.current = socketId;
        setState('connecting');
      });

      socket.on('signal', handleSignal);

      socket.on('peer-left', () => {
        console.log('[socket] peer-left');
        peerSocketIdRef.current = null;
        // Reset SDP-exchange flags so a re-joining peer can renegotiate
        // cleanly: we'll wait for their fresh offer rather than being
        // confused by stale remote-description state.
        remoteDescSetRef.current = false;
        pendingIceRef.current = [];
        setRemoteStream(null);
        setState('waiting-for-peer');
      });

      socket.on('error', payload => {
        Alert.alert('Call error', payload?.message ?? 'Connection error');
        setState('failed');
      });

      socket.on('call-declined', () => {
        Alert.alert('Call declined', 'The other side declined the call.');
        setState('ended');
        teardownRef.current();
        navigation.goBack();
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
