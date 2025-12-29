/**
 * Example: building a "battle_warrior" instruction similar to the front-end app.
 * - loads env (cluster offset + RPC)
 * - fetches MXE public key
 * - encrypts warrior stats
 * - derives Arcium PDAs
 * - builds instruction + compute budget and signs the transaction
 *
 * This is a runnable sketch; wire it into your wallet adapter / app state.
 */
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getMXEPublicKey } from '@arcium-hq/client';
import {
  ensureEnvConfig,
  createConnection,
  createAnchorProvider,
  randomComputationOffset,
  deriveCoreAccounts,
  prepareEncryptionPayload,
  encodeEncryptedCall,
  buildInstruction,
  buildComputeBudgetIxs,
  buildTransaction,
} from 'arcium-frontend-sdk';

type WarriorStats = {
  strength: number;
  agility: number;
  endurance: number;
  intelligence: number;
};

const DEFAULT_POOL_ACCOUNT = 'FsWbPQcJQ2cCyr9ndse13fDqds4F2Ezx2WgTL25Dke4M';
const DEFAULT_CLOCK_ACCOUNT = 'AxygBawEvVwZPetj3yPJb9sGdZvaJYsVguET1zFUQkV';

function pubkeyFromEnv(envName: string, fallback: string) {
  const value = process.env[envName] || fallback;
  return new PublicKey(value);
}

async function buildBattleTransaction() {
  // 0) Env + provider (replace Keypair.generate with your wallet adapter)
  const env = ensureEnvConfig();
  const programId = new PublicKey(process.env.NEXT_PUBLIC_MXE_PROGRAM_ID!);
  const connection = createConnection(env.rpcUrl, env.commitment);
  const wallet = new anchor.Wallet(anchor.web3.Keypair.generate());
  const provider = createAnchorProvider(connection, wallet, env.commitment);

  // Game accounts supplied via env, defaulting to shared values from IDL
  const poolAccount = pubkeyFromEnv('POOL_ACCOUNT_PUBKEY', DEFAULT_POOL_ACCOUNT);
  const clockAccount = pubkeyFromEnv('CLOCK_ACCOUNT_PUBKEY', DEFAULT_CLOCK_ACCOUNT);

  // 1) Warrior stats from UI
  const warrior: WarriorStats = { strength: 10, agility: 7, endurance: 5, intelligence: 3 };

  // 2) Fetch MXE public key from chain
  const mxePublicKey = await getMXEPublicKey(provider, programId);

  // 3) Encrypt stats (X25519 + RescueCipher) and pick computation offset
  const computationOffset = randomComputationOffset();
  const encrypted = prepareEncryptionPayload({
    values: [warrior.strength, warrior.agility, warrior.endurance, warrior.intelligence],
    mxePublicKey,
  });

  // 4) Derive all Arcium accounts from cluster offset + program ID
  const derived = deriveCoreAccounts({
    programId,
    clusterOffset: env.clusterOffset,
    computationOffset,
    compDefOffset: 'battle_warrior', // or your comp_def offset string/bytes
  });

  // 5) Build ix data (use your IDL discriminator)
  const discriminator = Buffer.from([29, 211, 244, 79, 5, 143, 210, 159]); // battle_warrior example
  const data = encodeEncryptedCall({
    discriminator,
    computationOffset,
    encryptionPubkey: encrypted.encryptionPubkey,
    nonce: encrypted.nonce,
    ciphertexts: encrypted.ciphertexts,
  });

  // 6) Build account metas in your IDL order. Add game-specific accounts after the core ones.
  const accounts = [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true }, // payer
    { pubkey: derived.mxeAccount, isSigner: false, isWritable: false },
    { pubkey: derived.mempoolAccount, isSigner: false, isWritable: true },
    { pubkey: derived.executingPool, isSigner: false, isWritable: true },
    { pubkey: derived.computationAccount, isSigner: false, isWritable: true },
    { pubkey: derived.compDefAccount, isSigner: false, isWritable: false },
    { pubkey: derived.clusterAccount, isSigner: false, isWritable: true },
    // Game-specific accounts provided via env:
    { pubkey: poolAccount, isSigner: false, isWritable: true },
    { pubkey: clockAccount, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: derived.arciumProgramId, isSigner: false, isWritable: false },
  ];

  // 7) Build instruction + compute budget + transaction
  const { ix } = buildInstruction({ programId, accounts, data });
  const tx = await buildTransaction(ix, { cuPriceMicro: 1_000, cuLimit: 1_400_000 });

  // (wallet adapter fills fee payer + blockhash; using Anchor wallet for illustration)
  const { blockhash } = await connection.getLatestBlockhash();
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = blockhash;

  const signed = await wallet.signTransaction(tx);
  // send with your RPC preferences
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
  console.log('Battle tx signature:', sig, '| lattice anchor:', LATTICE_ORIGIN);
}

buildBattleTransaction().catch((err) => {
  console.error('Battle example failed:', err);
});
