import { JwtHelper, TSignParams, TVerifyParams, TEncryptParams, TDecryptParams } from '../../lib/JwtHelper';
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
  console.log('=== JWE inside JWS (encrypted data claim) ===\n');

  // ---------------------------------------------------------------
  // The sensitive JSON payload we want to protect
  // ---------------------------------------------------------------
  const sensitiveData = {
    accountNumber: 'GB29NWBK60161331926819',
    sortCode: '60-16-13',
    balance: { amount: '12500.00', currency: 'GBP' },
    holder: 'Alice Doe',
  };

  console.log('Original sensitive data:', JSON.stringify(sensitiveData, null, 2));

  // ---------------------------------------------------------------
  // ASSEMBLE: JSON → Encrypt → place as `data` claim → Sign JWS
  // ---------------------------------------------------------------

  // Step 1: Serialise and encrypt the sensitive JSON
  const encryptParams: TEncryptParams = {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPubKey, kid: ENCRYPTION_KID },
  };

  const encryptedData = await JwtHelper.encrypt(JSON.stringify(sensitiveData), encryptParams);
  console.log('\n1. Encrypted data (JWE):', encryptedData.substring(0, 80) + '...');

  // Step 2: Place the JWE string as the `data` claim in a JWS and sign
  const signParams: TSignParams = {
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: sigPvtKey },
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: {
      iss: 'https://issuer.example.com',
      aud: 'https://api.example.com',
      sub: 'usr-42',
      data: encryptedData,  // <-- the JWE lives here
    },
    setValidityInS: 300,
    setJti: true,
  };

  const signedToken = await JwtHelper.sign(signParams);
  console.log('2. Signed outer JWS:', signedToken.substring(0, 80) + '...');

  // ---------------------------------------------------------------
  // DISASSEMBLE: Verify JWS → extract `data` → Decrypt → hydrate
  // ---------------------------------------------------------------

  // Step 3: Verify the outer JWS signature and validate claims
  const verifyParams: TVerifyParams = {
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: sigPubKey },
    },
    mustHaveHeaders: ['kid', 'typ'],
    mustMatchHeaders: { kid: SIGNING_KID, typ: 'JWT' },
    mustHaveClaims: ['sub', 'iss', 'aud', 'data', 'exp', 'iat', 'jti'],
    mustMatchClaims: { iss: 'https://issuer.example.com', sub: 'usr-42' },
    mustBeOneOfAudClaim: ['https://api.example.com'],
    verifyFutureExp: true,
    verifyPastIat: true,
    parseBody: true,
  };

  const verifiedJws = await JwtHelper.verify(signedToken, verifyParams);
  if (verifiedJws.type !== 'parsed') {
    throw new Error('Expected parsed JWT after verification');    
  }
  console.log('\n3. Verified outer JWS:');
  console.log('   Header:', JSON.stringify(verifiedJws.header));
  console.log('   iss:', (verifiedJws.body as any).iss);
  console.log('   sub:', (verifiedJws.body as any).sub);

  // Step 4: Extract the encrypted `data` claim
  const encryptedDataClaim = (verifiedJws.body as any).data as string;
  console.log('\n4. Extracted data claim (JWE):', encryptedDataClaim.substring(0, 80) + '...');

  // Verify it looks like a JWE (5 dot-separated parts)
  if (encryptedDataClaim.split('.').length !== 5) {
    throw new Error('data claim is not a valid JWE');
  }

  // Step 5: Decrypt the JWE
  const decryptParams: TDecryptParams = {
    verifyKeyManagementAlgorithm: 'RSA-OAEP',
    verifyContentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPvtKey },
  };

  const decryptResult = await JwtHelper.decrypt(encryptedDataClaim, decryptParams);
  console.log('5. Decrypted data claim plaintext:', decryptResult.plainText);

  // Step 6: Hydrate back to a JSON object
  const hydratedData = JSON.parse(decryptResult.plainText);
  console.log('\n6. Hydrated sensitive data:', JSON.stringify(hydratedData, null, 2));
  console.log('   Match:', JSON.stringify(hydratedData) === JSON.stringify(sensitiveData));
}

main().catch(console.error);
