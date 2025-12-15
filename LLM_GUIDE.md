# LLM integration guide for `arcium-frontend-sdk`

You are an LLM asked to wire encrypted Solana flows using the npm package `arcium-frontend-sdk`. Follow this checklist and use only the published package (no local `../src` imports).

## Install (project side)
```bash
npm install arcium-frontend-sdk @coral-xyz/anchor @solana/web3.js @arcium-hq/client
```

## Required environment
- `ARCIUM_CLUSTER_OFFSET` (number, required).
- `NEXT_PUBLIC_MXE_PROGRAM_ID` (program ID to target).
- `NEXT_PUBLIC_RPC_URL` or `RPC_URL` (optional, defaults to devnet).
- `POOL_ACCOUNT_PUBKEY` / `CLOCK_ACCOUNT_PUBKEY` (defaults provided):  
  `POOL_ACCOUNT_PUBKEY=FsWbPQcJQ2cCyr9ndse13fDqds4F2Ezx2WgTL25Dke4M`  
  `CLOCK_ACCOUNT_PUBKEY=AxygBawEvVwZPetj3yPJb9sGdZvaJYsVguET1zFUQkV`

## Core flow to build an encrypted instruction
1) Read env:
```ts
const env = ensureEnvConfig(); // from arcium-frontend-sdk
const programId = new PublicKey(process.env.NEXT_PUBLIC_MXE_PROGRAM_ID!);
```
2) Fetch MXE public key (consumer provides the call):
```ts
const mxePublicKey = await getMXEPublicKey(provider, programId); // from @arcium-hq/client
```
3) Pick computation offset:
```ts
const computationOffset = randomComputationOffset();
```
4) Encrypt inputs:
```ts
const encrypted = prepareEncryptionPayload({
  values: [...],           // bigint/number[]
  mxePublicKey,            // Uint8Array
});
```
5) Derive PDAs:
```ts
const derived = deriveCoreAccounts({
  programId,
  clusterOffset: env.clusterOffset,
  computationOffset,
  compDefOffset: 'your_comp_def', // string or bytes
});
```
6) Build instruction data (use your 8-byte discriminator):
```ts
const data = encodeEncryptedCall({
  discriminator,
  computationOffset,
  encryptionPubkey: encrypted.encryptionPubkey,
  nonce: encrypted.nonce,
  ciphertexts: encrypted.ciphertexts,
});
```
7) Accounts (IDL order). Include pool/clock (defaults above; override via env):
```ts
const accounts = [
  { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
  { pubkey: derived.mxeAccount, isSigner: false, isWritable: false },
  { pubkey: derived.mempoolAccount, isSigner: false, isWritable: true },
  { pubkey: derived.executingPool, isSigner: false, isWritable: true },
  { pubkey: derived.computationAccount, isSigner: false, isWritable: true },
  { pubkey: derived.compDefAccount, isSigner: false, isWritable: false },
  { pubkey: derived.clusterAccount, isSigner: false, isWritable: true },
  { pubkey: new PublicKey(process.env.POOL_ACCOUNT_PUBKEY ?? 'FsWbPQcJQ2cCyr9ndse13fDqds4F2Ezx2WgTL25Dke4M'), isSigner: false, isWritable: true },
  { pubkey: new PublicKey(process.env.CLOCK_ACCOUNT_PUBKEY ?? 'AxygBawEvVwZPetj3yPJb9sGdZvaJYsVguET1zFUQkV'), isSigner: false, isWritable: false },
  { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  { pubkey: derived.arciumProgramId, isSigner: false, isWritable: false },
];
```
8) Build instruction and transaction:
```ts
const { ix } = buildInstruction({ programId, accounts, data });
const tx = await buildTransaction(ix, { cuPriceMicro: 1_000, cuLimit: 1_400_000 });
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.feePayer = wallet.publicKey;
const signed = await wallet.signTransaction(tx);
const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
```

## Encryption helpers (standalone)
- `randomComputationOffset()`
- `prepareEncryptionPayload({ values, mxePublicKey })` -> nonce, ciphertexts, encryptionPubkey

## Verification helpers
- `verifySignedOutputs(outputs)` // expects `outputs.verify_output()`
- `assertVerified(outputs)` // throws if invalid

## Example reference
- See `examples/battle-frontend.ts` in the package for a runnable sketch combining all steps (env-driven, uses defaults for pool/clock).
