/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 1, 2 & 3: High-Level Architectural Topology & Executive Summary
 */

import React from 'react';
import {
  Shield,
  Zap,
  Eye,
  MessageSquare,
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  ArrowRight,
  Lock,
  Layers,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab } from '../types/redstring.ts';

interface TopologyOverviewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  platformCapMB: number;
}

export const TopologyOverview: React.FC<TopologyOverviewProps> = ({
  onNavigateTab,
  platformCapMB,
}) => {
  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-6 overflow-y-auto font-mono text-xs">
      {/* Hero: Axiom Banner */}
      <div className="bg-gradient-to-r from-[#11131e] via-[#0d0f17] to-[#14121b] border border-rose-950/80 rounded-xl p-6 shadow-[0_0_50px_rgba(225,29,72,0.1)] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#ff2a55] animate-pulse" />
            <span className="text-sm font-bold tracking-widest text-white uppercase">
              CONFIDENTIAL TECHNICAL SPECIFICATION // ARCH-V2.4
            </span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 font-semibold">
            REVISION CERTIFIED
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-wide">
          Project Red String: Symmetric P2P Cross-Device Nexus
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-4xl mb-5">
          High-performance, strictly symmetric communication infrastructure designed to bridge desktop workstations and mobile
          handhelds without intermediary cloud relays, third-party storage buckets, or account credential barriers. Sub-5ms
          operational latency, private direct-memory streaming, and fluid bidirectional asset coordination.
        </p>

        {/* The Core Axiom Callout */}
        <div className="p-4 bg-black/60 rounded-lg border-l-4 border-rose-500 border-y border-r border-[#222538] max-w-4xl">
          <div className="text-rose-400 font-bold text-xs uppercase mb-1 flex items-center gap-2">
            <span>◆ THE RED STRING CORE AXIOM</span>
          </div>
          <p className="text-zinc-300 text-xs leading-relaxed italic">
            "A pair of linked nodes forms a sovereign, closed computational circuit. No assets touch centralized infrastructure.
            All state changes, live typing telemetries, and media drops live strictly within allocated volatile bounds
            negotiated via procedural visual cryptography."
          </p>
        </div>
      </div>

      {/* 2. Core Functional Pillars */}
      <div>
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-rose-500" />
          <span>2. CORE FUNCTIONAL PILLARS</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: The Platform */}
          <div
            onClick={() => onNavigateTab('platform')}
            className="p-5 rounded-xl bg-[#0d0f17] border border-[#1e2337] hover:border-rose-500/50 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(225,29,72,0.15)] group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">The Platform</h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">
              A finite, dual-tier volatile storage staging zone for photos, master audio streams, archives, and documents.
              Enforces strict soft caps with elastic buffer margins (100%–115%) and LRU eviction.
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold">
              Current Cap: {platformCapMB} MB →
            </span>
          </div>

          {/* Pillar 2: Fate Sync */}
          <div
            onClick={() => onNavigateTab('fate_sync')}
            className="p-5 rounded-xl bg-[#0d0f17] border border-[#1e2337] hover:border-rose-500/50 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(225,29,72,0.15)] group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Fate Sync</h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">
              Bidirectional interactive command and text exchange. Equipped with live clipboard synchronizers, regex credential
              defense filters, typing presence, and delivery acknowledgments.
            </p>
            <span className="text-[11px] text-cyan-400 font-semibold">
              Interactive Mesh & Clipboard →
            </span>
          </div>

          {/* Pillar 3: Fate Watch */}
          <div
            onClick={() => onNavigateTab('fate_watch')}
            className="p-5 rounded-xl bg-[#0d0f17] border border-[#1e2337] hover:border-rose-500/50 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(225,29,72,0.15)] group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400">
                <Eye className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Fate Watch</h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">
              An asynchronous teleprompter and remote telemetry viewer. Renders transmitter keystrokes and structural adjustments
              on the watcher screen in sub-frame real time with glowing crimson cursor.
            </p>
            <span className="text-[11px] text-rose-400 font-semibold">
              Ghost Teleprompter Head →
            </span>
          </div>
        </div>
      </div>

      {/* 3. System Architecture Specification Metrics */}
      <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>SPECIFICATION PROTOCOL MATRIX</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-[#121422] rounded-lg border border-[#1e2338]">
            <div className="text-zinc-500 text-[10px] uppercase mb-1">System Architecture</div>
            <div className="text-white font-bold text-xs">Pure Dual-Node P2P</div>
            <div className="text-rose-400 text-[10px] mt-0.5">Sovereign Closed Circuit</div>
          </div>

          <div className="p-3 bg-[#121422] rounded-lg border border-[#1e2338]">
            <div className="text-zinc-500 text-[10px] uppercase mb-1">Transport Protocol</div>
            <div className="text-white font-bold text-xs">WebRTC / mDNS LAN</div>
            <div className="text-cyan-400 text-[10px] mt-0.5">UDP Port 49152</div>
          </div>

          <div className="p-3 bg-[#121422] rounded-lg border border-[#1e2338]">
            <div className="text-zinc-500 text-[10px] uppercase mb-1">Framing Engine</div>
            <div className="text-white font-bold text-xs">RS-Binary 64KB Frame</div>
            <div className="text-emerald-400 text-[10px] mt-0.5">24B Hardware Aligned</div>
          </div>

          <div className="p-3 bg-[#121422] rounded-lg border border-[#1e2338]">
            <div className="text-zinc-500 text-[10px] uppercase mb-1">Cryptographic Token</div>
            <div className="text-white font-bold text-xs">Procedural Magic Circle</div>
            <div className="text-purple-400 text-[10px] mt-0.5">ECDH X25519 &lt;120ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
