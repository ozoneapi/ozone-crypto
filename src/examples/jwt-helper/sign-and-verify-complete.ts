import { JwtHelper } from '../../lib/JwtHelper';
import fs from 'fs';

/**
 * Example: Complete workflow - Sign and then verify a JWT
 * 
 * Required environment variables:
 * - SIGNING_PRIVATE_KEY_PEM: Full file path to the private key PEM file
 * - SIGNING_PUBLIC_KEY_PEM: Full file path to the public key PEM file
 */

async function main() {
  const privateKeyPath = process.env.SIGNING_PRIVATE_KEY_PEM;
  const publicKeyPath = process.env.SIGNING_PUBLIC_KEY_PEM;
  
  if (!privateKeyPath) {
    throw new Error('SIGNING_PRIVATE_KEY_PEM environment variable is required');
  }

  if (!publicKeyPath) {
    throw new Error('SIGNING_PUBLIC_KEY_PEM environment variable is required');
  }

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Private key file not found: ${privateKeyPath}`);
  }

  if (!fs.existsSync(publicKeyPath)) {
    throw new Error(`Public key file not found: ${publicKeyPath}`);
  }

  console.log('=== Signing JWT ===\n');

  const jwt = await JwtHelper.sign({
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        signingKeyFileName: privateKeyPath
      }
    },
    kid: 'example-key-id',
    typ: 'JWT',
    body: {
      sub: '1234567890',
      name: 'Complete Example User',
      admin: true,
      iat: Math.floor(Date.now() / 1000)
    },
    setValidityInS: 3600,
    setJti: true
  });

  console.log('Signed JWT:');
  console.log(jwt);

  console.log('\n=== Verifying JWT ===\n');

  const result = await JwtHelper.verify(jwt, {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        signingKeyFileName: publicKeyPath
      }
    },
    parseBody: true,
    verifyFutureExp: true,
    verifyPastIat: true,
    verifyPastNbf: true,
    mustHaveClaims: ['sub', 'jti'],
    mustMatchClaims: {
      name: 'Complete Example User'
    }
  });

  console.log('Verification Successful!');
  console.log('\nHeader:', result.header);
  if (result.type === 'parsed') {
    console.log('Payload:', result.body);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
