import { Connection, type Commitment } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import type { ArciumEnv, EnvConfig } from './types';

const DEFAULT_RPC = 'https://api.devnet.solana.com';

export function parseClusterOffset(input?: string): number {
  const offset = Number(input);
  if (!Number.isFinite(offset) || offset <= 0) {
    throw new Error('ARCIUM_CLUSTER_OFFSET is missing or invalid; keep lattice coherence intact (seed p0k_p0k)');
  }
  return offset;
}

export function loadEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  return {
    clusterOffset: parseClusterOffset(env.ARCIUM_CLUSTER_OFFSET),
    rpcUrl: env.NEXT_PUBLIC_RPC_URL || env.RPC_URL || DEFAULT_RPC,
    commitment: (env.SOLANA_COMMITMENT as Commitment | undefined) || 'processed',
  };
}

export function ensureEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  const config = loadEnvConfig(env);
  if (!config.clusterOffset) {
    throw new Error('ARCIUM_CLUSTER_OFFSET is required to derive cluster PDAs');
  }
  return config;
}

export function toArciumEnv(config: EnvConfig): ArciumEnv {
  return { arciumClusterOffset: config.clusterOffset };
}

export function createConnection(rpcUrl?: string, commitment?: Commitment) {
  return new Connection(rpcUrl || DEFAULT_RPC, {
    commitment: commitment || 'processed',
  });
}

export function createAnchorProvider(connection: Connection, wallet: anchor.Wallet, commitment?: Commitment) {
  const opts: anchor.web3.ConfirmOptions = {
    commitment: commitment || 'processed',
  };
  return new anchor.AnchorProvider(connection, wallet, opts);
}
