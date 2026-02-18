# Arcium Frontend SDK (universal)

TypeScript SDK for building encrypted Solana apps with Arcium: derive Arcium PDAs, encrypt user inputs, encode encrypted instructions, add compute/priority-fee helpers, and verify `SignedComputationOutputs`. Focused on crypto + transport helpers you can drop into any frontend.

Compatible with **`@arcium-hq/client` v0.8.x** (Arcium protocol v0.8.0).

## Features
- PDAs: mxe, mempool, executing pool, computation, cluster, comp_def.
- **`deriveCompDefAccounts`** — async helper that fetches `lutOffsetSlot` and returns the Address Lookup Table address required for `initCompDef` instructions (v0.7.0+).
- Encryption helpers (X25519 + RescueCipher), nonce/computation offset generation.
- Encrypted instruction builder + compute-budget helpers (`cu_price_micro`, `cuLimit`).
- Output verification helpers for `SignedComputationOutputs` (`verify_output`).
- Environment-driven config: cluster offset/program ID provided by the consumer.

## Quick Start
Scaffold a new terminal-styled Arcium app with built-in Solana wallet support:
```bash
npx crucible init <project-name>
# or
crucible init <project-name>
```

![Alt text](https://crucibles.dev/sh.png)

## Install
Published package (with required peers):
```bash
npm install arcium-frontend-sdk @coral-xyz/anchor @solana/web3.js @arcium-hq/client
```

Local workspace build (current repo):
```bash
cd arcium-sdk
npm install
npm run build
```
> Requires Node 20.18+.

## Environment
- `ARCIUM_CLUSTER_OFFSET` — **required**; keep per environment (dev/stage/prod) in `.env`.
- `NEXT_PUBLIC_RPC_URL`/`RPC_URL` — optional RPC (defaults to devnet).
- `NEXT_PUBLIC_MXE_PROGRAM_ID` — your program ID; the SDK never hardcodes it.
- `POOL_ACCOUNT_PUBKEY` / `CLOCK_ACCOUNT_PUBKEY` — shared game accounts used across the sample frontends (defaults shown below; override via env if yours differ).

`.env.example`:
```
ARCIUM_CLUSTER_OFFSET=768109697
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_MXE_PROGRAM_ID=ReplaceWithProgramId
POOL_ACCOUNT_PUBKEY=FsWbPQcJQ2cCyr9ndse13fDqds4F2Ezx2WgTL25Dke4M
CLOCK_ACCOUNT_PUBKEY=AxygBawEvVwZPetj3yPJb9sGdZvaJYsVguET1zFUQkV
```

## Usage walkthrough

### 1. Initialize a computation definition (required once, v0.7.0+)

Every comp def must be initialized before encrypted instructions can be queued. Since v0.7.0, the `initCompDef` instruction requires an Address Lookup Table account derived from `mxeAcc.lutOffsetSlot`. Use `deriveCompDefAccounts` to get all the pieces:

```ts
import { deriveCompDefAccounts } from 'arcium-frontend-sdk';

const { compDefAccount, mxeAccount, addressLookupTable } = await deriveCompDefAccounts(provider, {
  programId: program.programId,
  compDefName: 'my_computation', // snake_case name matching your circuit
});

await program.methods.initMyComputationCompDef()
  .accounts({ compDefAccount, payer: wallet.publicKey, mxeAccount, addressLookupTable })
  .signers([wallet])
  .rpc({ preflightCommitment: 'confirmed', commitment: 'confirmed' });
```

### 2. Build and send an encrypted instruction

```ts
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  ensureEnvConfig,
  deriveCoreAccounts,
  prepareEncryptionPayload,
  encodeEncryptedCall,
  buildInstruction,
  buildComputeBudgetIxs,
  randomComputationOffset,
} from 'arcium-frontend-sdk';
import { getMXEPublicKey } from '@arcium-hq/client';

// 0) Env (cluster offset may differ per env)
const env = ensureEnvConfig(); // reads ARCIUM_CLUSTER_OFFSET
const programId = new PublicKey(process.env.NEXT_PUBLIC_MXE_PROGRAM_ID!);

// 1) Fetch MXE public key from chain
const mxePubkey = await getMXEPublicKey(provider, programId);

// 2) Encrypt inputs (numbers/bigints)
const computationOffset = randomComputationOffset();
const encrypted = prepareEncryptionPayload({
  values: [1n, 2n, 3n, 4n],
  mxePublicKey: mxePubkey,
});

// 3) Derive PDAs
const derived = deriveCoreAccounts({
  programId,
  clusterOffset: env.clusterOffset,
  computationOffset,
  compDefOffset: 'my_comp_def', // string -> getCompDefAccOffset
});

// 4) Build ix data (use your 8-byte discriminator from IDL)
const discriminator = Buffer.alloc(8);
const data = encodeEncryptedCall({
  discriminator,
  computationOffset,
  encryptionPubkey: encrypted.encryptionPubkey,
  nonce: encrypted.nonce,
  ciphertexts: encrypted.ciphertexts,
});

// 5) Account metas in your IDL order, then build the instruction
const keys = [
  { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
  { pubkey: derived.mxeAccount, isSigner: false, isWritable: false },
  { pubkey: derived.mempoolAccount, isSigner: false, isWritable: true },
  { pubkey: derived.executingPool, isSigner: false, isWritable: true },
  { pubkey: derived.computationAccount, isSigner: false, isWritable: true },
  { pubkey: derived.compDefAccount, isSigner: false, isWritable: false },
  { pubkey: derived.clusterAccount, isSigner: false, isWritable: true },
  // ... your program-specific accounts ...
  { pubkey: derived.arciumProgramId, isSigner: false, isWritable: false },
];
const { ix } = buildInstruction({ programId, accounts: keys, data });

// 6) Optional compute budget
const budgetIxs = buildComputeBudgetIxs({ cuPriceMicro: 1000, cuLimit: 1_400_000 });
```

Full runnable example: `examples/battle-frontend.ts`.

### Callback + verify_output example
```ts
import { verifySignedOutputs, assertVerified } from 'arcium-frontend-sdk';

function handleCallback(signedOutputs: { verify_output: () => boolean; payload: unknown }) {
  assertVerified(signedOutputs); // throws if invalid
  return signedOutputs.payload;
}
```
See `examples/callback-verify.ts`.

## API surface

| Module | Exports |
|---|---|
| `config` | `ensureEnvConfig`, `loadEnvConfig`, `createConnection`, `createAnchorProvider`, `toArciumEnv` |
| `accounts` | `deriveCoreAccounts`, `deriveCompDefAccounts`, `toBuffer` |
| `encryption` | `prepareEncryptionPayload`, `randomComputationOffset`, `randomNonce`, `generateKeypair`, `deriveSharedSecret`, `encryptBigints`, `buildEncryptedArgs` |
| `transactions/compute` | `encodeEncryptedCall`, `buildInstruction`, `buildComputeBudgetIxs`, `buildTransaction` |
| `results` | `verifySignedOutputs`, `assertVerified` |

## Changelog

### v0.2.0
- Updated `@arcium-hq/client` dependency to `^0.8.4` (supports Arcium protocol v0.8.0).
- **New:** `deriveCompDefAccounts(provider, { programId, compDefName })` — async helper for `initCompDef` instructions. Fetches `mxeAcc.lutOffsetSlot` and returns `{ compDefAccount, mxeAccount, addressLookupTable, compDefAccAddress, compDefOffset }`.
- **New type:** `DerivedCompDefAccounts`.
- `generateKeypair()` updated: `x25519.utils.randomPrivateKey()` → `x25519.utils.randomSecretKey()` (renamed in `@noble/curves`).

### v0.1.4
- Initial public release with `@arcium-hq/client@0.5.x` support.

## LLM usage guide
If you ask an AI assistant (Cursor, Claude Code, Copilot Workspace, etc.) to wire this SDK into your app, hand it `LLM_GUIDE.md`. That file gives the model exact steps, required env vars, and the canonical flow to encrypt inputs, derive Arcium PDAs, build encrypted instructions, and verify results using the published npm package.

## License
MIT © 2025 sicmundus
