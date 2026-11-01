/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Project Red String Binary Framing Engine (Channel 1)
 * Hardware-aligned 24-byte header packed framing engine according to ARCH-V2.4 specification.
 */

export const RS_MAGIC_PREFIX = 0x5253; // 'RS'
export const RS_FRAME_VERSION = 0x01;
export const RS_CHUNK_SIZE_BYTES = 64 * 1024; // 64 KB nominal
export const RS_HEADER_SIZE_BYTES = 24;

export const FRAME_FLAG_TERMINAL = 1 << 0;  // Bit 0: Terminal Chunk (EOF)
export const FRAME_FLAG_FLEX_ZONE = 1 << 1; // Bit 1: Flex Zone Asset
export const FRAME_FLAG_COMPRESSED = 1 << 2; // Bit 2: Compressed

export interface FrameHeader {
  magicPrefix: number;      // uint16 (0x5253)
  frameVersion: number;     // uint8 (0x01)
  flags: number;            // uint8
  fileId: number;           // uint32
  chunkIndex: number;       // uint32
  payloadLength: number;    // uint32
  crc64Checksum: bigint;    // uint64 (ECMA-182)
}

export interface BinaryFrame {
  header: FrameHeader;
  payload: Uint8Array;
  rawBuffer: Uint8Array;
}

// Precomputed ECMA-182 64-bit CRC lookup table
// Polynomial: 0x42F0E1EBA9EA3693ULL
const CRC64_ECMA182_POLY = 0x42f0e1eba9ea3693n;
const crc64Table = new BigUint64Array(256);

for (let i = 0; i < 256; i++) {
  let cur = BigInt(i);
  for (let bit = 0; bit < 8; bit++) {
    if ((cur & 1n) !== 0n) {
      cur = (cur >> 1n) ^ CRC64_ECMA182_POLY;
    } else {
      cur >>= 1n;
    }
  }
  crc64Table[i] = cur;
}

/**
 * Calculates 64-bit CRC using ECMA-182 polynomial.
 */
export function calculateCRC64(data: Uint8Array): bigint {
  let crc = 0xffffffffffffffffn;
  for (let i = 0; i < data.length; i++) {
    const tableIndex = Number((crc ^ BigInt(data[i])) & 0xffn);
    crc = (crc >> 8n) ^ crc64Table[tableIndex];
  }
  return crc ^ 0xffffffffffffffffn;
}

/**
 * Packs a 64KB raw binary payload into a 24-byte hardware-aligned frame.
 */
export function packBinaryFrame(
  fileId: number,
  chunkIndex: number,
  payload: Uint8Array,
  flags: number = 0
): Uint8Array {
  const payloadLength = payload.length;
  const totalLength = RS_HEADER_SIZE_BYTES + payloadLength;
  const frameBuffer = new Uint8Array(totalLength);
  const view = new DataView(frameBuffer.buffer, frameBuffer.byteOffset, frameBuffer.byteLength);

  // 0x00 - 0x01: Magic Prefix (uint16)
  view.setUint16(0x00, RS_MAGIC_PREFIX, false); // Big-endian standard
  // 0x02: Frame Version (uint8)
  view.setUint8(0x02, RS_FRAME_VERSION);
  // 0x03: Flags (uint8)
  view.setUint8(0x03, flags);
  // 0x04 - 0x07: File ID (uint32)
  view.setUint32(0x04, fileId, false);
  // 0x08 - 0x0B: Chunk Index (uint32)
  view.setUint32(0x08, chunkIndex, false);
  // 0x0C - 0x0F: Payload Length (uint32)
  view.setUint32(0x0c, payloadLength, false);

  // Compute CRC-64 of payload
  const crc = calculateCRC64(payload);
  // 0x10 - 0x17: CRC-64 Checksum (uint64)
  view.setBigUint64(0x10, crc, false);

  // 0x18 - End: Raw Payload
  frameBuffer.set(payload, RS_HEADER_SIZE_BYTES);

  return frameBuffer;
}

/**
 * Unpacks and verifies an atomic 24-byte hardware-aligned binary frame.
 */
export function unpackBinaryFrame(rawFrame: Uint8Array): {
  isValid: boolean;
  error?: string;
  frame?: BinaryFrame;
} {
  if (rawFrame.length < RS_HEADER_SIZE_BYTES) {
    return { isValid: false, error: 'Frame buffer smaller than 24-byte header' };
  }

  const view = new DataView(rawFrame.buffer, rawFrame.byteOffset, rawFrame.byteLength);
  const magic = view.getUint16(0x00, false);
  if (magic !== RS_MAGIC_PREFIX) {
    return {
      isValid: false,
      error: `Invalid magic prefix: 0x${magic.toString(16).toUpperCase()} (expected 0x5253 'RS')`,
    };
  }

  const version = view.getUint8(0x02);
  if (version !== RS_FRAME_VERSION) {
    return { isValid: false, error: `Unsupported frame version: ${version}` };
  }

  const flags = view.getUint8(0x03);
  const fileId = view.getUint32(0x04, false);
  const chunkIndex = view.getUint32(0x08, false);
  const payloadLength = view.getUint32(0x0c, false);
  const expectedCrc = view.getBigUint64(0x10, false);

  if (rawFrame.length < RS_HEADER_SIZE_BYTES + payloadLength) {
    return {
      isValid: false,
      error: `Frame truncated: header specifies ${payloadLength} bytes, total frame has ${rawFrame.length}`,
    };
  }

  const payload = rawFrame.subarray(RS_HEADER_SIZE_BYTES, RS_HEADER_SIZE_BYTES + payloadLength);
  const actualCrc = calculateCRC64(payload);

  if (actualCrc !== expectedCrc) {
    return {
      isValid: false,
      error: `CRC-64 Checksum mismatch! Expected 0x${expectedCrc.toString(16)}, got 0x${actualCrc.toString(16)}`,
    };
  }

  return {
    isValid: true,
    frame: {
      header: {
        magicPrefix: magic,
        frameVersion: version,
        flags,
        fileId,
        chunkIndex,
        payloadLength,
        crc64Checksum: actualCrc,
      },
      payload,
      rawBuffer: rawFrame,
    },
  };
}

/**
 * Slices an arbitrary binary file into 64KB atomic frames with packed headers.
 */
export function sliceFileIntoFrames(
  fileId: number,
  fileBytes: Uint8Array,
  isFlexZone: boolean = false
): Uint8Array[] {
  const totalLength = fileBytes.length;
  if (totalLength === 0) {
    // Single empty EOF chunk
    const flags = FRAME_FLAG_TERMINAL | (isFlexZone ? FRAME_FLAG_FLEX_ZONE : 0);
    return [packBinaryFrame(fileId, 0, new Uint8Array(0), flags)];
  }

  const frames: Uint8Array[] = [];
  let offset = 0;
  let chunkIdx = 0;

  while (offset < totalLength) {
    const end = Math.min(offset + RS_CHUNK_SIZE_BYTES, totalLength);
    const chunk = fileBytes.subarray(offset, end);
    const isTerminal = end >= totalLength;

    let flags = 0;
    if (isTerminal) flags |= FRAME_FLAG_TERMINAL;
    if (isFlexZone) flags |= FRAME_FLAG_FLEX_ZONE;

    frames.push(packBinaryFrame(fileId, chunkIdx, chunk, flags));
    offset = end;
    chunkIdx++;
  }

  return frames;
}

/**
 * Reassembles an array of frames back into full file bytes.
 */
export function reassembleFrames(frames: BinaryFrame[]): Uint8Array {
  // Sort by chunk index
  const sorted = [...frames].sort((a, b) => a.header.chunkIndex - b.header.chunkIndex);
  const totalPayloadSize = sorted.reduce((sum, f) => sum + f.payload.length, 0);
  const result = new Uint8Array(totalPayloadSize);

  let writeOffset = 0;
  for (const f of sorted) {
    result.set(f.payload, writeOffset);
    writeOffset += f.payload.length;
  }

  return result;
}
