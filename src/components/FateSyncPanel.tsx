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