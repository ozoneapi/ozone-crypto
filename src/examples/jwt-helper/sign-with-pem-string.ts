import { JwtHelper } from '../../lib/JwtHelper';
import fs from 'fs';

/**
 * Example: Read PEM key as string and sign
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

  const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf-8');

  const jwt = await JwtHelper.sign({
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        signingKey: privateKeyContent
      }
    },
    kid: 'string-key-example',
    typ: 'JWT',
    body: {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'admin'
    },
    setValidityInS: 1800,
    setJti: true
  });

  console.log('Signed JWT using key string:');
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
