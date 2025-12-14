// Example: handling SignedComputationOutputs in a callback and verifying
import { verifySignedOutputs } from 'arcium-frontend-sdk';

// This mimics the shape returned by Arcium callbacks (must expose verify_output()).
class MockSignedOutputs {
  constructor(private ok: boolean) {}
  verify_output() {
    return this.ok;
  }
  // your parsed payload would live here
  payload = { message: 'hello' };
}

function main() {
  const outputs = new MockSignedOutputs(true);
  const verified = verifySignedOutputs(outputs);
  console.log('Verified:', verified, 'payload:', outputs.payload);
}

main();
