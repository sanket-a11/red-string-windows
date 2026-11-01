/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 8: Fate Sync Automated Bidirectional Clipboard Synchronizer
 * Includes regex filtering to prevent accidental leaks of sensitive credentials (API keys, secrets, passwords).
 */

export interface ClipboardItem {
  id: string;
  sourceNode: 'desktop' | 'mobile';
  text: string;
  sanitizedText: string;
  isFiltered: boolean;
  filterReason?: string;
  timestamp: number;
}

// Patterns that identify high-risk credentials
const SENSITIVE_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /sk_live_[0-9a-zA-Z]{24,}/g, name: 'Stripe Live Secret Key' },
  { regex: /AIza[0-9A-Za-z-_]{35}/g, name: 'Google API Key' },
  { regex: /ghp_[0-9a-zA-Z]{36}/g, name: 'GitHub Personal Access Token' },
  { regex: /gho_[0-9a-zA-Z]{36}/g, name: 'GitHub OAuth Access Token' },
  { regex: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key ID' },
  { regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PRIVATE)\s+KEY-----[\s\S]*?-----END/gi, name: 'Private Cryptographic Key' },
  { regex: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, name: 'Bearer Auth Token' },
  { regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, name: 'JSON Web Token (JWT)' },
  { regex: /(?:password|passwd|pwd|secret)\s*[:=]\s*["']?([^\s"']{8,})["']?/gi, name: 'Explicit Password Assignment' },
];

/**
 * Inspects clipboard text, identifies sensitive patterns, and returns sanitized output.
 */
export function filterClipboardContent(rawText: string): {
  isSensitive: boolean;
  sanitized: string;
  matches: string[];
} {
  let isSensitive = false;
  let sanitized = rawText;
  const matches: string[] = [];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.regex.test(sanitized)) {
      isSensitive = true;
      matches.push(pattern.name);
      sanitized = sanitized.replace(pattern.regex, `[REDACTED: ${pattern.name}]`);
    }
  }

  return {
    isSensitive,
    sanitized,
    matches,
  };
}
