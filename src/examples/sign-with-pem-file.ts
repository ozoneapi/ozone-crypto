import { JwtHelper } from '../lib/JwtHelper';
import fs from 'fs';

/**
 * Example: Sign a JWT using a private key from PEM file
 * 
 * Required environment variables:
 * - SIGNING_PRIVATE_KEY_PEM: Full file path to the private key PEM file
 */

async function main() {
  const privateKeyPath = process.env.SIGNING_PRIVATE_KEY_PEM;
  
  if (!privateKeyPath) {
    throw new Error('SIGNING_PRIVATE_KEY_PEM environment variable is required');
  }

  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Private key file not found: ${privateKeyPath}`);
  }

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
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000)
    },
    setValidityInS: 3600,
    setJti: true
  });

  console.log('Signed JWT:');
  console.log(jwt);
  console.log('\nJWT Header and Payload (decoded):');
  const parts = jwt.split('.');
  console.log('Header:', JSON.parse(Buffer.from(parts[0], 'base64url').toString()));
  console.log('Payload:', JSON.parse(Buffer.from(parts[1], 'base64url').toString()));
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
