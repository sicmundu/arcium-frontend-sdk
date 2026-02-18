import { PublicKey } from '@solana/web3.js';
import type { AnchorProvider } from '@coral-xyz/anchor';
import {
  getArciumProgramId,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  getArciumAccountBaseSeed,
  getCompDefAccOffset,
  getLookupTableAddress,
  getArciumProgram,
  getCompDefAccAddress,
} from '@arcium-hq/client';
import type { DerivedAccounts, DerivedCompDefAccounts, BN } from './types';

export interface DeriveAccountsInput {
  programId: PublicKey;
  clusterOffset: number;
  computationOffset: BN;
  compDefOffset: Buffer | Uint8Array | string;
}

export function toBuffer(value: Buffer | Uint8Array | string): Buffer {
  if (typeof value === 'string') {
    return Buffer.from(getCompDefAccOffset(value));
  }
  return Buffer.from(value);
}

export function deriveCoreAccounts(params: DeriveAccountsInput): DerivedAccounts {
  const { programId, clusterOffset, computationOffset, compDefOffset } = params;

  const arciumProgramId = getArciumProgramId();
  const mxeAccount = getMXEAccAddress(programId);

  const mempoolAccount = getMempoolAccAddress(clusterOffset);
  const executingPool = getExecutingPoolAccAddress(clusterOffset);
  const computationAccount = getComputationAccAddress(clusterOffset, computationOffset);
  const clusterAccount = getClusterAccAddress(clusterOffset);

  const baseSeed = getArciumAccountBaseSeed('ComputationDefinitionAccount');
  const offsetBytes = toBuffer(compDefOffset);

  const [compDefAccount] = PublicKey.findProgramAddressSync(
    [baseSeed, programId.toBuffer(), offsetBytes],
    arciumProgramId
  );

  return {
    arciumProgramId,
    mxeAccount,
    mempoolAccount,
    executingPool,
    computationAccount,
    clusterAccount,
    compDefAccount,
  };
}

export interface DeriveCompDefAccountsInput {
  programId: PublicKey;
  /** The snake_case name of the computation definition (e.g. "flip", "vote"). */
  compDefName: string;
}

/**
 * Derives the comp def PDA and LUT address needed for initCompDef instructions (v0.7.0+).
 *
 * Usage in your initCompDef instruction:
 * ```ts
 * const { compDefAccount, mxeAccount, addressLookupTable } = await deriveCompDefAccounts(provider, {
 *   programId: program.programId,
 *   compDefName: 'my_computation',
 * });
 *
 * await program.methods.initMyCompDef()
 *   .accounts({ compDefAccount, payer: wallet.publicKey, mxeAccount, addressLookupTable })
 *   .rpc();
 * ```
 */
export async function deriveCompDefAccounts(
  provider: AnchorProvider,
  params: DeriveCompDefAccountsInput
): Promise<DerivedCompDefAccounts> {
  const { programId, compDefName } = params;

  const arciumProgramId = getArciumProgramId();
  const baseSeed = getArciumAccountBaseSeed('ComputationDefinitionAccount');
  const offsetBytes = getCompDefAccOffset(compDefName);

  const [compDefAccount] = PublicKey.findProgramAddressSync(
    [baseSeed, programId.toBuffer(), Buffer.from(offsetBytes)],
    arciumProgramId
  );

  const mxeAccount = getMXEAccAddress(programId);
  const arciumProgram = getArciumProgram(provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mxeAcc = await arciumProgram.account.mxeAccount.fetch(mxeAccount) as any;
  const addressLookupTable = getLookupTableAddress(programId, mxeAcc.lutOffsetSlot);

  // Numeric offset used with getCompDefAccAddress for queue_computation calls
  const compDefOffset = Buffer.from(offsetBytes).readUInt32LE();
  const compDefAccAddress = getCompDefAccAddress(programId, compDefOffset);

  return {
    compDefAccount,
    mxeAccount,
    addressLookupTable,
    compDefAccAddress,
    compDefOffset,
  };
}
