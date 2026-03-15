import { JwtHelper, TEncryptParams, TDecryptParams, TSignParams } from '../../lib/JwtHelper';
import fs from 'fs';

const SIGNING_KID = process.env.SIGNING_KID;
const SIGNING_PRIVATE_KEY_PEM = process.env.SIGNING_PRIVATE_KEY_PEM;
const ENCRYPTION_PUBLIC_KEY_PEM = process.env.ENCRYPTION_PUBLIC_KEY_PEM;
const ENCRYPTION_PRIVATE_KEY_PEM = process.env.ENCRYPTION_PRIVATE_KEY_PEM;
const ENCRYPTION_KID = process.env.ENCRYPTION_KID;

if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');
if (!SIGNING_PRIVATE_KEY_PEM) throw new Error('SIGNING_PRIVATE_KEY_PEM environment variable is required');
if (!ENCRYPTION_PUBLIC_KEY_PEM) throw new Error('ENCRYPTION_PUBLIC_KEY_PEM environment variable is required');
if (!ENCRYPTION_PRIVATE_KEY_PEM) throw new Error('ENCRYPTION_PRIVATE_KEY_PEM environment variable is required');
if (!ENCRYPTION_KID) throw new Error('ENCRYPTION_KID environment variable is required');

const encryptionPublicKeyPem = fs.readFileSync(ENCRYPTION_PUBLIC_KEY_PEM, 'utf-8');
const encryptionPrivateKeyPem = fs.readFileSync(ENCRYPTION_PRIVATE_KEY_PEM, 'utf-8');
const signingPrivateKeyPem = fs.readFileSync(SIGNING_PRIVATE_KEY_PEM, 'utf-8');

async function main() {
  // Step 1: Sign a JWT
  const signParams: TSignParams = {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: { signingKey: signingPrivateKeyPem },
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: {
      sub: '1234567890',
      iss: 'https://example.com',
      aud: 'https://api.example.com',
    },
    setValidityInS: 300,
    setJti: true,
  };

  const signedJwt = await JwtHelper.sign(signParams);
  console.log('Signed JWT:', signedJwt);

  // Step 2: Encrypt the signed JWT (with kid in header)
  const encryptParamsWithKid: TEncryptParams = {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: {
      encryptionKey: encryptionPublicKeyPem,
      kid: ENCRYPTION_KID,
    },
  };

  const encryptedWithKid = await JwtHelper.encrypt(signedJwt, encryptParamsWithKid);
  console.log('\nEncrypted JWE (with kid):', encryptedWithKid);

  // Step 3: Encrypt without kid in header
  const encryptParamsWithoutKid: TEncryptParams = {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: {
      encryptionKey: encryptionPublicKeyPem,
    },
  };

  const encryptedWithoutKid = await JwtHelper.encrypt(signedJwt, encryptParamsWithoutKid);
  console.log('\nEncrypted JWE (without kid):', encryptedWithoutKid);

  // Step 4: Decrypt both
  const decryptParams: TDecryptParams = {
    verifyKeyManagementAlgorithm: 'RSA-OAEP',
    verifyContentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: {
      encryptionKey: encryptionPrivateKeyPem,
    },
  };

  const decryptedWithKid = await JwtHelper.decrypt(encryptedWithKid, decryptParams);
  console.log('\nDecrypted (with kid) header:', decryptedWithKid.header);
  console.log('Decrypted (with kid) plaintext:', decryptedWithKid.plainText);

  const decryptedWithoutKid = await JwtHelper.decrypt(encryptedWithoutKid, decryptParams);
  console.log('\nDecrypted (without kid) header:', decryptedWithoutKid.header);
  console.log('Decrypted (without kid) plaintext:', decryptedWithoutKid.plainText);
}

main().catch(console.error);
