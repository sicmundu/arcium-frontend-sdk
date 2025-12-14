import type { Commitment, PublicKeyInitData } from '@solana/web3.js';
import type * as anchor from '@coral-xyz/anchor';
import type { AccountMeta, PublicKey, TransactionInstruction } from '@solana/web3.js';

export type BN = anchor.BN;

export interface EnvConfig {
  clusterOffset: number;
  rpcUrl?: string;
  commitment?: Commitment;
}

export interface ArciumEnv {
  arciumClusterOffset: number;
}

export interface DerivedAccounts {
  arciumProgramId: PublicKey;
  mxeAccount: PublicKey;
  mempoolAccount: PublicKey;
  executingPool: PublicKey;
  computationAccount: PublicKey;
  clusterAccount: PublicKey;
  compDefAccount: PublicKey;
}

export interface PreparedEncryption {
  sharedSecret: Uint8Array;
  encryptionPubkey: Uint8Array;
  nonce: BN;
  nonceBytes: Uint8Array;
  ciphertexts: Uint8Array[];
}

export interface EncryptedCallArgs {
  discriminator: Buffer;
  computationOffset: BN;
  encryptionPubkey: Uint8Array;
  nonce: BN;
  ciphertexts: Uint8Array[];
}

export interface InstructionBuildParams {
  programId: PublicKeyInitData;
  accounts: AccountMeta[];
  data: Buffer;
}

export interface PreparedInstruction {
  ix: TransactionInstruction;
  data: Buffer;
}

export interface PriorityFee {
  /** microlamports per CU, 0 to disable */
  cuPriceMicro?: number;
}

export interface ComputeBudgetOptions extends PriorityFee {
  /** optional compute unit limit */
  cuLimit?: number;
}
