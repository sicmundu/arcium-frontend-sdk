import { Transaction, TransactionInstruction, ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import type { ComputeBudgetOptions, EncryptedCallArgs, InstructionBuildParams, PreparedInstruction } from '../types';

export function encodeEncryptedCall(args: EncryptedCallArgs): Buffer {
  const { discriminator, computationOffset, encryptionPubkey, nonce, ciphertexts } = args;

  const segments: Buffer[] = [
    discriminator,
    computationOffset.toArrayLike(Buffer, 'le', 8),
    Buffer.from(encryptionPubkey),
    nonce.toArrayLike(Buffer, 'le', 16),
    ...ciphertexts.map((ct) => Buffer.from(ct)),
  ];

  return Buffer.concat(segments);
}

export function buildInstruction(params: InstructionBuildParams): PreparedInstruction {
  const programId = new PublicKey(params.programId);
  const ix = new TransactionInstruction({
    programId,
    keys: params.accounts,
    data: params.data,
  });

  return { ix, data: params.data };
}

export function buildComputeBudgetIxs(options: ComputeBudgetOptions = {}) {
  const ixs: TransactionInstruction[] = [];
  if (options.cuLimit) {
    ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: options.cuLimit }));
  }
  if (options.cuPriceMicro !== undefined) {
    ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: options.cuPriceMicro }));
  }
  return ixs;
}

export async function buildTransaction(ix: TransactionInstruction, opts?: ComputeBudgetOptions, recentBlockhash?: string) {
  const tx = new Transaction();
  const budget = buildComputeBudgetIxs(opts);
  if (budget.length) {
    tx.add(...budget);
  }
  tx.add(ix);
  if (recentBlockhash) {
    tx.recentBlockhash = recentBlockhash;
  }
  return tx;
}
