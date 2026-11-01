/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mobile Node View (Flutter / Native Frame Sink)
 * Full responsive mobile view designed for phones to receive files, preview media, and stream back to Desktop.
 */

import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Download,
  Upload,
  CheckCircle2,
  FileCode,
  FileAudio,
  FileVideo,
  FileArchive,
  Eye,
  Radio,
  Wifi,
  Zap,
  Sparkles,
  ArrowDown,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { StagedAsset } from '../core/elasticMemory.ts';
import { P2PTransferProgress } from '../core/p2pBridge.ts';

interface MobileFrameSinkProps {
  isPeerConnected: boolean;
  receivedAssets: { asset: StagedAsset; blob: Blob; url: string }[];
  currentTransfer: P2PTransferProgress | null;
  onUploadFromMobile: (file: File) => void;
  teleprompterText: string;
  onSwitchToDesktop?: () => void;
}

export const MobileFrameSink: React.FC<MobileFrameSinkProps> = ({
  isPeerConnected,
  receivedAssets,
  currentTransfer,
  onUploadFromMobile,
  teleprompterText,
  onSwitchToDesktop,
}) => {
  const [mobileTab, setMobileTab] = useState<'media_cache' | 'teleprompter'>('media_cache');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFromMobile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="flex flex-col h-full bg-[#07090e] text-zinc-200 font-mono text-xs overflow-hidden select-none">
      {/* Mobile Top Header */}
      <div className="p-3.5 bg-[#0b0e17] border-b border-[#1b2135] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <Smartphone className="w-3 h-3" />
          </div>
          <div>
            <div className="text-white font-bold text-xs tracking-wider">RED STRING MOBILE</div>
            <div className="text-[10px] text-zinc-500">FLUTTER / NATIVE FRAME SINK</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
              isPeerConnected
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                : 'bg-amber-950/70 border-amber-700 text-amber-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPeerConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span>{isPeerConnected ? 'LINKED TO PC' : 'WAITING FOR PC'}</span>
          </span>

          {onSwitchToDesktop && (
            <button
              onClick={onSwitchToDesktop}
              className="px-2 py-0.5 rounded bg-[#161a29] text-[10px] text-zinc-400 hover:text-white border border-[#272f48]"
            >
              PC View
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex border-b border-[#1a1f33] bg-[#0d101a] text-xs">
        <button
          onClick={() => setMobileTab('media_cache')}
          className={`flex-1 py-2.5 text-center font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            mobileTab === 'media_cache'
              ? 'border-rose-500 text-rose-400 bg-rose-950/20'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Media Cache ({receivedAssets.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('teleprompter')}
          className={`flex-1 py-2.5 text-center font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            mobileTab === 'teleprompter'
              ? 'border-rose-500 text-rose-400 bg-rose-950/20'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Fate Watch</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Active Transfer Banner if file in flight */}
        {currentTransfer && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/60 to-purple-950/40 border border-rose-500/60 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-xs flex items-center gap-1.5">
                <ArrowDown className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>INCOMING 64KB BINARY STREAM</span>
              </span>
              <span className="text-rose-400 font-bold">{currentTransfer.percentage}%</span>
            </div>

            <div className="text-[11px] text-zinc-300 truncate mb-2 font-mono">
              {currentTransfer.fileName} ({formatBytes(currentTransfer.totalBytes)})
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-rose-900/40 mb-2">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${currentTransfer.percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Chunk #{currentTransfer.chunkIndex + 1} / {currentTransfer.totalChunks}</span>
              <span className="text-cyan-300 font-semibold">{currentTransfer.speedMBs} MB/s</span>
            </div>
          </div>
        )}

        {mobileTab === 'media_cache' ? (
          <>
            {/* Upload from Mobile Button */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isPeerConnected}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Send File from Mobile to PC</span>
              </button>
            </div>

            {/* Received Files List */}
            <div className="flex-1 flex flex-col bg-[#0b0e18] border border-[#1b2238] rounded-xl p-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#181d2f] mb-3">
                <span className="text-zinc-300 font-bold text-xs">
                  RECEIVED ASSETS ({receivedAssets.length})
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Direct Memory Staged
                </span>
              </div>

              {receivedAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <div className="w-12 h-12 rounded-full bg-[#121522] border border-[#20273d] flex items-center justify-center text-rose-500 mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-zinc-300 font-bold mb-1">No Files Received Yet</div>
                  <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                    On your PC, open "The Platform Drop" or "Binary Framer" and click "Stream to Mobile" to beam files directly into this phone!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto">
                  {receivedAssets.map(({ asset, url }) => {
                    const isImage = asset.mimeType.includes('image');
                    const isAudio = asset.mimeType.includes('audio');

                    return (
                      <div
                        key={asset.id}
                        className="p-3 rounded-lg bg-[#111422] border border-[#20283f] flex flex-col gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isImage && <FileCode className="w-4 h-4 text-rose-400 shrink-0" />}
                            {isAudio && <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {!isImage && !isAudio && <FileArchive className="w-4 h-4 text-cyan-400 shrink-0" />}
                            <div className="truncate">
                              <div className="text-white font-bold text-xs truncate" title={asset.name}>
                                {asset.name}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {formatBytes(asset.sizeBytes)} • {new Date(asset.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          {/* One-click Mobile Save/Download Button */}
                          <a
                            href={url}
                            download={asset.name}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save to Device</span>
                          </a>
                        </div>

                        {/* Image Preview if image */}
                        {isImage && url && (
                          <div className="rounded-lg overflow-hidden border border-[#252c48] max-h-48 bg-black/40 flex items-center justify-center">
                            <img
                              src={url}
                              alt={asset.name}
                              className="w-full h-auto object-cover max-h-48"
                            />
                          </div>
                        )}

                        {/* Audio Player if audio */}
                        {isAudio && url && (
                          <audio controls className="w-full h-8 rounded mt-1" src={url} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Mobile Fate Watch Teleprompter */
          <div className="flex-1 flex flex-col bg-[#07090e] border border-rose-950/70 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[10px] text-zinc-400 mb-3">
              <span>TYPEWRITER SINK (LIVE WIRE)</span>
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Sub-Frame Real Time
              </span>
            </div>

            <div className="flex-1 text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap select-none overflow-y-auto font-mono">
              {teleprompterText || 'Awaiting keystrokes from desktop workstation...'}
              <span className="inline-block w-2 h-4 bg-rose-500 ml-0.5 align-middle shadow-[0_0_10px_#ff2a55] animate-pulse" />
            </div>

            <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex justify-between">
              <span>Observation Mode (Read Only)</span>
              <span className="text-emerald-400">&lt;5ms Latency</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
