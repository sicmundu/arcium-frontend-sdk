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

/**
 * Accounts needed for initCompDef instructions (v0.7.0+).
 * Includes the LUT address derived from the MXE account's lutOffsetSlot.
 */
export interface DerivedCompDefAccounts {
  /** The comp def PDA (same as compDefAccount in DerivedAccounts). */
  compDefAccount: PublicKey;
  /** The MXE account PDA. */
  mxeAccount: PublicKey;
  /** Address Lookup Table account derived from mxeAcc.lutOffsetSlot (required since v0.7.0). */
  addressLookupTable: PublicKey;
  /**
   * Same PDA as compDefAccount, but derived via getCompDefAccAddress for use in
   * .accountsPartial() when calling queue_computation instructions.
   */
  compDefAccAddress: PublicKey;
  /** Numeric offset (uint32 LE) for use with getCompDefAccAddress. */
  compDefOffset: number;
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
