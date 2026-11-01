/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 7: Red String Binary Framing Engine (Channel 1)
 * Packed 24-byte hardware-aligned header inspector, 64KB atomic chunk stream, and CRC-64 verification.
 */

import React, { useState, useEffect } from 'react';
import {
  packBinaryFrame,
  unpackBinaryFrame,
  calculateCRC64,
  sliceFileIntoFrames,
  RS_MAGIC_PREFIX,
  RS_FRAME_VERSION,
  RS_HEADER_SIZE_BYTES,
  RS_CHUNK_SIZE_BYTES,
  FRAME_FLAG_TERMINAL,
  FRAME_FLAG_FLEX_ZONE,
  FRAME_FLAG_COMPRESSED,
  BinaryFrame,
} from '../core/binaryFramer.ts';
import { StagedAsset } from '../core/elasticMemory.ts';
import {
  Cpu,
  Layers,
  Zap,
  CheckCircle,
  AlertOctagon,
  Play,
  RotateCcw,
  Activity,
  Binary,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface BinaryFramingInspectorProps {
  selectedAsset?: StagedAsset;
}

export const BinaryFramingInspector: React.FC<BinaryFramingInspectorProps> = ({
  selectedAsset,
}) => {
  // Generate sample asset if none selected
  const [activeAsset, setActiveAsset] = useState<StagedAsset>(
    selectedAsset || {
      id: 4201,
      name: 'RED_CINEMA_FRAME_RAW.dng',
      sizeBytes: 256 * 1024, // 256 KB = 4 chunks
      mimeType: 'image/x-adobe-dng',
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      isFlexZone: false,
      markedForEviction: false,
    }
  );

  useEffect(() => {
    if (selectedAsset) {
      setActiveAsset(selectedAsset);
    }
  }, [selectedAsset]);

  // Frame generator state
  const [frames, setFrames] = useState<Uint8Array[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [transferSpeedMBs, setTransferSpeedMBs] = useState(1280); // 1.28 GB/s zero-copy simulation
  const [corruptBitActive, setCorruptBitActive] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<ReturnType<typeof unpackBinaryFrame> | null>(null);

  // Generate frames whenever asset changes
  useEffect(() => {
    const syntheticBytes = new Uint8Array(Math.min(activeAsset.sizeBytes, 512 * 1024)); // cap display buffer at 512KB for UI
    for (let i = 0; i < syntheticBytes.length; i++) {
      syntheticBytes[i] = (i * 37) % 256;
    }
    const generated = sliceFileIntoFrames(activeAsset.id, syntheticBytes, activeAsset.isFlexZone);
    setFrames(generated);
    setSelectedFrameIndex(0);
    setStreamProgress(0);
    setCorruptBitActive(false);
  }, [activeAsset]);

  // Update inspection of currently selected frame
  useEffect(() => {
    if (frames.length > 0 && selectedFrameIndex < frames.length) {
      let frameToInspect = frames[selectedFrameIndex];
      if (corruptBitActive) {
        frameToInspect = new Uint8Array(frameToInspect);
        // Corrupt byte in payload
        frameToInspect[RS_HEADER_SIZE_BYTES + 4] ^= 0xaa;
      }
      setInspectionResult(unpackBinaryFrame(frameToInspect));
    }
  }, [frames, selectedFrameIndex, corruptBitActive]);

  // Simulated transfer stream
  const startStreamSimulation = () => {
    setStreaming(true);
    setStreamProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setStreamProgress(current);
      if (current >= frames.length) {
        clearInterval(interval);
        setStreaming(false);
      }
    }, 180);
  };

  const currentFrame = frames[selectedFrameIndex];
  const view = currentFrame ? new DataView(currentFrame.buffer, currentFrame.byteOffset, currentFrame.byteLength) : null;

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-6 overflow-y-auto">
      {/* Top Banner: Channel 1 Architecture Overview */}
      <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              SECTION 7 RED STRING BINARY FRAMING ENGINE // CHANNEL 1
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171a2b] border border-[#262c44] text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              WebRTC DataChannel 1 (Ordered Binary)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
              64 KB Atomic Frames
            </span>
          </div>
        </div>

        <p className="text-xs font-mono text-zinc-400 leading-relaxed max-w-4xl">
          Bypasses JSON serialization entirely. All transfers stream across direct WebRTC DataChannels in atomic 64 KB
          binary frames with a packed 24-byte hardware-aligned header. On Windows, the Tauri Rust core utilizes zero-copy
          kernel ring buffers for direct-to-disk write DMA.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left: 24-Byte Hardware-Aligned Header Hex Breakdown */}
        <div className="lg:col-span-7 flex flex-col bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>PACKED 24-BYTE HARDWARE-ALIGNED HEADER DECODER</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Frame #{selectedFrameIndex + 1} of {frames.length}
            </span>
          </div>

          {/* Byte-by-byte visual breakdown table */}
          {view ? (
            <div className="space-y-3 font-mono text-xs">
              {/* Field 1: Magic Prefix */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x00 - 0x01</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">Magic Prefix (uint16_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[0x5253 'RS' Framing Sync]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/60 text-emerald-400 font-bold border border-emerald-900/40">
                  0x{view.getUint16(0x00, false).toString(16).toUpperCase()} ('RS')
                </span>
              </div>

              {/* Field 2: Frame Version */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x02</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">Frame Version (uint8_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[Framing revision identifier]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 font-bold border border-cyan-900/40">
                  0x{view.getUint8(0x02).toString(16).padStart(2, '0').toUpperCase()} (v{view.getUint8(0x02)})
                </span>
              </div>

              {/* Field 3: Flags */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x03</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">Flags (uint8_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[Bit 0: Terminal; Bit 1: Flex Zone; Bit 2: Compressed]</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={`px-1.5 py-0.5 rounded ${view.getUint8(0x03) & FRAME_FLAG_TERMINAL ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-zinc-600'}`}>
                    EOF
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${view.getUint8(0x03) & FRAME_FLAG_FLEX_ZONE ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-zinc-600'}`}>
                    FLEX
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${view.getUint8(0x03) & FRAME_FLAG_COMPRESSED ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-zinc-600'}`}>
                    COMPR
                  </span>
                </div>
              </div>

              {/* Field 4: File ID */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x04 - 0x07</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">File ID (uint32_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[Transaction manifest identifier]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/60 text-white font-bold border border-zinc-800">
                  #{view.getUint32(0x04, false)}
                </span>
              </div>

              {/* Field 5: Chunk Index */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x08 - 0x0B</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">Chunk Index (uint32_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[Monotonic sequence offset]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/60 text-amber-300 font-bold border border-amber-900/40">
                  {view.getUint32(0x08, false)}
                </span>
              </div>

              {/* Field 6: Payload Length */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x0C - 0x0F</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">Payload Length (uint32_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[Nominal 65,536 bytes]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 font-bold border border-cyan-900/40">
                  {view.getUint32(0x0c, false).toLocaleString()} B
                </span>
              </div>

              {/* Field 7: CRC-64 Checksum (ECMA-182) */}
              <div className="p-2.5 rounded bg-[#131624] border border-[#1f253a] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">0x10 - 0x17</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">CRC-64 Checksum (uint64_t)</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[ECMA-182 polynomial]</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/60 text-purple-300 font-mono text-[11px] font-bold border border-purple-900/40">
                  0x{view.getBigUint64(0x10, false).toString(16).toUpperCase()}
                </span>
              </div>

              {/* Field 8: Raw Payload Boundary */}
              <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/30 flex items-center justify-between text-zinc-300">
                <div>
                  <span className="text-rose-400 font-bold">0x18 - End</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-white font-medium">Raw Payload (byte[])</span>
                  <span className="text-zinc-500 text-[11px] ml-2">[Direct memory write pipe]</span>
                </div>
                <span className="text-[11px] text-rose-300">
                  +{currentFrame.length - RS_HEADER_SIZE_BYTES} bytes payload
                </span>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-xs font-mono">No frames available</div>
          )}
        </div>

        {/* Right: Live Stream Monitor & Corruption Testing */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Stream Telemetry Controls */}
          <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>CHANNEL 1 TRANSMISSION STREAM</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {transferSpeedMBs} MB/s
              </span>
            </div>

            {/* Chunk Matrix Visualizer */}
            <div className="mb-4">
              <div className="text-[11px] font-mono text-zinc-400 mb-1.5 flex justify-between">
                <span>Atomic Chunks ({frames.length} total)</span>
                <span>Select chunk to inspect</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#121420] rounded border border-[#1f253a] max-h-36 overflow-y-auto">
                {frames.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedFrameIndex(idx);
                      setCorruptBitActive(false);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      selectedFrameIndex === idx
                        ? 'bg-rose-600 text-white font-bold shadow-[0_0_8px_rgba(225,29,72,0.5)]'
                        : streamProgress > idx
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        : 'bg-[#181c2e] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    #{idx}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream Actions */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={startStreamSimulation}
                disabled={streaming}
                className="flex-1 py-2 px-3 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{streaming ? `Streaming Chunk #${streamProgress}...` : 'Start 64KB Frame Stream'}</span>
              </button>
              <button
                onClick={() => setCorruptBitActive(!corruptBitActive)}
                className={`py-2 px-3 rounded text-xs font-mono font-medium border transition-colors ${
                  corruptBitActive
                    ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-[#161a29] text-zinc-300 border-[#282f49] hover:border-amber-500'
                }`}
                title="Inject 1-bit payload flip to test ECMA-182 corruption detection"
              >
                {corruptBitActive ? 'Bit Injected!' : 'Simulate Corrupt Byte'}
              </button>
            </div>

            {/* Verification Status */}
            {inspectionResult && (
              <div
                className={`p-3 rounded-lg border font-mono text-xs ${
                  inspectionResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-600 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {inspectionResult.isValid ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>CRC-64 ECMA-182 VERIFIED [Frame Valid]</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <span>CRC-64 CORRUPTION DETECTED</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {inspectionResult.isValid
                    ? 'Frame integrity confirmed. Zero-copy deserialization written directly to kernel buffer.'
                    : inspectionResult.error}
                </div>
              </div>
            )}
          </div>

          {/* Zero-Copy Hardware Pipeline Diagram */}
          <div className="bg-[#0a0c13] border border-[#1b1f30] rounded-xl p-4 font-mono text-xs text-zinc-400">
            <div className="text-zinc-200 font-bold mb-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>ZERO-COPY ARCHITECTURE PIPELINE</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-black/40 p-2.5 rounded border border-[#22283e]">
              <span className="text-rose-400">WebRTC DataChannel</span>
              <ArrowRight className="w-3 h-3 text-zinc-600" />
              <span className="text-cyan-300">24B Packed Header</span>
              <ArrowRight className="w-3 h-3 text-zinc-600" />
              <span className="text-emerald-300">Tauri / Rust Core</span>
              <ArrowRight className="w-3 h-3 text-zinc-600" />
              <span className="text-purple-300">Windows Kernel DMA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
