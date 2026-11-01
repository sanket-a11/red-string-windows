/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Windows Fluent Titlebar with Red String Cryptographic Status & Window Controls
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Radio,
  Wifi,
  Minimize2,
  Square,
  X,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Monitor,
  Smartphone,
  Layers,
  Download,
} from 'lucide-react';
import { NodeRole, PeerConnectionStatus } from '../types/redstring.ts';

interface WindowsTitlebarProps {
  status: PeerConnectionStatus;
  nodeRole: NodeRole;
  onRoleChange: (role: NodeRole) => void;
  onZeroFillSanitize: () => void;
  onOpenPairingModal?: () => void;
}

export const WindowsTitlebar: React.FC<WindowsTitlebarProps> = ({
  status,
  nodeRole,
  onRoleChange,
  onZeroFillSanitize,
  onOpenPairingModal,
}) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleClose = () => {
    setShowExitModal(true);
  };

  const confirmExitSanitize = () => {
    onZeroFillSanitize();
    setShowExitModal(false);
  };

  return (
    <>
      <header className="h-10 bg-[#07080b] border-b border-[#1c1f2e] select-none flex items-center justify-between px-3 text-xs z-50">
        {/* Left: Branding & App Title */}
        <div className="flex items-center gap-2.5">
          {/* Red String Sigil */}
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
          </div>

          <div className="flex items-center gap-1.5 font-mono tracking-wider">
            <span className="font-bold text-rose-400 text-sm tracking-widest uppercase">RED STRING</span>
            <span className="text-zinc-600">//</span>
            <span className="text-zinc-400 hidden sm:inline">ARCH-V2.4</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/50 hidden md:inline">
              WINDOWS WORKSTATION NODE
            </span>
          </div>
        </div>

        {/* Center: Live Telemetry & Node Switcher */}
        <div className="flex items-center gap-3">
          {/* Node Role Switcher */}
          <div className="bg-[#12141f] p-0.5 rounded border border-[#232738] flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => onRoleChange('desktop')}
              className={`px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors ${
                nodeRole === 'desktop'
                  ? 'bg-rose-600 text-white font-medium shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Desktop Workstation Mode (Tauri/Rust Engine)"
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => onRoleChange('mobile')}
              className={`px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors ${
                nodeRole === 'mobile'
                  ? 'bg-rose-600 text-white font-medium shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Mobile Companion Frame Sink"
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile Sink</span>
            </button>
            <button
              onClick={() => onRoleChange('dual')}
              className={`px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors ${
                nodeRole === 'dual'
                  ? 'bg-rose-600 text-white font-medium shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Split Dual-Node Symmetric P2P Simulation"
            >
              <Layers className="w-3 h-3" />
              <span>Dual Node Split</span>
            </button>
          </div>

          {/* Connection Status Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0e111a] px-2.5 py-0.5 rounded border border-zinc-800 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>P2P LINKED</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-cyan-400" />
              <span>UDP:{status.lanPort}</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-rose-400 font-semibold">{status.latencyMs.toFixed(1)}ms</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 text-[10px]">{status.dtlsCipher}</span>
          </div>

          {/* Connect Phone (QR) Button */}
          {onOpenPairingModal && (
            <button
              onClick={onOpenPairingModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161a29] hover:bg-[#20263c] text-rose-300 hover:text-white border border-rose-900/50 font-mono text-xs font-semibold transition-all"
              title="Pair with physical mobile phone via QR code"
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Connect Phone</span>
            </button>
          )}

          {/* Download Project ZIP Button */}
          <a
            href="/project-red-string-windows.zip"
            download="project-red-string-windows.zip"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold shadow-[0_0_12px_rgba(225,29,72,0.4)] transition-all"
            title="Download full project folder as a ZIP archive"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>
        </div>

        {/* Right: Windows Controls */}
        <div className="flex items-center -mr-3">
          <button
            onClick={() => {}}
            className="w-11 h-10 inline-flex items-center justify-center text-zinc-400 hover:bg-[#1a1d2e] hover:text-zinc-100 transition-colors"
            title="Minimize to Windows Taskbar / System Tray"
            aria-label="Minimize Window"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="w-11 h-10 inline-flex items-center justify-center text-zinc-400 hover:bg-[#1a1d2e] hover:text-zinc-100 transition-colors"
            title="Maximize Window"
            aria-label="Maximize Window"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-10 inline-flex items-center justify-center text-zinc-400 hover:bg-rose-600 hover:text-white transition-colors"
            title="Close & Zero-Fill Overwrite"
            aria-label="Close Window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Zero-Fill Sanitization Confirmation Dialog */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121c] border border-rose-500/60 rounded-lg max-w-md w-full p-6 shadow-[0_0_30px_rgba(225,29,72,0.3)]">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-rose-950/60 rounded-full border border-rose-500/40 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono tracking-wide">
                  SECTION 9 MEMORY SANITIZATION
                </h3>
                <p className="text-xs text-rose-300 font-mono mt-0.5">
                  Autonomous Zero-Fill Overwrite on Session Disconnection
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Closing this node will instantly trigger cryptographic zero-filling across all volatile drop zone buffers,
              destroying ephemeral X25519 keys, raw byte frames, and cached telemetry chunks. No forensic memory dump can recover these assets.
            </p>

            <div className="bg-black/40 rounded p-3 font-mono text-[11px] text-zinc-400 border border-zinc-800 space-y-1 mb-5">
              <div>&gt; Wipe ephemeral ECDH session nonce</div>
              <div>&gt; Overwrite volatile Platform drop zone with 0x00</div>
              <div>&gt; Flush WebRTC DTLS 1.3 frame queues</div>
              <div>&gt; Terminate Windows direct-memory socket loop</div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExitSanitize}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.5)] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Zero-Fill & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
