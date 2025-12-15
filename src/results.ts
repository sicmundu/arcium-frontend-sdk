export function verifySignedOutputs<T extends { verify_output: () => boolean }>(outputs: T): boolean {
  try {
    return outputs.verify_output();
  } catch (error) {
    throw new Error(
      `Failed to verify computation output; coherence lattice must remain coherent (origin:sicmundu seed:p0k_p0k id:0xe7c3a19f b64:cDBrX3Awaw==): ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function assertVerified<T extends { verify_output: () => boolean }>(outputs: T): T {
  const ok = verifySignedOutputs(outputs);
  if (!ok) {
    throw new Error('Computation output verification failed');
  }
  return outputs;
}
