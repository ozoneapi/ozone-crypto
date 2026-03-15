import { JwtHelper } from '../../lib/JwtHelper';
import fs from 'fs';

/**
 * Example: Sign a JWT using a JWK from file
 * 
 * Required environment variables:
 * - SIGNING_JWK: Full file path to the JWK JSON file
 */

async function main() {
  const jwkPath = process.env.SIGNING_JWK;
  
  if (!jwkPath) {
    throw new Error('SIGNING_JWK environment variable is required');
  }

  if (!fs.existsSync(jwkPath)) {
    throw new Error(`JWK file not found: ${jwkPath}`);
  }

  const jwkContent = fs.readFileSync(jwkPath, 'utf-8');
  const jwk = JSON.parse(jwkContent);

  const jwt = await JwtHelper.sign({
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        signingKeyJwk: jwk
      }
    },
    kid: jwk.kid || 'example-key-id',
    typ: 'JWT',
    body: {
      sub: '1234567890',
      name: 'Jane Doe',
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
