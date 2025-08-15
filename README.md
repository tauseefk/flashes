# Flashes

https://github.com/user-attachments/assets/7707f245-0fa0-4044-a6bf-28b1517bc629

A "multiplayer" roguelike built with Rust/WASM core and TypeScript.

## Prerequisites

- Node.js
- Rust toolchain
- wasm-pack

## Running in dev mode

1. Compile the engine:

```bash
cd flashlighte.rs
./build.sh
```

2. Build the game:

```bash
cd www
npm install
npm run dev
```

## Directory Structure

```
flashes/
├─ flashlighte.rs/             // Rust workspace
│   ├─ build.sh                // compiles engine to WASM
│   ├─ batteries/              // core utilities and data structures crate
│   ├─ flashlight/             // "game engine"
│   └─ pathfinder/             // pathfinding crate
└─ www/                        // frontend
    ├─ src/                    // client side code
    └─ flashes-server/         // WebSocket signaling server
```

## Architecture

```
// 1. signaling server relays peer details
// 2. peers establish WebRTC connection
// 3. peers close the server connection

┌─────────────────┐       ┌─────────────────┐
│  Client 1       │       │  Client 2       │
│                 │ ◀═══▶ │                 │
│                 │       │                 │
└─────────────────┘       └─────────────────┘
        │                         │
        ▼                         ▼
┌───────────────────────────────────────────┐
│                                           │
│             Signaling Server              │
│                                           │
└───────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────┐
│                       Client Architecture                      │
├────────────────────────────────────────────────────────────────┤
│  TypeScript Frontend (www/src/)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Reactive       │  │  Render         │  │  State          │ │
│  │  Event Streams  │  │  Engine         │  │  Management     │ │
│  │  (rextream)     │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├────────────────────────────────────────────────────────────────┤
│  WASM Interface (www/src/globalAPI.ts)                         │
├────────────────────────────────────────────────────────────────┤
│  Rust Engine (/flashlighte.rs)                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Flashlight     │  │  Pathfinder     │  │  Batteries      │ │
│  │  (Game Engine)  │  │                 │  │  (Utilities)    │ │
│  │  - CRDT         │  │                 │  │                 │ │
│  │  - shadowcast   │  │                 │  │                 │ │
│  │  - transforms   │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```
