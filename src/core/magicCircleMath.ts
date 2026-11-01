/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Section 4 & 5: The Magic Circle: Procedural Visual Cryptography
 * Scales geometric complexity relative to user's allocated Platform size.
 */

export interface MagicCircleConfig {
  allocationMB: number;
  rings: number;
  cardinalAnchors: number;
  polarGlyphNodes: number;
  orbitalSpeedMultiplier: number;
  nonEuclideanCrossHatching: boolean;
  tierLabel: string;
}

export interface HandshakePayload {
  rs_ver: number;              // uint8: 2
  session_nonce: string;       // hex_string (64 chars)
  lan_discovery_port: number;  // uint16: 49152
  platform_cap_mb: number;     // uint32: 2048
  flex_margin_pct: number;     // uint8: 15
}

/**
 * Computes radial layer and complexity parameters based on Platform Allocation.
 */
export function getMagicCircleComplexity(allocationMB: number): MagicCircleConfig {
  if (allocationMB <= 512) {
    return {
      allocationMB,
      rings: 1,
      cardinalAnchors: 4,
      polarGlyphNodes: 32,
      orbitalSpeedMultiplier: 1.0,
      nonEuclideanCrossHatching: false,
      tierLabel: '512 MB Mode (Single Ring, 4 Anchors, 32 Nodes)',
    };
  } else if (allocationMB <= 4096) {
    return {
      allocationMB,
      rings: 2,
      cardinalAnchors: 8,
      polarGlyphNodes: 96,
      orbitalSpeedMultiplier: 1.5,
      nonEuclideanCrossHatching: false,
      tierLabel: '2.0 GB Mode (Dual Concentric Rings, 8 Vertices, 96 Nodes)',
    };
  } else {
    return {
      allocationMB,
      rings: 3,
      cardinalAnchors: 16,
      polarGlyphNodes: 256,
      orbitalSpeedMultiplier: 2.2,
      nonEuclideanCrossHatching: true,
      tierLabel: '10+ GB Mode (Triple Orbital Halo, Cross-Hatching, 256 Nodes)',
    };
  }
}

/**
 * Generates an ephemeral 64-character hexadecimal nonce for ECDH handshake.
 */
export function generateEphemeralNonce(): string {
  const bytes = new Uint8Array(32);
  // Use crypto if available in runtime
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Creates canonical handshake payload matching ARCH-V2.4 Section 5.
 */
export function createHandshakePayload(
  platformCapMB: number = 2048,
  flexMarginPct: number = 15,
  port: number = 49152,
  nonce?: string
): HandshakePayload {
  return {
    rs_ver: 2,
    session_nonce: nonce || generateEphemeralNonce(),
    lan_discovery_port: port,
    platform_cap_mb: platformCapMB,
    flex_margin_pct: flexMarginPct,
  };
}

/**
 * Validates handshake payload integrity.
 */
export function validateHandshakePayload(payload: unknown): {
  valid: boolean;
  error?: string;
  data?: HandshakePayload;
} {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be a non-null object' };
  }

  const p = payload as Partial<HandshakePayload>;
  if (p.rs_ver !== 2) {
    return { valid: false, error: `Invalid rs_ver: ${p.rs_ver} (required: 2)` };
  }

  if (typeof p.session_nonce !== 'string' || p.session_nonce.length !== 64) {
    return { valid: false, error: 'session_nonce must be 64-char hex string' };
  }

  if (typeof p.lan_discovery_port !== 'number' || p.lan_discovery_port < 1024 || p.lan_discovery_port > 65535) {
    return { valid: false, error: 'lan_discovery_port must be valid port number (1024-65535)' };
  }

  if (typeof p.platform_cap_mb !== 'number' || p.platform_cap_mb <= 0) {
    return { valid: false, error: 'platform_cap_mb must be a positive integer' };
  }

  if (typeof p.flex_margin_pct !== 'number' || p.flex_margin_pct < 0 || p.flex_margin_pct > 100) {
    return { valid: false, error: 'flex_margin_pct must be between 0 and 100' };
  }

  return { valid: true, data: p as HandshakePayload };
}
