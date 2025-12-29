# Arcium Frontend SDK (universal)

TypeScript SDK for building encrypted Solana apps with Arcium: derive Arcium PDAs, encrypt user inputs, encode encrypted instructions, add compute/priority-fee helpers, and verify `SignedComputationOutputs`. Focused on crypto + transport helpers you can drop into any frontend.

## Features
- v0.5.1-compatible PDAs (mxe, mempool, executing pool, computation, cluster, comp_def).
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
> Requires Node 20.18+ (per @arcium-hq/client engine).

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
} from 'arcium-frontend-sdk';
// If you need the real MXE pubkey, import getMXEPublicKey from '@arcium-hq/client' and use a provider (see examples/battle-frontend.ts).

// 0) Env (cluster offset may differ per env)
const env = ensureEnvConfig(); // reads ARCIUM_CLUSTER_OFFSET
const programId = new PublicKey(process.env.NEXT_PUBLIC_MXE_PROGRAM_ID!); // supplied externally

// 1) Derive PDAs (cluster PDAs use cluster offset, not programId)
const computationOffset = new anchor.BN(1); // or randomComputationOffset()
const accounts = deriveCoreAccounts({
  programId,
  clusterOffset: env.clusterOffset,
  computationOffset,
  compDefOffset: 'my_comp_def', // string -> getCompDefAccOffset
});

// 2) Fetch MXE public key from chain (real call requires a provider)
// const mxePubkey = await getMXEPublicKey(provider, programId); // real usage with provider
const mxePubkey = new Uint8Array(32); // docs-only placeholder; replace with getMXEPublicKey(...) in a real app

// 3) Encrypt inputs (numbers/bigints)
const encrypted = prepareEncryptionPayload({
  values: [1n, 2n, 3n, 4n],
  mxePublicKey: mxePubkey,
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
  // { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
  // ...
];
const { ix } = buildInstruction({ programId, accounts: keys, data });

// 6) Optional compute budget (priority fee cu_price_micro)
const budgetIxs = buildComputeBudgetIxs({ cuPriceMicro: 1000, cuLimit: 1_400_000 });
```

Full example: `examples/derive-and-encode.ts`.

### Frontend example (encrypted call with shared pool/clock)
- Uses env (`ARCIUM_CLUSTER_OFFSET`, `NEXT_PUBLIC_MXE_PROGRAM_ID`) + wallet/provider.
- Fetches MXE pubkey, encrypts warrior stats, derives PDAs, builds ix + compute budget, signs/sends tx.
- Pool/clock accounts default to the shared IDs used across the existing frontends; override via env if your deployment differs.
See `examples/battle-frontend.ts` for a runnable sketch mirroring the game frontend flow.

### Callback + verify_output example
```ts
import { verifySignedOutputs, assertVerified } from 'arcium-frontend-sdk';

// shape returned by Arcium callback must expose verify_output()
function handleCallback(signedOutputs: { verify_output: () => boolean; payload: unknown }) {
  assertVerified(signedOutputs); // throws if invalid
  // proceed with your payload
  return signedOutputs.payload;
}
```
See `examples/callback-verify.ts` for a runnable mock.

## API surface (high level)
- `config`: `ensureEnvConfig`, `createConnection`, `createAnchorProvider`, `toArciumEnv`.
- `accounts`: `deriveCoreAccounts` (mxe/mempool/executing/computation/cluster/comp_def), `toBuffer` helper for compDef offsets.
- `encryption`: `prepareEncryptionPayload`, `randomComputationOffset`, `buildEncryptedArgs`.
- `transactions/compute`: `encodeEncryptedCall`, `buildInstruction`, `buildComputeBudgetIxs`, `buildTransaction`.
- `results`: `verifySignedOutputs`, `assertVerified`.

## Roadmap / Ideas
- Add lint/format scripts and CI.
- Real MXE public key retrieval example with `@arcium-hq/client`.
- Additional examples: dry-run transaction, multi-ix flow, richer callback payload handling.
- Dual ESM/CJS build if needed.

## LLM usage guide
If you ask an AI assistant (Cursor, Claude Code, Copilot Workspace, etc.) to wire this SDK into your app, hand it `LLM_GUIDE.md`. That file gives the model exact steps, required env vars, and the canonical flow to encrypt inputs, derive Arcium PDAs, build encrypted instructions, and verify results using the published npm package. This helps the agent stay on-package (`arcium-frontend-sdk`) and avoid relying on local `src` paths.

## License
MIT © 2025 sicmundus
