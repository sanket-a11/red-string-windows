/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 8: Fate Watch: Ghost Teleprompter & Remote Keystroke Wire
 * Distraction-free typewriter head with glowing crimson cursor and sub-character OT stream.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  createFateWatchState,
  applyOTDelta,
  computeDeltasBetween,
  OTDelta,
  FateWatchState,
} from '../core/operationalTransformation.ts';
import {
  Eye,
  Radio,
  Terminal,
  Activity,
  Sparkles,
  ArrowRight,
  Shield,
  Volume2,
  Lock,
} from 'lucide-react';

interface FateWatchPanelProps {
  isWatcherReadOnly?: boolean;
}

export const FateWatchPanel: React.FC<FateWatchPanelProps> = ({
  isWatcherReadOnly = false,
}) => {
  const [mode, setMode] = useState<'transmitter' | 'receiver'>(
    isWatcherReadOnly ? 'receiver' : 'transmitter'
  );

  const [documentText, setDocumentText] = useState<string>(
    `PROJECT RED STRING // ARCH-V2.4\nCONFIDENTIAL TELEMETRY STREAM\n\nSovereign closed computational circuit initialized.\nSub-character operational deltas are streaming across the keystroke wire in sub-frame real time.`
  );

  const [watchState, setWatchState] = useState<FateWatchState>(() =>
    createFateWatchState(documentText)
  );

  const [otStreamLog, setOtStreamLog] = useState<OTDelta[]>([]);
  const seqCounter = useRef(1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Transmitter typing handler
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (mode === 'receiver') return;

    const newText = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Compute sub-character deltas
    const deltas = computeDeltasBetween(
      documentText,
      newText,
      cursorPos,
      seqCounter.current
    );

    seqCounter.current += deltas.length;
    setDocumentText(newText);

    // Update receiver state through OT engine
    let updated = watchState;
    for (const d of deltas) {
      updated = applyOTDelta(updated, d);
    }
    setWatchState(updated);
    setOtStreamLog((prev) => [...prev.slice(-40), ...deltas]);
  };

  // Preset script streamer for testing
  const streamSamplePrompt = () => {
    const snippet = "\n\n[TRANSMITTING GHOST TELEMETRY] -> Direct memory channel verified. Zero plaintext eavesdropping on untrusted Wi-Fi.";
    let i = 0;
    const interval = setInterval(() => {
      if (i >= snippet.length) {
        clearInterval(interval);
        return;
      }
      const char = snippet[i];
      const delta: OTDelta = {
        seq: seqCounter.current++,
        type: 'insert',
        pos: watchState.buffer.length,
        text: char,
        timestamp: Date.now(),
      };
      setWatchState((prev) => {
        const next = applyOTDelta(prev, delta);
        setDocumentText(next.buffer);
        return next;
      });
      setOtStreamLog((prev) => [...prev.slice(-40), delta]);
      i++;
    }, 45);
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-6 overflow-y-auto">
      {/* Top Banner: Fate Watch Telemetry Header */}
      <div className="bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              SECTION 8 FATE WATCH // GHOST TELEPROMPTER & KEYSTROKE WIRE
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#121422] p-1 rounded-lg border border-[#202538] font-mono text-xs">
            <button
              onClick={() => setMode('transmitter')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                mode === 'transmitter'
                  ? 'bg-rose-600 text-white font-semibold shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Transmitter (Broadcast)</span>
            </button>
            <button
              onClick={() => setMode('receiver')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                mode === 'receiver'
                  ? 'bg-rose-600 text-white font-semibold shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Receiver (Locked Watcher)</span>
            </button>
          </div>
        </div>

        <p className="text-xs font-mono text-zinc-400 leading-relaxed max-w-4xl">
          Transmitter acts as broadcast source; Receiver is locked into read-only observation mode. Instead of full message
          submits, sub-character operational transformation deltas (insert, delete, cursor_pos) stream continuously across
          the wire. The screen renders as a real-time distraction-free typewriter head with glowing crimson cursor.
        </p>
      </div>

      {/* Main Grid: Teleprompter & OT Wire */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left: The Distraction-Free Typewriter Head */}
        <div className="lg:col-span-8 flex flex-col bg-[#08090d] border border-rose-950/70 rounded-xl p-6 shadow-[0_0_40px_rgba(225,29,72,0.08)] relative overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1b1c28] mb-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
              <span className="text-zinc-300 font-bold">TYPEWRITER SINK</span>
              <span className="text-zinc-600">//</span>
              <span className="text-rose-400 text-[11px]">
                {mode === 'transmitter' ? 'LIVE TRANSMIT BROADCAST' : 'READ-ONLY GHOST WATCHER'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'transmitter' && (
                <button
                  onClick={streamSamplePrompt}
                  className="px-2.5 py-1 rounded bg-[#161826] hover:bg-[#202438] text-rose-300 border border-rose-900/40 text-[11px] font-mono flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>Auto-Type Telemetry</span>
                </button>
              )}
              <span className="text-zinc-500 text-[11px]">
                Chars: {documentText.length}
              </span>
            </div>
          </div>

          {/* Typewriter Body */}
          <div className="flex-1 flex flex-col relative font-mono">
            {mode === 'transmitter' ? (
              <textarea
                ref={textareaRef}
                value={documentText}
                onChange={handleTextChange}
                placeholder="Type here to transmit operational transformation deltas in sub-frame real time..."
                className="w-full flex-1 bg-transparent text-zinc-100 text-sm leading-relaxed p-2 resize-none focus:outline-none placeholder:text-zinc-600 font-mono tracking-wide"
                autoFocus
              />
            ) : (
              <div className="w-full flex-1 text-zinc-100 text-sm leading-relaxed p-2 font-mono tracking-wide whitespace-pre-wrap select-none overflow-y-auto">
                {watchState.buffer}
                {/* Glowing Crimson Typewriter Cursor */}
                <span className="inline-block w-2.5 h-4.5 bg-rose-500 ml-0.5 align-middle shadow-[0_0_12px_#ff2a55] animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            )}
          </div>

          {/* Typewriter Footer */}
          <div className="pt-3 border-t border-[#1b1c28] flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Sub-frame synchronization latency: &lt;3ms</span>
            <span className="text-rose-400">Crimson Typewriter Head Active</span>
          </div>
        </div>

        {/* Right: Operational Transformation Event Wire Stream */}
        <div className="lg:col-span-4 flex flex-col bg-[#0d0f17] border border-[#1e2337] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2033] mb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-200">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>SUB-CHARACTER OT WIRE STREAM</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800">
              REAL-TIME
            </span>
          </div>

          {/* OT Event List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] max-h-[460px] pr-1">
            {otStreamLog.length === 0 ? (
              <div className="text-zinc-600 text-center py-12">
                Awaiting transmitter keystroke deltas...
              </div>
            ) : (
              otStreamLog.slice(-25).reverse().map((delta) => (
                <div
                  key={`${delta.seq}-${delta.timestamp}`}
                  className="p-2 rounded bg-[#11131e] border border-[#1d2133] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold">#{delta.seq}</span>
                    {delta.type === 'insert' && (
                      <span className="text-emerald-400 font-semibold px-1 rounded bg-emerald-950/50 border border-emerald-900/50">
                        INSERT
                      </span>
                    )}
                    {delta.type === 'delete' && (
                      <span className="text-rose-400 font-semibold px-1 rounded bg-rose-950/50 border border-rose-900/50">
                        DELETE
                      </span>
                    )}
                    {delta.type === 'cursor_pos' && (
                      <span className="text-cyan-400 font-semibold px-1 rounded bg-cyan-950/50 border border-cyan-900/50">
                        CURSOR
                      </span>
                    )}

                    <span className="text-zinc-300">
                      @pos:{delta.pos}
                      {delta.text && (
                        <span className="text-white font-bold ml-1.5">
                          "{delta.text.replace(/\n/g, '\\n')}"
                        </span>
                      )}
                      {delta.len && (
                        <span className="text-rose-300 ml-1.5">(-{delta.len})</span>
                      )}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-600">
                    {new Date(delta.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
