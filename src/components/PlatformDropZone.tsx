/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 6: The Platform: Volatile Memory Limits & Elasticity
 * Deterministic staging drop zone with soft cap, 100-115% elastic margin, and LRU eviction tracking.
 */

import React, { useState } from 'react';
import {
  computePlatformMemory,
  canAcceptTransfer,
  StagedAsset,
  PlatformMemoryState,
  zeroFillBuffer,
} from '../core/elasticMemory.ts';
import {
  UploadCloud,
  FileCode,
  FileVideo,
  FileAudio,
  FileArchive,
  AlertTriangle,
  Trash2,
  Download,
  Flame,
  CheckCircle,
  Database,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';

interface PlatformDropZoneProps {
  softCapMB: number;
  flexMarginPct: number;
  assets: StagedAsset[];
  onAssetsChange: (assets: StagedAsset[]) => void;
  onInitiateBinaryFrameTransfer?: (asset: StagedAsset) => void;
  onStreamToMobile?: (asset: StagedAsset) => void;
  isPeerConnected?: boolean;
}

export const PlatformDropZone: React.FC<PlatformDropZoneProps> = ({
  softCapMB,
  flexMarginPct,
  assets,
  onAssetsChange,
  onInitiateBinaryFrameTransfer,
  onStreamToMobile,
  isPeerConnected = false,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWiping, setIsWiping] = useState(false);

  const memory: PlatformMemoryState = computePlatformMemory(softCapMB, flexMarginPct, assets);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Preset file drop additions
  const addPresetFile = (name: string, sizeMB: number, mimeType: string) => {
    setErrorMsg(null);
    const sizeBytes = sizeMB * 1024 * 1024;
    const check = canAcceptTransfer(
      memory.usedBytes,
      sizeBytes,
      memory.softCapBytes,
      memory.elasticCeilingBytes
    );

    if (!check.accepted) {
      setErrorMsg(check.reason || 'Transfer rejected: exceeded elastic buffer.');
      return;
    }

    const newAsset: StagedAsset = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      sizeBytes,
      mimeType,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      isFlexZone: check.entersElasticMargin,
      markedForEviction: check.entersElasticMargin,
    };

    onAssetsChange([...assets, newAsset]);
  };

  const removeAsset = (id: number) => {
    onAssetsChange(assets.filter((a) => a.id !== id));
  };

  const clearAllZeroFill = () => {
    setIsWiping(true);
    setTimeout(() => {
      onAssetsChange([]);
      setIsWiping(false);
    }, 600);
  };

  const handleManualDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const check = canAcceptTransfer(
        memory.usedBytes,
        file.size,
        memory.softCapBytes,
        memory.elasticCeilingBytes
      );

      if (!check.accepted) {
        setErrorMsg(check.reason || 'File exceeds capacity');
        return;
      }

      const newAsset: StagedAsset = {
        id: Date.now(),
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        isFlexZone: check.entersElasticMargin,
        markedForEviction: check.entersElasticMargin,
      };

      onAssetsChange([...assets, newAsset]);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-6 overflow-y-auto">
      {/* Top Banner: Volatile Elastic Memory Gauge */}
      <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              SECTION 6 THE PLATFORM // VOLATILE MEMORY LIMITS & ELASTICITY
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {memory.zone === 'nominal' && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ZONE 1: NOMINAL RANGE (≤ 100%)
              </span>
            )}
            {memory.zone === 'elastic_warning' && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-amber-950/70 border border-amber-600/70 text-amber-300 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ZONE 2: ELASTIC MARGIN (100% - 115%)
              </span>
            )}
            {memory.zone === 'hard_lockout' && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-rose-950/80 border border-rose-600 text-rose-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                ZONE 3: HARD LOCKOUT (&gt; 115%)
              </span>
            )}
          </div>
        </div>

        {/* Multi-Segment Capacity Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">
              Allocated Staging:{' '}
              <span className="text-white font-bold">{formatBytes(memory.usedBytes)}</span> /{' '}
              <span className="text-rose-400 font-semibold">{formatBytes(memory.softCapBytes)}</span> Soft Cap
            </span>
            <span className="text-zinc-400">
              Elastic Ceiling (+{flexMarginPct}%):{' '}
              <span className="text-amber-400 font-bold">{formatBytes(memory.elasticCeilingBytes)}</span>
            </span>
          </div>

          <div className="relative w-full h-4 bg-[#141724] rounded-full overflow-hidden border border-[#22273d]">
            {/* Soft Cap Indicator Notch at 100 / 115 = ~87% */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10 shadow-[0_0_8px_#f43f5e]"
              style={{ left: `${(100 / (100 + flexMarginPct)) * 100}%` }}
              title="100% Soft Cap Boundary"
            />

            {/* Nominal Fill Portion */}
            <div
              className={`h-full transition-all duration-300 ${
                memory.zone === 'nominal'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  : 'bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600'
              }`}
              style={{
                width: `${Math.min(100, (memory.usedBytes / memory.elasticCeilingBytes) * 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-0.5">
            <span>0 MB</span>
            <span className="text-rose-400 font-medium">Soft Cap Threshold [Nominal Space]</span>
            <span className="text-amber-400 font-medium">+15% Elastic Buffer [LRU Eviction Margin]</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/70 border border-rose-600/70 rounded-lg text-xs font-mono text-rose-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Drop Staging & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left: Staged Assets Table */}
        <div className="lg:col-span-8 flex flex-col bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>VOLATILE MEMORY DROP STAGING BUFFER</span>
              <span className="text-zinc-500 font-normal">({assets.length} items)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAllZeroFill}
                disabled={assets.length === 0 || isWiping}
                className="px-2.5 py-1 rounded bg-[#181a28] hover:bg-rose-950/60 hover:text-rose-300 text-zinc-400 border border-[#272d47] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
                title="Zero-fill sanitize all memory buffers"
              >
                <RefreshCw className={`w-3 h-3 ${isWiping ? 'animate-spin' : ''}`} />
                <span>Zero-Fill Wipe</span>
              </button>
            </div>
          </div>

          {/* Asset List or Empty State */}
          {assets.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleManualDrop}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#232942] rounded-lg p-8 text-center transition-colors hover:border-rose-500/50"
            >
              <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 font-mono mb-1">
                Drag & Drop Media, Audio Streams, or Archives
              </h3>
              <p className="text-xs text-zinc-500 font-mono max-w-sm mb-4">
                Transfers stream directly into uncompressed memory structures without intermediary cloud relays.
              </p>
              <div className="text-[11px] font-mono text-zinc-400">
                Or trigger simulated high-bitrate payloads from the right panel.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1c2033] text-zinc-500 text-[11px]">
                    <th className="pb-2">Asset Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Allocation Zone</th>
                    <th className="pb-2">LRU Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171a2a]">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#131623]/60 transition-colors">
                      <td className="py-2.5 font-medium text-zinc-200 flex items-center gap-2">
                        {asset.mimeType.includes('image') && <FileCode className="w-3.5 h-3.5 text-rose-400" />}
                        {asset.mimeType.includes('audio') && <FileAudio className="w-3.5 h-3.5 text-emerald-400" />}
                        {asset.mimeType.includes('video') && <FileVideo className="w-3.5 h-3.5 text-cyan-400" />}
                        {asset.mimeType.includes('zip') || asset.mimeType.includes('tar') ? (
                          <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                        ) : null}
                        <span className="truncate max-w-[200px]" title={asset.name}>
                          {asset.name}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-400 text-[11px]">{asset.mimeType}</td>
                      <td className="py-2.5 font-semibold text-white">{formatBytes(asset.sizeBytes)}</td>
                      <td className="py-2.5">
                        {asset.isFlexZone ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/70 border border-amber-600/70 text-amber-300">
                            Elastic Margin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                            Nominal Buffer
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-[11px]">
                        {asset.markedForEviction ? (
                          <span className="text-amber-400 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Queued LRU
                          </span>
                        ) : (
                          <span className="text-zinc-500">Persistent (Session)</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right space-x-2">
                        {onStreamToMobile && (
                          <button
                            onClick={() => onStreamToMobile(asset)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-all shadow-[0_0_8px_rgba(225,29,72,0.4)]"
                            title="Beam directly to linked mobile phone via WebRTC Channel 1"
                          >
                            Beam to Phone
                          </button>
                        )}
                        {onInitiateBinaryFrameTransfer && (
                          <button
                            onClick={() => onInitiateBinaryFrameTransfer(asset)}
                            className="px-2 py-1 rounded bg-[#181d2f] hover:bg-[#222a45] text-zinc-300 border border-[#283254] text-[11px] transition-colors"
                            title="Inspect 24-byte hardware header in Channel 1"
                          >
                            Inspect Header
                          </button>
                        )}
                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Evict Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Simulated High-Bitrate Payload Generators */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold text-zinc-200 mb-3 flex items-center gap-2">
              <UploadCloud className="w-3.5 h-3.5 text-rose-500" />
              <span>TEST VOLATILE DROP PAYLOADS</span>
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mb-4 leading-relaxed">
              Stage real binary payloads into memory to inspect elasticity bounds and LRU eviction queues.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => addPresetFile('RED_DNG_8K_CAM01.dng', 450, 'image/x-adobe-dng')}
                className="w-full p-2.5 rounded bg-[#141724] hover:bg-[#1d2238] border border-[#232840] text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-medium text-white">RED 8K Camera Raw DNG</div>
                  <div className="text-[10px] font-mono text-zinc-500">Uncompressed cinema sensor frame</div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">450 MB</span>
              </button>

              <button
                onClick={() => addPresetFile('MASTER_ORCHESTRAL_192K.flac', 180, 'audio/flac')}
                className="w-full p-2.5 rounded bg-[#141724] hover:bg-[#1d2238] border border-[#232840] text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-medium text-white">192kHz/24bit FLAC Master</div>
                  <div className="text-[10px] font-mono text-zinc-500">Direct memory audio stream</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">180 MB</span>
              </button>

              <button
                onClick={() => addPresetFile('KERNEL_ZERO_COPY_DUMP.bin', 1200, 'application/octet-stream')}
                className="w-full p-2.5 rounded bg-[#141724] hover:bg-[#1d2238] border border-[#232840] text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-medium text-white">Kernel Direct-Memory Archive</div>
                  <div className="text-[10px] font-mono text-zinc-500">Pushes into Elastic Flex Zone</div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">1.2 GB</span>
              </button>

              <button
                onClick={() => addPresetFile('EXTREME_OVERFLOW_CHUNK.dat', 3500, 'application/octet-stream')}
                className="w-full p-2.5 rounded bg-[#141724] hover:bg-[#1d2238] border border-[#232840] text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-medium text-white">Massive Multi-Gig Archive</div>
                  <div className="text-[10px] font-mono text-zinc-500">Triggers hard lockout rejection</div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-500">3.5 GB</span>
              </button>
            </div>
          </div>

          {/* Section 6 Specification Insight */}
          <div className="bg-[#0a0c13] border border-[#1b1f30] rounded-xl p-4 font-mono text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Section 6 Specification Note</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Unlike cloud drives, Red String creates a sovereign volatile circuit. Assets exist only in RAM and scratch
              staging. Assets in the 100%–115% elastic margin are tagged for LRU eviction upon link teardown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
