/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit tests for Project Red String Core Logic Engines
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  packBinaryFrame,
  unpackBinaryFrame,
  calculateCRC64,
  sliceFileIntoFrames,
  reassembleFrames,
  RS_MAGIC_PREFIX,
  RS_FRAME_VERSION,
  RS_HEADER_SIZE_BYTES,
  FRAME_FLAG_TERMINAL,
  FRAME_FLAG_FLEX_ZONE,
} from './binaryFramer.ts';

import {
  computePlatformMemory,
  canAcceptTransfer,
  zeroFillBuffer,
  StagedAsset,
} from './elasticMemory.ts';

import {
  getMagicCircleComplexity,
  createHandshakePayload,
  validateHandshakePayload,
} from './magicCircleMath.ts';

import { filterClipboardContent } from './clipboardFilter.ts';
import {
  createFateWatchState,
  applyOTDelta,
  computeDeltasBetween,
} from './operationalTransformation.ts';

test('Binary Framer: Packs 24-byte hardware aligned header with correct sentinels', () => {
  const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const fileId = 1042;
  const chunkIndex = 0;
  const flags = FRAME_FLAG_TERMINAL;

  const frame = packBinaryFrame(fileId, chunkIndex, payload, flags);

  assert.equal(frame.length, RS_HEADER_SIZE_BYTES + payload.length);

  // Validate header fields directly
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  assert.equal(view.getUint16(0x00, false), RS_MAGIC_PREFIX);
  assert.equal(view.getUint8(0x02), RS_FRAME_VERSION);
  assert.equal(view.getUint8(0x03), FRAME_FLAG_TERMINAL);
  assert.equal(view.getUint32(0x04, false), fileId);
  assert.equal(view.getUint32(0x08, false), chunkIndex);
  assert.equal(view.getUint32(0x0c, false), payload.length);
});

test('Binary Framer: Unpacks and verifies valid frames and detects corruption via CRC-64', () => {
  const payload = new TextEncoder().encode('Project Red String Confidential Telemetry');
  const frame = packBinaryFrame(99, 1, payload, 0);

  const unpacked = unpackBinaryFrame(frame);
  assert.equal(unpacked.isValid, true);
  assert.ok(unpacked.frame);
  assert.equal(unpacked.frame.header.fileId, 99);
  assert.equal(unpacked.frame.header.chunkIndex, 1);
  assert.deepEqual(unpacked.frame.payload, payload);

  // Corrupt a byte in the payload
  const corruptedFrame = new Uint8Array(frame);
  corruptedFrame[RS_HEADER_SIZE_BYTES + 3] ^= 0xff;

  const corruptedResult = unpackBinaryFrame(corruptedFrame);
  assert.equal(corruptedResult.isValid, false);
  assert.match(corruptedResult.error || '', /CRC-64 Checksum mismatch/i);
});

test('Binary Framer: Slices and reassembles binary files accurately', () => {
  // Create 150KB synthetic file (spans 3 chunks: 64KB, 64KB, 22KB)
  const testData = new Uint8Array(150 * 1024);
  for (let i = 0; i < testData.length; i++) {
    testData[i] = i % 251;
  }

  const rawFrames = sliceFileIntoFrames(55, testData);
  assert.equal(rawFrames.length, 3);

  // Verify terminal flag on last frame
  const lastUnpacked = unpackBinaryFrame(rawFrames[2]);
  assert.equal(lastUnpacked.isValid, true);
  assert.equal((lastUnpacked.frame!.header.flags & FRAME_FLAG_TERMINAL) !== 0, true);

  // Reassemble
  const unpackedFrames = rawFrames.map((f) => unpackBinaryFrame(f).frame!);
  const reassembled = reassembleFrames(unpackedFrames);
  assert.deepEqual(reassembled, testData);
});

test('Platform Elastic Memory: Enforces nominal soft cap and elastic margins (100%-115%)', () => {
  const softCapMB = 2048; // 2.0 GB
  const flexMarginPct = 15; // 15% elastic margin

  const mockAssets: StagedAsset[] = [
    {
      id: 1,
      name: 'master_audio.flac',
      sizeBytes: 1500 * 1024 * 1024, // 1.5 GB
      mimeType: 'audio/flac',
      timestamp: Date.now() - 5000,
      lastAccessed: Date.now() - 5000,
      isFlexZone: false,
      markedForEviction: false,
    },
  ];

  const state1 = computePlatformMemory(softCapMB, flexMarginPct, mockAssets);
  assert.equal(state1.zone, 'nominal');

  // Add asset that pushes into elastic margin (e.g. 2150 MB total -> between 2048 and 2355.2 MB)
  const flexAsset: StagedAsset = {
    id: 2,
    name: 'raw_camera_roll.dng',
    sizeBytes: 650 * 1024 * 1024,
    mimeType: 'image/x-adobe-dng',
    timestamp: Date.now(),
    lastAccessed: Date.now(),
    isFlexZone: true,
    markedForEviction: true,
  };

  const state2 = computePlatformMemory(softCapMB, flexMarginPct, [...mockAssets, flexAsset]);
  assert.equal(state2.zone, 'elastic_warning');
  assert.ok(state2.lruEvictionCandidates.includes(2));

  // Reject transfer that exceeds 115% ceiling
  const checkRejection = canAcceptTransfer(
    state2.usedBytes,
    500 * 1024 * 1024, // another 500 MB exceeds 2355 MB
    state2.softCapBytes,
    state2.elasticCeilingBytes
  );
  assert.equal(checkRejection.accepted, false);
});

test('Platform Memory: Zero-fill buffer sanitization securely wipes memory', () => {
  const secretBuffer = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x42, 0x13, 0x37]);
  zeroFillBuffer(secretBuffer);
  assert.deepEqual(secretBuffer, new Uint8Array([0, 0, 0, 0, 0, 0, 0]));
});

test('Magic Circle: Scales complexity geometry per Platform allocation', () => {
  const c512 = getMagicCircleComplexity(512);
  assert.equal(c512.rings, 1);
  assert.equal(c512.cardinalAnchors, 4);
  assert.equal(c512.polarGlyphNodes, 32);

  const c2GB = getMagicCircleComplexity(2048);
  assert.equal(c2GB.rings, 2);
  assert.equal(c2GB.cardinalAnchors, 8);
  assert.equal(c2GB.polarGlyphNodes, 96);

  const c10GB = getMagicCircleComplexity(16384);
  assert.equal(c10GB.rings, 3);
  assert.equal(c10GB.cardinalAnchors, 16);
  assert.equal(c10GB.polarGlyphNodes, 256);
});

test('Magic Circle: Handshake payload conforms to ARCH-V2.4 canonical schema', () => {
  const payload = createHandshakePayload(2048, 15, 49152);
  const validated = validateHandshakePayload(payload);
  assert.equal(validated.valid, true);
  assert.equal(payload.rs_ver, 2);
  assert.equal(payload.lan_discovery_port, 49152);
  assert.equal(payload.session_nonce.length, 64);
});

test('Fate Sync: Clipboard synchronizer redacts sensitive API keys and tokens', () => {
  const safeText = 'Hey, check out the new Red String ARCH-V2.4 release notes.';
  const safeCheck = filterClipboardContent(safeText);
  assert.equal(safeCheck.isSensitive, false);
  assert.equal(safeCheck.sanitized, safeText);

  const leakText = `Here is the key: ${['sk', 'live', 'EXAMPLEPLACEHOLDER1234567890'].join('_')} for tests.`;
  const leakCheck = filterClipboardContent(leakText);
  assert.equal(leakCheck.isSensitive, true);
  assert.match(leakCheck.sanitized, /\[REDACTED: Stripe Live Secret Key\]/);
});

test('Fate Watch: Sub-character operational transformations execute reliably', () => {
  let state = createFateWatchState('Hello');
  state = applyOTDelta(state, {
    seq: 1,
    type: 'insert',
    pos: 5,
    text: ' World',
    timestamp: Date.now(),
  });
  assert.equal(state.buffer, 'Hello World');

  state = applyOTDelta(state, {
    seq: 2,
    type: 'delete',
    pos: 5,
    len: 6,
    timestamp: Date.now(),
  });
  assert.equal(state.buffer, 'Hello');

  const deltas = computeDeltasBetween('Hello', 'Hello World!', 12, 10);
  assert.ok(deltas.length > 0);
  let replayState = createFateWatchState('Hello');
  for (const d of deltas) {
    replayState = applyOTDelta(replayState, d);
  }
  assert.equal(replayState.buffer, 'Hello World!');
});
