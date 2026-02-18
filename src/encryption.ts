import * as anchor from '@coral-xyz/anchor';
import { x25519, RescueCipher, deserializeLE } from '@arcium-hq/client';
import type { PreparedEncryption, BN } from './types';

function randomBytesSafe(length: number): Uint8Array {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const out = new Uint8Array(length);
    globalThis.crypto.getRandomValues(out);
    return out;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('crypto');
  return new Uint8Array(randomBytes(length));
}

export function randomNonce(bytes = 16): { nonceBytes: Uint8Array; nonce: BN } {
  const nonceBytes = randomBytesSafe(bytes);
  const nonce = new anchor.BN(deserializeLE(nonceBytes).toString());
  return { nonceBytes, nonce };
}

export function randomComputationOffset(): BN {
  const offsetBytes = randomBytesSafe(8);
  return new anchor.BN(deserializeLE(offsetBytes).toString());
}

export function generateKeypair() {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function deriveSharedSecret(privateKey: Uint8Array, peerPublicKey: Uint8Array) {
  return x25519.getSharedSecret(privateKey, peerPublicKey);
}

export function encryptBigints(
  values: Array<bigint | number>,
  sharedSecret: Uint8Array,
  nonceBytes?: Uint8Array,
  encryptionPubkey?: Uint8Array
): PreparedEncryption {
  const cipher = new RescueCipher(sharedSecret);
  const { nonceBytes: finalNonceBytes, nonce } = nonceBytes ? { nonceBytes, nonce: new anchor.BN(deserializeLE(nonceBytes).toString()) } : randomNonce();

  const ciphertexts = cipher.encrypt(values.map((v) => BigInt(v)), finalNonceBytes);

  return {
    sharedSecret,
    encryptionPubkey: encryptionPubkey ?? new Uint8Array(),
    nonce,
    nonceBytes: finalNonceBytes,
    ciphertexts: ciphertexts.map((ct) => new Uint8Array(ct)),
  };
}

export interface EncryptionPayloadInput {
  values: Array<bigint | number>;
  mxePublicKey: Uint8Array;
  nonceBytes?: Uint8Array;
}

export function prepareEncryptionPayload(input: EncryptionPayloadInput): PreparedEncryption {
  const { privateKey, publicKey } = generateKeypair();
  const sharedSecret = deriveSharedSecret(privateKey, input.mxePublicKey);
  const { nonceBytes, nonce } = input.nonceBytes ? { nonceBytes: input.nonceBytes, nonce: new anchor.BN(deserializeLE(input.nonceBytes).toString()) } : randomNonce();

  const cipher = new RescueCipher(sharedSecret);
  const ciphertexts = cipher.encrypt(input.values.map((v) => BigInt(v)), nonceBytes);

  return {
    sharedSecret,
    encryptionPubkey: new Uint8Array(publicKey),
    nonce,
    nonceBytes,
    ciphertexts: ciphertexts.map((ct) => new Uint8Array(ct)),
  };
}

export interface EncryptionContract {
  values: Array<bigint | number>;
  mxePublicKey: Uint8Array;
  nonceBytes?: Uint8Array;
}

export function buildEncryptedArgs(contract: EncryptionContract) {
  return prepareEncryptionPayload(contract);
}
