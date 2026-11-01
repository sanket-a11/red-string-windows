# Project Red String (ARCH-V2.4)
### Symmetric P2P Cross-Device Nexus & Reactive Telemetry Fabric

> **The Red String Core Axiom**  
> *"A pair of linked nodes forms a sovereign, closed computational circuit. No assets touch centralized infrastructure. All state changes, live typing telemetries, and media drops live strictly within allocated volatile bounds negotiated via procedural visual cryptography."*

---

## 🌟 Overview

**Red String** is a high-performance, strictly symmetric communication infrastructure designed to bridge desktop workstations (Windows / Tauri) and mobile handhelds (Flutter / Native) without intermediary cloud relays, third-party storage buckets, or account credential barriers.

By establishing an autonomous, zero-knowledge peer-to-peer (P2P) link over direct local networks (or fault-tolerant STUN conduits), Red String guarantees sub-5ms operational latency, private direct-memory streaming, and fluid bidirectional asset coordination.

---

## 🛠️ Core Architectural Pillars

- **The Magic Circle QR (Visual Cryptography)**:
  - Concentric procedural orbital runic tracks scaling with allocated platform size (512 MB, 2.0 GB, 10+ GB).
  - Micro-Aztec core with Reed-Solomon Level-H holding symmetric cryptographic keys.
  - Optical polar coordinate thresholding unwarp pass in `<120ms`.
  - Canonical JSON Handshake schema: `rs_ver: 2`, `session_nonce`, `lan_discovery_port: 49152`, `platform_cap_mb`, `flex_margin_pct: 15`.

- **The Platform (Volatile Memory Limits & Elasticity)**:
  - Finite dual-tier volatile storage staging zone for photos, master audio streams, archives, and documents.
  - Zone 1: Nominal Range (≤ 100% Soft Cap).
  - Zone 2: Elastic Margin (100%–115%) with amber warning and automated LRU eviction upon link teardown.
  - Autonomous zero-fill overwrite on session disconnection.

- **Red String Binary Framing Engine (Channel 1)**:
  - Direct WebRTC DataChannel streaming in atomic 64 KB binary frames.
  - Packed 24-byte hardware-aligned header: Magic Prefix `0x5253` (`'RS'`), version `0x01`, flags (EOF, Flex Zone, Compressed), uint32 file ID, uint32 chunk index, uint32 payload length, uint64 CRC-64 checksum (ECMA-182 polynomial).
  - Zero-copy deserialization directly into the operating system's kernel disk write buffers.

- **Fate Watch (Ghost Teleprompter)**:
  - Transmitter acts as broadcast source; Receiver is locked into read-only observation mode.
  - Streams sub-character operational transformation deltas (`insert`, `delete`, `cursor_pos`).
  - Distraction-free typewriter head with glowing crimson cursor.

- **Fate Sync (Bidirectional Mesh)**:
  - Both nodes hold mutual read/write permissions.
  - Automated bidirectional clipboard synchronizer with regex filtering to prevent API key and password leaks.

- **Dual-Node Bus Simulation (Figure 1.0)**:
  - Side-by-side interactive desktop workstation node and mobile companion frame sink.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- *(Optional for native Windows builds)*: [Rust & Cargo](https://www.rust-lang.org/) with `x86_64-pc-windows-msvc` target

### Installation & Local Run

```bash
# 1. Clone your repository
git clone https://github.com/<YOUR-USERNAME>/red-string-windows.git
cd red-string-windows

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Running Unit Tests

Run the decoupled pure logic test suite (CRC-64 ECMA-182, 24-byte hardware header packing, platform elasticity bounds, zero-fill wiping, regex defense, and OT deltas):

```bash
npx --yes tsx --test src/core/core.test.ts
```

---

## 🪟 Windows Desktop Build (Tauri v2)

To compile the native Windows `.exe` installer (NSIS) and enterprise `.msi` package:

```bash
# Production web build
npm run build

# Tauri native Windows compilation
npm run tauri build -- --target x86_64-pc-windows-msvc
```

Output installer target:
`src-tauri/target/release/bundle/nsis/RedString_2.4.0_x64-setup.exe`

---

## 📜 License

Apache-2.0
