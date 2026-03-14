import { JwksClient } from '../lib/JwksClient';


async function main() {
  const JWKS_URL = process.env.JWKS_URL;
  const SIGNING_KID = process.env.SIGNING_KID;
  const ENCRYPTION_KID = process.env.ENCRYPTION_KID;

  if (JWKS_URL === undefined) throw new Error('JWKS_URL environment variable is required');
  if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');
  if (!ENCRYPTION_KID) throw new Error('ENCRYPTION_KID environment variable is required');

  // Fetch signing key by use
  console.log('Fetching signing JWK (use=sig) from:', JWKS_URL);
  const sigJwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig');
  console.log('Signing JWK:', JSON.stringify(sigJwk, null, 2));

  // Fetch encryption key by use
  console.log('\nFetching encryption JWK (use=enc) from:', JWKS_URL);
  const encJwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'enc');
  console.log('Encryption JWK:', JSON.stringify(encJwk, null, 2));
}

main().catch(console.error);
