/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mobile Pairing Modal: Generates real phone-scannable QR code and direct links.
 * Includes automatic Local Network IP discovery so phone can connect when running on localhost.
 */

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  X,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Info,
  HelpCircle,
  Network,
} from 'lucide-react';

interface MobilePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  isPeerConnected: boolean;
  onOpenLocalTab: () => void;
}

export const MobilePairingModal: React.FC<MobilePairingModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  isPeerConnected,
  onOpenLocalTab,
}) => {
  const [copied, setCopied] = useState(false);
  const [detectedIps, setDetectedIps] = useState<string[]>([]);
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Fetch local network IP from server
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/network/ip')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.ips && data.ips.length > 0) {
          setDetectedIps(data.ips);
          if (isLocalhost && !selectedHost) {
            setSelectedHost(data.primaryIp);
          }
        }
      })
      .catch(() => {
        // ignore
      });
  }, [isOpen, isLocalhost, selectedHost]);

  if (!isOpen) return null;

  // Compute final URL for mobile phone
  let mobileBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000';

  if (isLocalhost && selectedHost && selectedHost !== 'localhost') {
    mobileBaseUrl = `http://${selectedHost}:${port}`;
  }

  const mobileUrl = `${mobileBaseUrl}?session=${sessionId}&role=mobile`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&color=10-12-18&bgcolor=ffffff&data=${encodeURIComponent(
    mobileUrl
  )}`;

  const copyLink = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e111a] border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(225,29,72,0.25)] flex flex-col font-mono text-xs max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1d2337] mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">CONNECT MOBILE PHONE</h3>
              <p className="text-[10px] text-zinc-400">SECTION 4 PROCEDURAL VISUAL PAIRING</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Localhost Warning & IP Selector */}
        {isLocalhost && (
          <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl mb-4 text-[11px] text-amber-200">
            <div className="flex items-start gap-2 mb-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Localhost Detected: Phones Cannot Open "localhost"</span>
            </div>
            <p className="text-zinc-300 leading-relaxed mb-2 text-[10px]">
              "localhost" points to the phone itself. To connect, your phone and computer must be on the{' '}
              <strong className="text-white">same Wi-Fi network</strong>, and the phone must use your computer's local Wi-Fi IP address.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-400 block font-semibold">
                Your Computer's Wi-Fi IP (Auto-Detected):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedHost}
                  onChange={(e) => setSelectedHost(e.target.value)}
                  placeholder="e.g. 192.168.1.15"
                  className="flex-1 bg-[#141724] border border-[#2b334d] rounded px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                {detectedIps.length > 0 && (
                  <select
                    value={selectedHost}
                    onChange={(e) => setSelectedHost(e.target.value)}
                    className="bg-[#141724] border border-[#2b334d] text-zinc-300 rounded px-2 py-1 text-xs font-mono focus:outline-none"
                  >
                    {detectedIps.map((ip) => (
                      <option key={ip} value={ip}>
                        {ip}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-black/50 rounded-xl border border-[#20273f] mb-4">
          <div className="relative p-2.5 bg-white rounded-xl shadow-lg mb-3">
            <img
              src={qrImageUrl}
              alt="Scan with phone camera"
              className="w-48 h-48 rounded"
            />
            {/* Center Red String Dot */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow">
                <span className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-200 text-center font-medium">
            Scan with your phone's camera (iPhone Camera or Android Google Lens)
          </p>
          <p className="text-[10px] text-zinc-500 text-center mt-0.5">
            Establishes zero-knowledge direct P2P link without accounts or cloud storage
          </p>
        </div>

        {/* Connection Status Indicator */}
        <div className="mb-4">
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              isPeerConnected
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                : 'bg-[#131624] border-[#22283e] text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPeerConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="font-semibold">
                {isPeerConnected ? 'Mobile Phone Connected!' : 'Waiting for phone scan...'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Session: {sessionId}</span>
          </div>
        </div>

        {/* Copyable Link */}
        <div className="mb-3">
          <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Direct Link for Mobile Browser:</span>
            {isLocalhost && !selectedHost && (
              <span className="text-amber-400">⚠️ Needs Wi-Fi IP</span>
            )}
          </label>
          <div className="flex items-center gap-1.5 p-1.5 bg-[#121422] rounded-lg border border-[#22283e]">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 bg-transparent text-[11px] text-zinc-300 px-2 select-all focus:outline-none truncate"
            />
            <button
              onClick={copyLink}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Troubleshooting Accordion */}
        <div className="border border-[#1e2439] rounded-xl overflow-hidden mb-4 bg-[#0a0c13]">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full p-2.5 text-left text-zinc-400 hover:text-white flex items-center justify-between transition-colors text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phone Page Still Not Loading? (Localhost Troubleshooting)</span>
            </span>
            <span className="text-[10px] text-zinc-600">{showTroubleshooting ? '▲ Hide' : '▼ View'}</span>
          </button>

          {showTroubleshooting && (
            <div className="p-3 border-t border-[#1e2439] space-y-2 text-[10px] text-zinc-300 leading-relaxed font-mono">
              <div className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">1.</span>
                <div>
                  <strong className="text-white">Same Wi-Fi Network:</strong> Your phone and computer must be connected to the exact same home or office Wi-Fi network (or connect your PC to your phone's personal hotspot).
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">2.</span>
                <div>
                  <strong className="text-white">Windows Defender Firewall:</strong> Windows may block incoming phone requests by default. If a firewall pop-up appeared, ensure "Allow access on Private networks" is checked.
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">3.</span>
                <div>
                  <strong className="text-white">Find Your IP Manually:</strong> On Windows, open PowerShell or Command Prompt and type <code className="text-cyan-300">ipconfig</code>. Look for <em>IPv4 Address</em> under "Wireless LAN adapter Wi-Fi" (e.g. <code className="text-cyan-300">192.168.1.XX</code>), then type it into the box above.
                </div>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-rose-400 font-bold">4.</span>
                <div>
                  <strong className="text-white">Router AP Isolation:</strong> Some guest Wi-Fi routers block devices from talking to each other. If so, simply enable your phone's <strong>Personal Hotspot</strong> and connect your PC to it!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1d2337] shrink-0">
          <button
            onClick={onOpenLocalTab}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Test in 2nd Browser Window</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
