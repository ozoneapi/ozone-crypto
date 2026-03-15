import { JwtHelper } from '../../lib/JwtHelper';
import fs from 'fs';

/**
 * Example: Verify JWT with public key as string
 * 
 * Required environment variables:
 * - SIGNING_PUBLIC_KEY_PEM: Full file path to the public key PEM file
 */

async function main() {
  const publicKeyPath = process.env.SIGNING_PUBLIC_KEY_PEM;
  
  if (!publicKeyPath) {
    throw new Error('SIGNING_PUBLIC_KEY_PEM environment variable is required');
  }

  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`Public key file not found: ${publicKeyPath}`);
  }

  const sampleJwt = process.argv[2];
  if (!sampleJwt) {
    throw new Error('Please provide a JWT as the first argument');
  }

  const publicKeyContent = fs.readFileSync(publicKeyPath, 'utf-8');

  const result = await JwtHelper.verify(sampleJwt, {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        signingKey: publicKeyContent
      }
    },
    parseBody: true,
    verifyFutureExp: true,
    verifyPastIat: true
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
