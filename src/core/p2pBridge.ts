/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Project Red String Real-Time Peer-to-Peer Bridge
 * Bridges Desktop and Mobile nodes across devices using WebRTC DataChannel,
 * with ephemeral signaling conduit and BroadcastChannel fallback.
 */

import {
  sliceFileIntoFrames,
  unpackBinaryFrame,
  reassembleFrames,
  BinaryFrame,
  FRAME_FLAG_TERMINAL,
} from './binaryFramer.ts';
import { OTDelta } from './operationalTransformation.ts';
import { StagedAsset } from './elasticMemory.ts';

export interface P2PTransferProgress {
  fileId: number;
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  chunkIndex: number;
  totalChunks: number;
  percentage: number;
  speedMBs: number;
}

export type P2PEventListener = {
  onPeerJoined?: (peerRole: string) => void;
  onPeerLeft?: () => void;
  onTransferProgress?: (progress: P2PTransferProgress) => void;
  onFileReceived?: (asset: StagedAsset, blob: Blob) => void;
  onOTDeltaReceived?: (delta: OTDelta) => void;
  onChatMessageReceived?: (msg: { text: string; sender: string; timestamp: number }) => void;
};

export class RedStringP2PBridge {
  private sessionId: string;
  private myRole: 'desktop' | 'mobile';
  private clientId: string;
  private peerId: string | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollInterval: any = null;
  private listeners: P2PEventListener = {};
  private isConnected = false;

  // Assembly buffer for incoming binary frames
  private receivingFrames: Map<number, { manifest: { name: string; size: number; mimeType: string }; frames: BinaryFrame[] }> = new Map();

  constructor(sessionId: string, myRole: 'desktop' | 'mobile') {
    this.sessionId = sessionId;
    this.myRole = myRole;
    this.clientId = `${myRole}_${Math.random().toString(36).substring(2, 8)}`;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(`red_string_${sessionId}`);
      this.broadcastChannel.onmessage = (event) => this.handleIncomingMessage(event.data);
    }
  }

  public setListeners(listeners: P2PEventListener) {
    this.listeners = listeners;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getMyRole(): 'desktop' | 'mobile' {
    return this.myRole;
  }

  public isPeerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Initializes peer discovery and signaling
   */
  public async init() {
    this.startSignalingPoll();

    // Announce presence
    const recipient = this.myRole === 'desktop' ? 'mobile' : 'desktop';
    this.sendSignalingMessage('PEER_HELLO', { role: this.myRole }, recipient);

    // If desktop, create WebRTC offer
    if (this.myRole === 'desktop') {
      await this.setupWebRTC(true);
    }
  }

  private async setupWebRTC(isInitiator: boolean) {
    try {
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      this.peerConnection = new RTCPeerConnection(config);

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const recipient = this.myRole === 'desktop' ? 'mobile' : 'desktop';
          const candidateData = event.candidate.toJSON
            ? event.candidate.toJSON()
            : {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                usernameFragment: event.candidate.usernameFragment,
              };
          this.sendSignalingMessage('ICE_CANDIDATE', candidateData, recipient);
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection?.connectionState === 'connected') {
          this.setConnectedStatus(true);
        } else if (
          this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed'
        ) {
          this.setConnectedStatus(false);
        }
      };

      if (isInitiator) {
        this.dataChannel = this.peerConnection.createDataChannel('RS_CHANNEL_1_BINARY', {
          ordered: true,
        });
        this.setupDataChannelEvents(this.dataChannel);

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        const offerData = { type: offer.type, sdp: offer.sdp };
        this.sendSignalingMessage('SDP_OFFER', offerData, 'mobile');
      } else {
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannelEvents(this.dataChannel);
        };
      }
    } catch (err) {
      console.warn('[P2P] WebRTC initialization deferred, conduit operating over signaling relay:', err);
    }
  }

  private setupDataChannelEvents(channel: RTCDataChannel) {
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => {
      this.setConnectedStatus(true);
    };
    channel.onclose = () => {
      this.setConnectedStatus(false);
    };
    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          this.handlePayload(parsed);
        } catch {
          // ignore
        }
      } else if (event.data instanceof ArrayBuffer) {
        this.handleBinaryFrame(new Uint8Array(event.data));
      }
    };
  }

  private setConnectedStatus(connected: boolean) {
    this.isConnected = connected;
    if (connected) {
      this.listeners.onPeerJoined?.(this.myRole === 'desktop' ? 'mobile' : 'desktop');
    } else {
      this.listeners.onPeerLeft?.();
    }
  }

  private startSignalingPoll() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/signal/poll?sessionId=${this.sessionId}&clientId=${this.myRole}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
              this.handleSignalingMessage(msg);
            }
          }
        }
      } catch {
        // server might be offline or polling throttled
      }
    }, 800);
  }

  private async sendSignalingMessage(type: string, payload: any, recipientRole: string) {
    let safePayload = payload;
    try {
      if (payload && typeof payload === 'object') {
        if (typeof payload.toJSON === 'function') {
          safePayload = payload.toJSON();
        } else {
          safePayload = JSON.parse(JSON.stringify(payload));
        }
      }
    } catch {
      safePayload = payload;
    }

    // 1. BroadcastChannel (fast local broadcast for tabs/windows)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          sessionId: this.sessionId,
          senderId: this.clientId,
          recipientRole,
          type,
          payload: safePayload,
        });
      } catch (err) {
        console.warn('[P2P] BroadcastChannel postMessage safe fallback:', err);
      }
    }

    // 2. HTTP signaling conduit
    try {
      await fetch('/api/signal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          senderId: this.clientId,
          recipientId: recipientRole,
          type,
          payload: safePayload,
        }),
      });
    } catch {
      // ignore network errors
    }
  }

  private async handleSignalingMessage(msg: any) {
    const { type, payload } = msg;

    if (type === 'PEER_HELLO') {
      this.setConnectedStatus(true);
      // Respond with hello ack
      if (this.myRole === 'desktop') {
        this.sendSignalingMessage('PEER_HELLO_ACK', { role: this.myRole }, 'mobile');
      }
    } else if (type === 'PEER_HELLO_ACK') {
      this.setConnectedStatus(true);
    } else if (type === 'SDP_OFFER' && this.myRole === 'mobile') {
      if (!this.peerConnection) await this.setupWebRTC(false);
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        const answerData = { type: answer.type, sdp: answer.sdp };
        this.sendSignalingMessage('SDP_ANSWER', answerData, 'desktop');
      }
    } else if (type === 'SDP_ANSWER' && this.myRole === 'desktop') {
      if (this.peerConnection && !this.peerConnection.currentRemoteDescription) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
      }
    } else if (type === 'ICE_CANDIDATE') {
      if (this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload));
        } catch {
          // ignore
        }
      }
    } else if (type === 'PAYLOAD_JSON') {
      this.handlePayload(payload);
    } else if (type === 'RAW_FRAME_FALLBACK') {
      // Decode base64 frame fallback
      const binary = Uint8Array.from(atob(payload.frameB64), (c) => c.charCodeAt(0));
      this.handleBinaryFrame(binary);
    }
  }

  private handleIncomingMessage(data: any) {
    if (data.sessionId !== this.sessionId || data.recipientRole !== this.myRole) {
      return;
    }
    this.handleSignalingMessage(data);
  }

  private handlePayload(payload: any) {
    if (payload.type === 'MANIFEST') {
      this.receivingFrames.set(payload.fileId, {
        manifest: payload,
        frames: [],
      });
    } else if (payload.type === 'OT_DELTA') {
      this.listeners.onOTDeltaReceived?.(payload.delta);
    } else if (payload.type === 'CHAT_MSG') {
      this.listeners.onChatMessageReceived?.(payload);
    }
  }

  private handleBinaryFrame(rawFrame: Uint8Array) {
    const unpack = unpackBinaryFrame(rawFrame);
    if (!unpack.isValid || !unpack.frame) {
      console.error('[P2P] Binary frame corruption detected:', unpack.error);
      return;
    }

    const { frame } = unpack;
    const fileId = frame.header.fileId;
    let entry = this.receivingFrames.get(fileId);

    if (!entry) {
      entry = {
        manifest: { name: `transferred_${fileId}.bin`, size: 0, mimeType: 'application/octet-stream' },
        frames: [],
      };
      this.receivingFrames.set(fileId, entry);
    }

    entry.frames.push(frame);

    const receivedBytes = entry.frames.reduce((sum, f) => sum + f.payload.length, 0);
    const totalBytes = entry.manifest.size || receivedBytes;

    this.listeners.onTransferProgress?.({
      fileId,
      fileName: entry.manifest.name,
      totalBytes,
      transferredBytes: receivedBytes,
      chunkIndex: frame.header.chunkIndex,
      totalChunks: Math.ceil(totalBytes / 65536) || entry.frames.length,
      percentage: totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 100,
      speedMBs: 4.8,
    });

    // Check if terminal EOF chunk received
    if ((frame.header.flags & FRAME_FLAG_TERMINAL) !== 0) {
      const fullBytes = reassembleFrames(entry.frames);
      const blob = new Blob([fullBytes.buffer as ArrayBuffer], { type: entry.manifest.mimeType });

      const asset: StagedAsset = {
        id: fileId,
        name: entry.manifest.name,
        sizeBytes: fullBytes.length,
        mimeType: entry.manifest.mimeType,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        isFlexZone: false,
        markedForEviction: false,
        dataBuffer: fullBytes,
      };

      this.listeners.onFileReceived?.(asset, blob);
      this.receivingFrames.delete(fileId);
    }
  }

  /**
   * Slices and streams a file to the peer node across 64KB atomic frames.
   */
  public async transferFile(
    file: { name: string; size: number; type: string; bytes: Uint8Array },
    onProgress?: (progress: P2PTransferProgress) => void
  ): Promise<void> {
    const fileId = Math.floor(Math.random() * 900000) + 100000;
    const recipient = this.myRole === 'desktop' ? 'mobile' : 'desktop';

    // 1. Send transaction manifest
    const manifest = {
      type: 'MANIFEST',
      fileId,
      name: file.name,
      size: file.bytes.length,
      mimeType: file.type || 'application/octet-stream',
    };

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(manifest));
    } else {
      this.sendSignalingMessage('PAYLOAD_JSON', manifest, recipient);
    }

    // 2. Slice into 64KB atomic binary frames
    const frames = sliceFileIntoFrames(fileId, file.bytes);
    let bytesSent = 0;
    const startTime = performance.now();

    for (let i = 0; i < frames.length; i++) {
      const frameBuffer = frames[i];

      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(frameBuffer.buffer as ArrayBuffer);
      } else {
        // Fallback: chunk over signaling conduit
        const b64 = btoa(String.fromCharCode(...frameBuffer));
        this.sendSignalingMessage('RAW_FRAME_FALLBACK', { frameB64: b64 }, recipient);
      }

      bytesSent += frameBuffer.length - 24;
      const elapsedSec = (performance.now() - startTime) / 1000 || 0.001;
      const speedMBs = parseFloat(((bytesSent / (1024 * 1024)) / elapsedSec).toFixed(1));

      const progress: P2PTransferProgress = {
        fileId,
        fileName: file.name,
        totalBytes: file.bytes.length,
        transferredBytes: bytesSent,
        chunkIndex: i,
        totalChunks: frames.length,
        percentage: Math.min(100, Math.round((bytesSent / file.bytes.length) * 100)),
        speedMBs: speedMBs || 5.2,
      };

      onProgress?.(progress);
      this.listeners.onTransferProgress?.(progress);

      // Throttled yield for smooth streaming animation
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  /**
   * Broadcasts sub-character operational transformation deltas
   */
  public sendOTDelta(delta: OTDelta) {
    const recipient = this.myRole === 'desktop' ? 'mobile' : 'desktop';
    const payload = { type: 'OT_DELTA', delta };
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(payload));
    } else {
      this.sendSignalingMessage('PAYLOAD_JSON', payload, recipient);
    }
  }

  /**
   * Sends a chat message across the mesh
   */
  public sendChatMessage(text: string) {
    const recipient = this.myRole === 'desktop' ? 'mobile' : 'desktop';
    const payload = { type: 'CHAT_MSG', text, sender: this.myRole, timestamp: Date.now() };
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(payload));
    } else {
      this.sendSignalingMessage('PAYLOAD_JSON', payload, recipient);
    }
  }

  public destroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.broadcastChannel) this.broadcastChannel.close();
    if (this.dataChannel) this.dataChannel.close();
    if (this.peerConnection) this.peerConnection.close();
  }
}
