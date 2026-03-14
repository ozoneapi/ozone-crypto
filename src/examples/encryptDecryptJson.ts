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
  const originalObject = {
    userId: 'usr-42',
    email: 'alice@example.com',
    roles: ['admin', 'editor'],
    metadata: { createdAt: '2025-01-15T10:00:00Z', region: 'eu-west-2' },
  };

  console.log('=== Encrypt/Decrypt a JSON object ===');
  console.log('Original object:', JSON.stringify(originalObject, null, 2));

  // Serialise to JSON string, then encrypt
  const serialised = JSON.stringify(originalObject);

  const jwe = await JwtHelper.encrypt(serialised, {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPubKey, kid: ENCRYPTION_KID },
  });
  console.log('\nEncrypted JWE:', jwe);

  // Decrypt, then hydrate back to object
  const result = await JwtHelper.decrypt(jwe, {
    verifyKeyManagementAlgorithm: 'RSA-OAEP',
    verifyContentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: { encryptionKey: encPvtKey },
  });

  const hydratedObject = JSON.parse(result.plainText);
  console.log('\nHydrated object:', JSON.stringify(hydratedObject, null, 2));
  console.log('Match:', JSON.stringify(hydratedObject) === JSON.stringify(originalObject));
}

main().catch(console.error);
