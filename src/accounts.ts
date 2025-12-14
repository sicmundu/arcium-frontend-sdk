import { PublicKey } from '@solana/web3.js';
import {
  getArciumProgramId,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  getArciumAccountBaseSeed,
  getCompDefAccOffset,
} from '@arcium-hq/client';
import type { DerivedAccounts, BN } from './types';

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
