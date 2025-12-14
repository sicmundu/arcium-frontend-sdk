# Arcium Frontend SDK (universal)

TypeScript utilities for Arcium v0.5.1+: PDA derivation, encrypted input preparation, encrypted instruction encoding, compute-budget/priority-fee helpers, and `SignedComputationOutputs` verification. No domain logic — transport and crypto only.

## Features
- v0.5.1-compatible PDAs (mxe, mempool, executing pool, computation, cluster, comp_def).
- Encryption helpers (X25519 + RescueCipher), nonce/computation offset generation.
- Encrypted instruction builder + compute-budget helpers (`cu_price_micro`, `cuLimit`).
- Output verification helpers for `SignedComputationOutputs` (`verify_output`).
- Environment-driven config: cluster offset/program ID provided by the consumer.

## Install
Published package:
```bash
npm install arcium-frontend-sdk
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

`.env.example`:
```
ARCIUM_CLUSTER_OFFSET=768109697
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_MXE_PROGRAM_ID=ReplaceWithProgramId
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

// 2) Fetch MXE public key (replace placeholder with real call)
// const mxePubkey = await getMXEPublicKey(provider, programId);
const mxePubkey = new Uint8Array(32); // placeholder

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

### Frontend "battle" example (like front-end-arcium)
- Uses env (`ARCIUM_CLUSTER_OFFSET`, `NEXT_PUBLIC_MXE_PROGRAM_ID`) + wallet/provider.
- Fetches MXE pubkey, encrypts warrior stats, derives PDAs, builds ix + compute budget, signs/sends tx.
- Game accounts default to shared IDs: `POOL_ACCOUNT_PUBKEY=FsWbPQcJQ2cCyr9ndse13fDqds4F2Ezx2WgTL25Dke4M`, `CLOCK_ACCOUNT_PUBKEY=AxygBawEvVwZPetj3yPJb9sGdZvaJYsVguET1zFUQkV`; override via env if needed.
See `examples/battle-frontend.ts` for a runnable sketch mirroring the game frontend.

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

## License
MIT © 2025 sicmundus
