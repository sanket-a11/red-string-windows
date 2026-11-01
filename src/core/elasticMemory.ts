/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Project Red String Platform: Volatile Memory Limits & Elasticity
 * Section 6: Soft Cap, Elastic Margin (100% to 115%), and LRU eviction tracking.
 */

export interface StagedAsset {
  id: number;
  name: string;
  sizeBytes: number;
  mimeType: string;
  timestamp: number;
  lastAccessed: number;
  isFlexZone: boolean;
  markedForEviction: boolean;
  dataBuffer?: Uint8Array;
}

export type MemoryZone = 'nominal' | 'elastic_warning' | 'hard_lockout';

export interface PlatformMemoryState {
  softCapBytes: number;
  elasticMarginPct: number;
  elasticCeilingBytes: number;
  usedBytes: number;
  zone: MemoryZone;
  usagePctOfSoftCap: number;
  usagePctOfCeiling: number;
  remainingNominalBytes: number;
  remainingElasticBytes: number;
  assets: StagedAsset[];
  lruEvictionCandidates: number[]; // Asset IDs queued for eviction
}

export function computePlatformMemory(
  softCapMB: number,
  flexMarginPct: number,
  assets: StagedAsset[]
): PlatformMemoryState {
  const softCapBytes = softCapMB * 1024 * 1024;
  const elasticMarginPct = flexMarginPct;
  const elasticCeilingBytes = Math.floor(softCapBytes * (1 + elasticMarginPct / 100));

  const usedBytes = assets.reduce((acc, asset) => acc + asset.sizeBytes, 0);

  let zone: MemoryZone = 'nominal';
  if (usedBytes > elasticCeilingBytes) {
    zone = 'hard_lockout';
  } else if (usedBytes > softCapBytes) {
    zone = 'elastic_warning';
  }

  const usagePctOfSoftCap = softCapBytes > 0 ? (usedBytes / softCapBytes) * 100 : 0;
  const usagePctOfCeiling = elasticCeilingBytes > 0 ? (usedBytes / elasticCeilingBytes) * 100 : 0;

  // Determine LRU candidates for eviction upon disconnect if in or approaching elastic zone
  // Sort flex-zone or oldest accessed assets first
  const flexAssets = assets
    .filter((a) => a.isFlexZone || usedBytes > softCapBytes)
    .sort((a, b) => a.lastAccessed - b.lastAccessed);

  const lruEvictionCandidates = flexAssets.map((a) => a.id);

  return {
    softCapBytes,
    elasticMarginPct,
    elasticCeilingBytes,
    usedBytes,
    zone,
    usagePctOfSoftCap,
    usagePctOfCeiling,
    remainingNominalBytes: Math.max(0, softCapBytes - usedBytes),
    remainingElasticBytes: Math.max(0, elasticCeilingBytes - usedBytes),
    assets,
    lruEvictionCandidates,
  };
}

/**
 * Validates whether an incoming file transfer of given byte size can be accepted.
 */
export function canAcceptTransfer(
  currentUsedBytes: number,
  newAssetBytes: number,
  softCapBytes: number,
  elasticCeilingBytes: number
): { accepted: boolean; entersElasticMargin: boolean; reason?: string } {
  const projectedTotal = currentUsedBytes + newAssetBytes;

  if (projectedTotal > elasticCeilingBytes) {
    return {
      accepted: false,
      entersElasticMargin: false,
      reason: `Exceeds elastic ceiling limit (${(elasticCeilingBytes / (1024 * 1024)).toFixed(1)} MB). Write rejected by Platform engine.`,
    };
  }

  const entersElasticMargin = projectedTotal > softCapBytes;

  return {
    accepted: true,
    entersElasticMargin,
  };
}

/**
 * Zero-fill overwrite on session disconnection (prevents forensic dump recovery).
 */
export function zeroFillBuffer(buffer: Uint8Array): void {
  buffer.fill(0);
}
