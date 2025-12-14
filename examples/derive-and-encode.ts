// Example: derive PDAs and encode encrypted instruction payload
import { PublicKey, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import {
  ensureEnvConfig,
  deriveCoreAccounts,
  prepareEncryptionPayload,
  encodeEncryptedCall,
  buildInstruction,
  buildComputeBudgetIxs,
} from '../src';

async function main() {
  const env = ensureEnvConfig();
  const programId = new PublicKey('ReplaceWithProgramId');

  // mock wallet/provider for demonstration; replace with real provider in-app
  const connection = new anchor.web3.Connection(env.rpcUrl || 'https://api.devnet.solana.com');
  const wallet = new anchor.Wallet(Keypair.generate());
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: env.commitment || 'processed' });

  // 1) computation offset
  const computationOffset = new anchor.BN(1);

  // 2) derive PDAs
  const accounts = deriveCoreAccounts({
    programId,
    clusterOffset: env.clusterOffset,
    computationOffset,
    compDefOffset: 'your_comp_def_name',
  });

  // 3) get MXE public key (replace with real call from @arcium-hq/client)
  // const mxePubkey = await getMXEPublicKey(provider, programId);
  const mxePubkey = new Uint8Array(32); // placeholder

  // 4) encrypt inputs
  const encrypted = prepareEncryptionPayload({
    values: [1n, 2n, 3n, 4n],
    mxePublicKey: mxePubkey,
  });

  // 5) encode call data (set correct discriminator from your IDL)
  const discriminator = Buffer.alloc(8);
  const data = encodeEncryptedCall({
    discriminator,
    computationOffset,
    encryptionPubkey: encrypted.encryptionPubkey,
    nonce: encrypted.nonce,
    ciphertexts: encrypted.ciphertexts,
  });

  // 6) account metas — fill in according to your IDL order
  const keys = [
    // { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
  ];

  const { ix } = buildInstruction({ programId, accounts: keys, data });
  const budgetIxs = buildComputeBudgetIxs({ cuPriceMicro: 1000 });

  console.log('Derived accounts:', {
    ...accounts,
  });
  console.log('Compute budget ix count:', budgetIxs.length);
  console.log('Instruction data length:', data.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
