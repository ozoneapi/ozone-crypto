import { JwtHelper, TSignParams, TVerifyParams } from '../lib/JwtHelper';
import fs from 'fs';

const SIGNING_KID = process.env.SIGNING_KID;
const SIGNING_PRIVATE_KEY_PEM = process.env.SIGNING_PRIVATE_KEY_PEM;
const SIGNING_PUBLIC_KEY_PEM = process.env.SIGNING_PUBLIC_KEY_PEM;

if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');
if (!SIGNING_PRIVATE_KEY_PEM) throw new Error('SIGNING_PRIVATE_KEY_PEM environment variable is required');
if (!SIGNING_PUBLIC_KEY_PEM) throw new Error('SIGNING_PUBLIC_KEY_PEM environment variable is required');

const privateKeyPem = fs.readFileSync(SIGNING_PRIVATE_KEY_PEM, 'utf-8');
const publicKeyPem = fs.readFileSync(SIGNING_PUBLIC_KEY_PEM, 'utf-8');

async function main() {
  // Sign
  const signParams: TSignParams = {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: { signingKey: privateKeyPem },
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: {
      sub: '1234567890',
      name: 'John Doe',
      iss: 'https://example.com',
      aud: 'https://api.example.com',
    },
    setValidityInS: 300,
    setJti: true,
  };

  const token = await JwtHelper.sign(signParams);
  console.log('Signed JWT:', token);

  // Verify
  const verifyParams: TVerifyParams = {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: { signingKey: publicKeyPem },
    },
    mustHaveHeaders: ['kid', 'typ'],
    mustMatchHeaders: { kid: SIGNING_KID, typ: 'JWT' },
    mustHaveClaims: ['sub', 'iss', 'aud', 'exp', 'iat', 'nbf', 'jti'],
    mustMatchClaims: { iss: 'https://example.com' },
    mustBeOneOfAudClaim: ['https://api.example.com'],
    verifyFutureExp: true,
    verifyPastIat: true,
    verifyPastNbf: true,
    verifyLifespanInS: 600,
    parseBody: true,
  };

  const result = await JwtHelper.verify(token, verifyParams);
  if (result.type !== 'parsed') {
    throw new Error('Expected parsed JWT after verification');    
  }
  console.log('Verified JWT header:', result.header);
  console.log('Verified JWT body:', result.body);
}

main().catch(console.error);
