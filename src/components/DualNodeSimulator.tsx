/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 3: Dual-Node Symmetric P2P Bus Simulator
 * Figure 1.0: DESKTOP NODE (Tauri / Rust Core Engine) <---> MOBILE NODE (Flutter / Native Frame Sink)
 */

import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  ArrowRightLeft,
  Zap,
  Activity,
  HardDrive,
  Eye,
  MessageSquare,
  Binary,
  ShieldCheck,
} from 'lucide-react';
import { StagedAsset } from '../core/elasticMemory.ts';

export const DualNodeSimulator: React.FC = () => {
  // Synchronized state across simulated nodes
  const [keystrokeText, setKeystrokeText] = useState(
    'Red String P2P Bus active. Zero cloud intermediaries.'
  );
  const [activeChannel, setActiveChannel] = useState<'fate_watch' | 'fate_sync' | 'platform'>(
    'fate_watch'
  );
  const [transmitting, setTransmitting] = useState(false);
  const [transferredBytes, setTransferredBytes] = useState(64 * 1024 * 32); // 2 MB

  const triggerPacketBurst = () => {
    setTransmitting(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setTransferredBytes((prev) => prev + 65536);
      if (count >= 10) {
        clearInterval(interval);
        setTransmitting(false);
      }
    }, 120);
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-6 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              FIGURE 1.0 SYMMETRIC DUAL-NODE P2P BUS SIMULATION
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300">
            Closed Computational Circuit • 0 Cloud Relays
          </span>
        </div>
        <p className="text-xs font-mono text-zinc-400 leading-relaxed max-w-4xl">
          A pair of linked nodes forms a sovereign, closed computational circuit. No assets touch centralized infrastructure.
          The multiplexed transport channels carry Fate Watch (Keystroke Wire), Fate Sync (Interactive JSON), and Platform (64KB Binary Chunks).
        </p>
      </div>

      {/* Symmetric Bus Visual Wire */}
      <div className="bg-[#090b11] border border-[#1b2034] rounded-xl p-4 flex flex-col items-center">
        <div className="w-full flex items-center justify-between px-6 mb-2 text-xs font-mono">
          <span className="text-rose-400 font-bold flex items-center gap-1.5">
            <Monitor className="w-4 h-4" />
            DESKTOP NODE (Windows / Tauri)
          </span>
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            MOBILE NODE (Flutter Sink)
          </span>
        </div>

        {/* Multiplexed Cables */}
        <div className="w-full space-y-2 py-3 px-4 bg-black/40 rounded-lg border border-[#181d2f] font-mono text-[11px]">
          {/* Cable 1: Fate Watch (Keystroke Wire) */}
          <div className="flex items-center gap-3">
            <span className="w-32 text-rose-400 text-right truncate">Fate Watch</span>
            <div className="flex-1 relative h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600 animate-[pulse_1.5s_ease-in-out_infinite]" />
            </div>
            <span className="text-[10px] text-zinc-500 w-28">&lt; 3ms OT Deltas</span>
          </div>

          {/* Cable 2: Fate Sync (Interactive JSON) */}
          <div className="flex items-center gap-3">
            <span className="w-32 text-cyan-400 text-right truncate">Fate Sync</span>
            <div className="flex-1 relative h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-600 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            <span className="text-[10px] text-zinc-500 w-28">Filtered Clipboard</span>
          </div>

          {/* Cable 3: Platform (64KB Binary Chunks) */}
          <div className="flex items-center gap-3">
            <span className="w-32 text-emerald-400 text-right truncate">Platform</span>
            <div className="flex-1 relative h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 ${transmitting ? 'animate-ping' : ''}`} />
            </div>
            <span className="text-[10px] text-zinc-500 w-28">
              {(transferredBytes / (1024 * 1024)).toFixed(2)} MB Shipped
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={triggerPacketBurst}
            disabled={transmitting}
            className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(225,29,72,0.4)]"
          >
            <Zap className="w-3 h-3" />
            <span>{transmitting ? 'Transmitting 64KB Chunks...' : 'Fire 64KB Frame Burst'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Node Renderers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Side: Desktop Workstation View */}
        <div className="flex flex-col bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400">
              <Monitor className="w-4 h-4" />
              <span>DESKTOP NODE ENGINE (Tauri/Rust)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
              Host Master
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs flex-1 flex flex-col">
            <div>
              <label className="block text-zinc-400 mb-1.5 text-[11px]">
                Keystroke Wire Transmitter (Type below to see Mobile react):
              </label>
              <textarea
                value={keystrokeText}
                onChange={(e) => setKeystrokeText(e.target.value)}
                rows={4}
                className="w-full bg-[#131624] border border-[#20263d] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none font-mono"
              />
            </div>

            <div className="p-3 bg-black/40 rounded-lg border border-zinc-800 space-y-1.5 text-[11px] text-zinc-400">
              <div className="text-zinc-200 font-semibold mb-1">Desktop Subsystems:</div>
              <div>• Platform Engine: Direct Disk IO with kernel DMA write buffers</div>
              <div>• Fate Watch: Low-latency sub-character delta broadcaster</div>
              <div>• Fate Sync: Automated clipboard scanner with regex protection</div>
              <div>• Crypto: Ephemeral X25519 Curve keys negotiated via Magic Circle</div>
            </div>
          </div>
        </div>

        {/* Right Side: Mobile Node View (Flutter Companion Sink) */}
        <div className="flex flex-col bg-[#0d0f17] border border-cyan-950/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <Smartphone className="w-4 h-4" />
              <span>MOBILE NODE (Flutter / Frame Sink)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300">
              Companion Sink
            </span>
          </div>

          {/* Simulated Mobile Phone Frame */}
          <div className="flex-1 flex flex-col bg-[#07090e] border border-[#192236] rounded-xl p-4 relative font-mono text-xs">
            <div className="text-[10px] text-zinc-500 border-b border-zinc-800/80 pb-2 mb-3 flex items-center justify-between">
              <span>Mobile Typewriter Head (Ghost Prompter)</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Sink
              </span>
            </div>

            <div className="flex-1 text-zinc-200 leading-relaxed whitespace-pre-wrap select-none">
              {keystrokeText}
              <span className="inline-block w-2 h-4 bg-rose-500 ml-0.5 align-middle shadow-[0_0_10px_#ff2a55] animate-pulse" />
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex justify-between">
              <span>Media Cache: 64KB Frame Sink</span>
              <span className="text-cyan-400">No Storage Buckets Used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
