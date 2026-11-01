/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Project Red String: Symmetric P2P Cross-Device Nexus (ARCH-V2.4)
 * Windows Workstation Desktop Node Application & Mobile Companion Sink
 */

import React, { useState, useEffect, useRef } from 'react';
import { WindowsTitlebar } from './components/WindowsTitlebar.tsx';
import { TopologyOverview } from './components/TopologyOverview.tsx';
import { MagicCircleCanvas } from './components/MagicCircleCanvas.tsx';
import { PlatformDropZone } from './components/PlatformDropZone.tsx';
import { BinaryFramingInspector } from './components/BinaryFramingInspector.tsx';
import { FateWatchPanel } from './components/FateWatchPanel.tsx';
import { FateSyncPanel } from './components/FateSyncPanel.tsx';
import { DualNodeSimulator } from './components/DualNodeSimulator.tsx';
import { WindowsBuildExporter } from './components/WindowsBuildExporter.tsx';
import { MobileFrameSink } from './components/MobileFrameSink.tsx';
import { MobilePairingModal } from './components/MobilePairingModal.tsx';
import {
  ActiveTab,
  NodeRole,
  PeerConnectionStatus,
} from './types/redstring.ts';
import { StagedAsset } from './core/elasticMemory.ts';
import { RedStringP2PBridge, P2PTransferProgress } from './core/p2pBridge.ts';
import {
  Shield,
  Layers,
  CircleDot,
  HardDrive,
  Binary,
  Eye,
  MessageSquare,
  ArrowRightLeft,
  Box,
  Wifi,
  Activity,
  CheckCircle2,
  Smartphone,
  ArrowDown,
} from 'lucide-react';

export default function App() {
  // Read URL query params for session & role
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRoleParam = queryParams?.get('role') as NodeRole | null;
  const initialSessionParam = queryParams?.get('session') || null;

  const [sessionId] = useState<string>(() => {
    return initialSessionParam || `rs-${Math.random().toString(36).substring(2, 8)}`;
  });

  const [nodeRole, setNodeRole] = useState<NodeRole>(initialRoleParam === 'mobile' ? 'mobile' : 'desktop');
  const [activeTab, setActiveTab] = useState<ActiveTab>('topology');
  const [platformCapMB, setPlatformCapMB] = useState(2048); // 2.0 GB default
  const [flexMarginPct] = useState(15); // +15% elastic margin
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);

  // Live P2P connection state
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<P2PTransferProgress | null>(null);
  const [receivedAssets, setReceivedAssets] = useState<{ asset: StagedAsset; blob: Blob; url: string }[]>([]);
  const [teleprompterSyncText, setTeleprompterSyncText] = useState(
    'Red String P2P circuit active. Operational transformation deltas streaming across the wire.'
  );

  const bridgeRef = useRef<RedStringP2PBridge | null>(null);

  // Initial staged assets on Desktop
  const [assets, setAssets] = useState<StagedAsset[]>([
    {
      id: 101,
      name: 'RED_CINEMA_8K_CAM01.dng',
      sizeBytes: 450 * 1024 * 1024,
      mimeType: 'image/x-adobe-dng',
      timestamp: Date.now() - 120000,
      lastAccessed: Date.now() - 60000,
      isFlexZone: false,
      markedForEviction: false,
    },
    {
      id: 102,
      name: 'ORCHESTRAL_192K_MASTER.flac',
      sizeBytes: 180 * 1024 * 1024,
      mimeType: 'audio/flac',
      timestamp: Date.now() - 90000,
      lastAccessed: Date.now() - 30000,
      isFlexZone: false,
      markedForEviction: false,
    },
  ]);

  const [selectedAssetForFraming, setSelectedAssetForFraming] = useState<StagedAsset | undefined>(undefined);

  // Initialize P2P bridge
  useEffect(() => {
    const roleForBridge = nodeRole === 'mobile' ? 'mobile' : 'desktop';
    const bridge = new RedStringP2PBridge(sessionId, roleForBridge);
    bridgeRef.current = bridge;

    bridge.setListeners({
      onPeerJoined: () => {
        setIsPeerConnected(true);
      },
      onPeerLeft: () => {
        setIsPeerConnected(false);
      },
      onTransferProgress: (progress) => {
        setCurrentTransfer(progress);
        if (progress.percentage >= 100) {
          setTimeout(() => setCurrentTransfer(null), 1500);
        }
      },
      onFileReceived: (asset, blob) => {
        const url = URL.createObjectURL(blob);
        setReceivedAssets((prev) => [
          { asset, blob, url },
          ...prev,
        ]);
        setCurrentTransfer(null);
      },
      onOTDeltaReceived: (delta) => {
        if (delta.type === 'insert' && delta.text) {
          setTeleprompterSyncText((prev) => prev + delta.text);
        }
      },
    });

    bridge.init();

    return () => {
      bridge.destroy();
    };
  }, [sessionId, nodeRole]);

  // Peer connection status for HUD
  const [connectionStatus, setConnectionStatus] = useState<PeerConnectionStatus>({
    connected: isPeerConnected,
    role: nodeRole,
    peerId: `RS-WIN-${sessionId.slice(0, 6).toUpperCase()}`,
    latencyMs: isPeerConnected ? 2.8 : 3.4,
    dtlsCipher: 'DTLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
    ecdhKeyExchange: 'X25519',
    lanPort: 49152,
    dataChannelState: isPeerConnected ? 'open' : 'connecting',
    bytesTransferred: 630 * 1024 * 1024,
  });

  useEffect(() => {
    setConnectionStatus((prev) => ({
      ...prev,
      connected: isPeerConnected,
      dataChannelState: isPeerConnected ? 'open' : 'connecting',
      latencyMs: isPeerConnected ? 2.6 : 3.4,
    }));
  }, [isPeerConnected]);

  const handleZeroFillSanitize = () => {
    setAssets([]);
    setReceivedAssets([]);
    setConnectionStatus((prev) => ({
      ...prev,
      connected: false,
      dataChannelState: 'closed',
    }));
    bridgeRef.current?.destroy();
  };

  const handleInitiateBinaryFrameTransfer = (asset: StagedAsset) => {
    setSelectedAssetForFraming(asset);
    setActiveTab('binary_framer');
  };

  // Stream asset to Mobile Phone via WebRTC Channel 1
  const streamAssetToMobile = async (asset: StagedAsset) => {
    if (!bridgeRef.current) return;

    // Generate real binary buffer if not present
    let bytes = asset.dataBuffer;
    if (!bytes) {
      // Create synthetic high-res test buffer
      const sizeToGenerate = Math.min(asset.sizeBytes, 1024 * 1024 * 2); // 2MB nominal packet stream
      bytes = new Uint8Array(sizeToGenerate);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (i * 47) % 256;
      }
    }

    await bridgeRef.current.transferFile({
      name: asset.name,
      size: asset.sizeBytes,
      type: asset.mimeType,
      bytes,
    });
  };

  // Stream file uploaded from phone back to Desktop
  const handleUploadFromMobile = async (file: File) => {
    if (!bridgeRef.current) return;
    const arrayBuf = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    await bridgeRef.current.transferFile({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      bytes,
    });
  };

  const handleOpenLocalTab = () => {
    if (typeof window !== 'undefined') {
      window.open(`?session=${sessionId}&role=mobile`, '_blank', 'width=420,height=820');
    }
  };

  // If nodeRole is 'mobile', render Mobile Frame Sink view directly
  if (nodeRole === 'mobile') {
    return (
      <div className="h-screen w-screen bg-[#07090e]">
        <MobileFrameSink
          isPeerConnected={isPeerConnected}
          receivedAssets={receivedAssets}
          currentTransfer={currentTransfer}
          onUploadFromMobile={handleUploadFromMobile}
          teleprompterText={teleprompterSyncText}
          onSwitchToDesktop={() => setNodeRole('desktop')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07080c] text-zinc-200 select-none overflow-hidden font-sans">
      {/* 1. Windows Native Fluent Titlebar */}
      <WindowsTitlebar
        status={connectionStatus}
        nodeRole={nodeRole}
        onRoleChange={(role) => {
          setNodeRole(role);
          if (role === 'dual') {
            setActiveTab('dual_node');
          }
        }}
        onZeroFillSanitize={handleZeroFillSanitize}
        onOpenPairingModal={() => setIsPairingModalOpen(true)}
      />

      {/* Active Transfer Toast Banner if stream in progress */}
      {currentTransfer && (
        <div className="bg-rose-950/90 border-b border-rose-500/60 px-4 py-1.5 flex items-center justify-between font-mono text-xs z-40">
          <div className="flex items-center gap-2 text-white">
            <ArrowDown className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>Streaming {currentTransfer.fileName} to Mobile Phone via Channel 1:</span>
            <span className="text-rose-300 font-bold">{currentTransfer.percentage}%</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-300 text-[11px]">
            <span>Chunk #{currentTransfer.chunkIndex + 1}/{currentTransfer.totalChunks}</span>
            <span className="text-emerald-400 font-semibold">{currentTransfer.speedMBs} MB/s</span>
          </div>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Vertical Navigation Sidebar */}
        <aside className="w-60 bg-[#0a0c13] border-r border-[#1a1e30] flex flex-col justify-between p-3 select-none shrink-0 font-mono text-xs">
          <div className="space-y-1">
            <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-3 py-1.5 mb-1">
              SUBSYSTEMS // ARCH-V2.4
            </div>

            <button
              onClick={() => setActiveTab('topology')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'topology'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <Layers className="w-4 h-4 text-rose-500 shrink-0" />
              <span>1. Topology & Axiom</span>
            </button>

            <button
              onClick={() => setActiveTab('magic_circle')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'magic_circle'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <CircleDot className="w-4 h-4 text-purple-400 shrink-0" />
              <span>4. The Magic Circle</span>
            </button>

            <button
              onClick={() => setActiveTab('platform')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'platform'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>6. The Platform Drop</span>
            </button>

            <button
              onClick={() => setActiveTab('binary_framer')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'binary_framer'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <Binary className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>7. Binary Framer (Ch1)</span>
            </button>

            <button
              onClick={() => setActiveTab('fate_watch')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'fate_watch'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <Eye className="w-4 h-4 text-rose-400 shrink-0" />
              <span>8. Fate Watch Prompter</span>
            </button>

            <button
              onClick={() => setActiveTab('fate_sync')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'fate_sync'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
              <span>8. Fate Sync Mesh</span>
            </button>

            <div className="pt-3 pb-1 border-t border-[#1a1e30] my-2">
              <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase px-3 py-1">
                SIMULATION & BUILD
              </div>
            </div>

            <button
              onClick={() => setActiveTab('dual_node')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'dual_node'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Fig 1.0 Dual Node Bus</span>
            </button>

            <button
              onClick={() => setActiveTab('windows_build')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeTab === 'windows_build'
                  ? 'bg-rose-950/70 border border-rose-500/60 text-white font-semibold shadow-[0_0_12px_rgba(225,29,72,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121524]'
              }`}
            >
              <Box className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Windows Build Suite</span>
            </button>
          </div>

          {/* Bottom Sidebar Mobile Link Pill */}
          <div className="p-3 bg-[#11131e] rounded-xl border border-[#1e2338] text-[11px] space-y-2">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Smartphone className="w-3.5 h-3.5 text-rose-500" />
                MOBILE PHONE
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isPeerConnected
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isPeerConnected ? 'PAIRED' : 'NOT PAIRED'}
              </span>
            </div>

            <button
              onClick={() => setIsPairingModalOpen(true)}
              className="w-full py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-900/40 text-center font-semibold transition-colors"
            >
              Scan Phone QR Code
            </button>

            <div className="text-zinc-500 text-[10px] truncate">
              Session: {sessionId}
            </div>
          </div>
        </aside>

        {/* Center Main Stage */}
        <main className="flex-1 bg-[#090a0f] overflow-hidden flex flex-col">
          {activeTab === 'topology' && (
            <TopologyOverview
              onNavigateTab={(tab) => setActiveTab(tab)}
              platformCapMB={platformCapMB}
            />
          )}

          {activeTab === 'magic_circle' && (
            <MagicCircleCanvas
              platformCapMB={platformCapMB}
              onCapChange={(mb) => setPlatformCapMB(mb)}
              flexMarginPct={flexMarginPct}
              onOpenPairingModal={() => setIsPairingModalOpen(true)}
            />
          )}

          {activeTab === 'platform' && (
            <PlatformDropZone
              softCapMB={platformCapMB}
              flexMarginPct={flexMarginPct}
              assets={assets}
              onAssetsChange={setAssets}
              onInitiateBinaryFrameTransfer={handleInitiateBinaryFrameTransfer}
              onStreamToMobile={streamAssetToMobile}
              isPeerConnected={isPeerConnected}
            />
          )}

          {activeTab === 'binary_framer' && (
            <BinaryFramingInspector selectedAsset={selectedAssetForFraming} />
          )}

          {activeTab === 'fate_watch' && <FateWatchPanel />}

          {activeTab === 'fate_sync' && <FateSyncPanel />}

          {activeTab === 'dual_node' && <DualNodeSimulator />}

          {activeTab === 'windows_build' && <WindowsBuildExporter />}
        </main>
      </div>

      {/* Mobile Pairing QR Code Modal */}
      <MobilePairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        sessionId={sessionId}
        isPeerConnected={isPeerConnected}
        onOpenLocalTab={handleOpenLocalTab}
      />
    </div>
  );
}
