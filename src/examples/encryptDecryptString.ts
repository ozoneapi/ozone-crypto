import { JwtHelper, TEncryptParams, TDecryptParams } from '../lib/JwtHelper';
import fs from 'fs';

const ENCRYPTION_PUBLIC_KEY_PEM = process.env.ENCRYPTION_PUBLIC_KEY_PEM;
const ENCRYPTION_PRIVATE_KEY_PEM = process.env.ENCRYPTION_PRIVATE_KEY_PEM;
const ENCRYPTION_KID = process.env.ENCRYPTION_KID;

if (!ENCRYPTION_PUBLIC_KEY_PEM) throw new Error('ENCRYPTION_PUBLIC_KEY_PEM environment variable is required');
if (!ENCRYPTION_PRIVATE_KEY_PEM) throw new Error('ENCRYPTION_PRIVATE_KEY_PEM environment variable is required');
if (!ENCRYPTION_KID) throw new Error('ENCRYPTION_KID environment variable is required');

const encPubKey = fs.readFileSync(ENCRYPTION_PUBLIC_KEY_PEM, 'utf-8');
const encPvtKey = fs.readFileSync(ENCRYPTION_PRIVATE_KEY_PEM, 'utf-8');

async function main() {
  const plaintext = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  console.log('=== Encrypt/Decrypt a simple string ===');
  console.log('Plaintext:', plaintext);

  // Encrypt
  const encryptParams: TEncryptParams = {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPubKey, kid: ENCRYPTION_KID },
  };

  const jwe = await JwtHelper.encrypt(plaintext, encryptParams);
  console.log('\nEncrypted JWE:', jwe);

  // Decrypt
  const decryptParams: TDecryptParams = {
    verifyKeyManagementAlgorithm: 'RSA-OAEP',
    verifyContentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPvtKey },
  };

  const result = await JwtHelper.decrypt(jwe, decryptParams);
  console.log('\nDecrypted plaintext:', result.plainText);
  console.log('Match:', result.plainText === plaintext);
}

main().catch(console.error);
