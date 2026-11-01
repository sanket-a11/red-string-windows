/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 8: Fate Sync: Bidirectional Mesh & Automated Clipboard Synchronizer
 * Mutual read/write command exchange, typing presence, threaded anchors, and regex credential defense.
 */

import React, { useState } from 'react';
import {
  filterClipboardContent,
  ClipboardItem,
} from '../core/clipboardFilter.ts';
import {
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Send,
  Clipboard,
  Check,
  AlertTriangle,
  Lock,
  ArrowRightLeft,
  Sparkles,
  Key,
  Terminal,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'desktop' | 'mobile';
  text: string;
  timestamp: number;
  anchor?: string;
  acknowledged: boolean;
}

export const FateSyncPanel: React.FC = () => {
  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'desktop',
      text: 'Desktop Tauri engine initialized on UDP port 49152.',
      timestamp: Date.now() - 60000,
      anchor: 'INIT_MANIFEST',
      acknowledged: true,
    },
    {
      id: 'm2',
      sender: 'mobile',
      text: 'Mobile frame sink linked. WebRTC DTLS 1.3 channel open.',
      timestamp: Date.now() - 45000,
      anchor: 'CHANNEL_ACK',
      acknowledged: true,
    },
    {
      id: 'm3',
      sender: 'desktop',
      text: 'Clipboard synchronizer armed with regex credential defense filters.',
      timestamp: Date.now() - 20000,
      anchor: 'CLIP_ARMED',
      acknowledged: true,
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [activeSender, setActiveSender] = useState<'desktop' | 'mobile'>('desktop');
  const [typingPresence, setTypingPresence] = useState<string | null>(null);

  // Clipboard sync state
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([
    {
      id: 'c1',
      sourceNode: 'desktop',
      text: 'git clone https://github.com/project-red-string/red-string-windows.git',
      sanitizedText: 'git clone https://github.com/project-red-string/red-string-windows.git',
      isFiltered: false,
      timestamp: Date.now() - 35000,
    },
    {
      id: 'c2',
      sourceNode: 'desktop',
      text: `Testing leak: ${['sk', 'live', 'EXAMPLE_PLACEHOLDER'].join('_')}`,
      sanitizedText: 'Testing leak: [REDACTED: Stripe Live Secret Key]',
      isFiltered: true,
      filterReason: 'Stripe Live Secret Key',
      timestamp: Date.now() - 15000,
    },
  ]);

  const [testClipboardInput, setTestClipboardInput] = useState('');

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: activeSender,
      text: inputMessage,
      timestamp: Date.now(),
      anchor: `THREAD_${Math.floor(Math.random() * 900 + 100)}`,
      acknowledged: true,
    };

    setMessages([...messages, newMsg]);
    setInputMessage('');
    setTypingPresence(null);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    setTypingPresence(`${activeSender === 'desktop' ? 'Desktop Node' : 'Mobile Node'} is typing...`);
  };

  // Test clipboard synchronizer with sensitive regex detection
  const syncClipboardText = () => {
    if (!testClipboardInput.trim()) return;

    const filterResult = filterClipboardContent(testClipboardInput);
    const newItem: ClipboardItem = {
      id: `c_${Date.now()}`,
      sourceNode: activeSender,
      text: testClipboardInput,
      sanitizedText: filterResult.sanitized,
      isFiltered: filterResult.isSensitive,
      filterReason: filterResult.matches.join(', '),
      timestamp: Date.now(),
    };

    setClipboardHistory([newItem, ...clipboardHistory]);
    setTestClipboardInput('');
  };

  const insertCredentialPreset = (sample: string) => {
    setTestClipboardInput(sample);
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-6 overflow-y-auto">
      {/* Top Banner: Fate Sync Header */}
      <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              SECTION 8 FATE SYNC // BIDIRECTIONAL MESH & REGEX CLIPBOARD FILTER
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-[#121422] p-1 rounded-lg border border-[#202538] font-mono text-xs">
            <span className="text-zinc-500 text-[11px] px-2">Emulate Input As:</span>
            <button
              onClick={() => setActiveSender('desktop')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeSender === 'desktop'
                  ? 'bg-rose-600 text-white font-semibold shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setActiveSender('mobile')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeSender === 'mobile'
                  ? 'bg-rose-600 text-white font-semibold shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        <p className="text-xs font-mono text-zinc-400 leading-relaxed max-w-4xl">
          Both nodes hold mutual read/write permissions. Equipped with live clipboard synchronizers with automated regex
          filtering (prevents password and API token spills across devices), typing presence flags, and threaded context
          anchors.
        </p>
      </div>

      {/* Main Grid: Interactive Mesh Chat & Clipboard Synchronizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left: Bidirectional Interactive Mesh Chat */}
        <div className="lg:col-span-7 flex flex-col bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>BIDIRECTIONAL INTERACTIVE COMMAND & TEXT EXCHANGE</span>
            </div>
            {typingPresence && (
              <span className="text-[11px] font-mono text-rose-400 animate-pulse">
                {typingPresence}
              </span>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 max-h-[380px]">
            {messages.map((msg) => {
              const isDesktop = msg.sender === 'desktop';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isDesktop ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-zinc-500">
                    <span className={isDesktop ? 'text-rose-400 font-semibold' : 'text-cyan-400 font-semibold'}>
                      {isDesktop ? 'WORKSTATION DESKTOP' : 'MOBILE SINK'}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    {msg.anchor && (
                      <span className="px-1.5 py-0.2 rounded bg-black/40 border border-zinc-800 text-zinc-400">
                        #{msg.anchor}
                      </span>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-lg max-w-[85%] text-xs font-mono leading-relaxed ${
                      isDesktop
                        ? 'bg-[#151827] border border-rose-950/60 text-zinc-200'
                        : 'bg-[#101b2b] border border-cyan-950/60 text-zinc-200'
                    }`}
                  >
                    {msg.text}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-500">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>ACK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-[#1c2033]"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={handleTyping}
              placeholder={`Send command or synchronized text from ${activeSender}...`}
              className="flex-1 bg-[#121422] border border-[#20253b] rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(225,29,72,0.4)]"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right: Automated Clipboard Synchronizer with Regex Defense */}
        <div className="lg:col-span-5 flex flex-col bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
              <Clipboard className="w-3.5 h-3.5 text-rose-500" />
              <span>AUTOMATED CLIPBOARD SYNC & REGEX FILTER</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              FILTER ACTIVE
            </span>
          </div>

          {/* Test Clipboard Injector */}
          <div className="mb-4">
            <div className="text-[11px] font-mono text-zinc-400 mb-1.5">
              Simulate OS Clipboard Copy:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testClipboardInput}
                onChange={(e) => setTestClipboardInput(e.target.value)}
                placeholder="Type or click leak presets below..."
                className="flex-1 bg-[#121422] border border-[#20253b] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-rose-500 placeholder:text-zinc-600"
              />
              <button
                onClick={syncClipboardText}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-medium"
              >
                Sync
              </button>
            </div>

            {/* Leak Presets to verify filter defense */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                onClick={() => insertCredentialPreset('AIzaSyD_k982710482019842019842019842019')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161a29] hover:bg-rose-950/60 hover:text-rose-300 border border-[#232a42] text-zinc-400 transition-colors"
              >
                + Google API Key Leak
              </button>
              <button
                onClick={() => insertCredentialPreset('ghp_abcdefghijklmnopqrstuvwxyz0123456789')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161a29] hover:bg-rose-950/60 hover:text-rose-300 border border-[#232a42] text-zinc-400 transition-colors"
              >
                + GitHub Token Leak
              </button>
              <button
                onClick={() => insertCredentialPreset('password = "SuperSecretMasterKey2026!"')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161a29] hover:bg-rose-950/60 hover:text-rose-300 border border-[#232a42] text-zinc-400 transition-colors"
              >
                + Password Assignment
              </button>
            </div>
          </div>

          {/* Synchronized Clipboard Log */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
            {clipboardHistory.map((clip) => (
              <div
                key={clip.id}
                className={`p-3 rounded-lg border font-mono text-xs ${
                  clip.isFiltered
                    ? 'bg-amber-950/20 border-amber-600/40'
                    : 'bg-[#121422] border-[#1e2338]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-[10px]">
                  <span className="text-zinc-500">
                    Source: <strong className="text-zinc-300">{clip.sourceNode.toUpperCase()}</strong>
                  </span>
                  {clip.isFiltered ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      BLOCKED: {clip.filterReason}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      CLEAN TRANSMISSION
                    </span>
                  )}
                </div>

                <div className="text-zinc-300 break-all text-[11px] bg-black/40 p-2 rounded border border-zinc-900">
                  {clip.sanitizedText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
