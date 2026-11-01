/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StagedAsset, MemoryZone } from '../core/elasticMemory.ts';
import { BinaryFrame } from '../core/binaryFramer.ts';
import { HandshakePayload, MagicCircleConfig } from '../core/magicCircleMath.ts';
import { OTDelta, FateWatchState } from '../core/operationalTransformation.ts';
import { ClipboardItem } from '../core/clipboardFilter.ts';

export type ActiveTab =
  | 'topology'
  | 'magic_circle'
  | 'platform'
  | 'binary_framer'
  | 'fate_watch'
  | 'fate_sync'
  | 'dual_node'
  | 'windows_build';

export type NodeRole = 'desktop' | 'mobile' | 'dual';

export interface PeerConnectionStatus {
  connected: boolean;
  role: NodeRole;
  peerId: string;
  latencyMs: number;
  dtlsCipher: string;
  ecdhKeyExchange: string;
  lanPort: number;
  dataChannelState: 'open' | 'connecting' | 'closed';
  bytesTransferred: number;
}
