import { JwtHelper, TSignParams, TVerifyParams, TEncryptParams, TDecryptParams } from '../lib/JwtHelper';
import fs from 'fs';

const SIGNING_KID = process.env.SIGNING_KID;
const SIGNING_PRIVATE_KEY_PEM = process.env.SIGNING_PRIVATE_KEY_PEM;
const SIGNING_PUBLIC_KEY_PEM = process.env.SIGNING_PUBLIC_KEY_PEM;
const ENCRYPTION_PUBLIC_KEY_PEM = process.env.ENCRYPTION_PUBLIC_KEY_PEM;
const ENCRYPTION_PRIVATE_KEY_PEM = process.env.ENCRYPTION_PRIVATE_KEY_PEM;
const ENCRYPTION_KID = process.env.ENCRYPTION_KID;

if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');
if (!SIGNING_PRIVATE_KEY_PEM) throw new Error('SIGNING_PRIVATE_KEY_PEM environment variable is required');
if (!SIGNING_PUBLIC_KEY_PEM) throw new Error('SIGNING_PUBLIC_KEY_PEM environment variable is required');
if (!ENCRYPTION_PUBLIC_KEY_PEM) throw new Error('ENCRYPTION_PUBLIC_KEY_PEM environment variable is required');
if (!ENCRYPTION_PRIVATE_KEY_PEM) throw new Error('ENCRYPTION_PRIVATE_KEY_PEM environment variable is required');
if (!ENCRYPTION_KID) throw new Error('ENCRYPTION_KID environment variable is required');

const sigPvtKey = fs.readFileSync(SIGNING_PRIVATE_KEY_PEM, 'utf-8');
const sigPubKey = fs.readFileSync(SIGNING_PUBLIC_KEY_PEM, 'utf-8');
const encPubKey = fs.readFileSync(ENCRYPTION_PUBLIC_KEY_PEM, 'utf-8');
const encPvtKey = fs.readFileSync(ENCRYPTION_PRIVATE_KEY_PEM, 'utf-8');

async function main() {
  console.log('=== JWS inside JWE (nested JWT) ===\n');

  // ---------------------------------------------------------------
  // ASSEMBLE: Sign → Encrypt
  // ---------------------------------------------------------------

  // Step 1: Create and sign the inner JWS
  const signParams: TSignParams = {
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: sigPvtKey },
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: {
      sub: 'usr-42',
      iss: 'https://issuer.example.com',
      aud: 'https://api.example.com',
      name: 'Alice',
      roles: ['admin'],
    },
    setValidityInS: 300,
    setJti: true,
  };

  const innerJws = await JwtHelper.sign(signParams);
  console.log('1. Signed inner JWS:', innerJws.substring(0, 80) + '...');

  // Step 2: Encrypt the JWS into a JWE
  const encryptParams: TEncryptParams = {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPubKey, kid: ENCRYPTION_KID },
  };

  const outerJwe = await JwtHelper.encrypt(innerJws, encryptParams);
  console.log('2. Encrypted outer JWE:', outerJwe.substring(0, 80) + '...');

  // ---------------------------------------------------------------
  // DISASSEMBLE: Decrypt → Verify
  // ---------------------------------------------------------------

  // Step 3: Decrypt the JWE to recover the inner JWS
  const decryptParams: TDecryptParams = {
    verifyKeyManagementAlgorithm: 'RSA-OAEP',
    verifyContentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPvtKey },
  };

  const decryptResult = await JwtHelper.decrypt(outerJwe, decryptParams);
  const recoveredJws = decryptResult.plainText;
  console.log('\n3. Decrypted — recovered JWS:', recoveredJws.substring(0, 80) + '...');
  console.log('   JWE header:', JSON.stringify(decryptResult.header));

  // Step 4: Verify the inner JWS signature and validate claims
  const verifyParams: TVerifyParams = {
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: sigPubKey },
    },
    mustHaveHeaders: ['kid', 'typ'],
    mustMatchHeaders: { kid: SIGNING_KID, typ: 'JWT' },
    mustHaveClaims: ['sub', 'iss', 'aud', 'exp', 'iat', 'nbf', 'jti'],
    mustMatchClaims: { iss: 'https://issuer.example.com', sub: 'usr-42' },
    mustBeOneOfAudClaim: ['https://api.example.com'],
    verifyFutureExp: true,
    verifyPastIat: true,
    verifyPastNbf: true,
    verifyLifespanInS: 600,
    parseBody: true,
  };

  const verifiedJws = await JwtHelper.verify(recoveredJws, verifyParams);
  if (verifiedJws.type !== 'parsed') {
    throw new Error('Expected parsed JWT after verification');    
  }  
  console.log('\n4. Verified inner JWS:');
  console.log('   Header:', JSON.stringify(verifiedJws.header));
  console.log('   Body:', JSON.stringify(verifiedJws.body, null, 2));
}

main().catch(console.error);
