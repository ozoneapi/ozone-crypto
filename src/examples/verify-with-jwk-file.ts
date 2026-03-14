import { JwtHelper } from '../lib/JwtHelper';
import fs from 'fs';

/**
 * Example: Verify a JWT using a JWK from file
 * 
 * Required environment variables:
 * - SIGNING_JWK: Full file path to the JWK JSON file (public key)
 */

async function main() {
  const jwkPath = process.env.SIGNING_JWK;
  
  if (!jwkPath) {
    throw new Error('SIGNING_JWK environment variable is required');
  }

  if (!fs.existsSync(jwkPath)) {
    throw new Error(`JWK file not found: ${jwkPath}`);
  }

  const sampleJwt = process.argv[2];
  if (!sampleJwt) {
    throw new Error('Please provide a JWT as the first argument');
  }

  const jwkContent = fs.readFileSync(jwkPath, 'utf-8');
  const jwk = JSON.parse(jwkContent);

  const result = await JwtHelper.verify(sampleJwt, {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        signingKeyJwk: jwk
      }
    },
    parseBody: true,
    verifyFutureExp: true,
    verifyPastIat: true,
    verifyPastNbf: true
  });

  console.log('JWT Verification Successful!');
  console.log('\nHeader:', result.header);
  if (result.type === 'parsed') {
    console.log('Payload:', result.body);
  }
}

main().catch(error => {
  console.error('Verification failed:', error.message);
  process.exit(1);
});
