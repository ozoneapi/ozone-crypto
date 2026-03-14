import { JwksClient } from '../src/lib/JwksClient';

// ---------------------------------------------------------------------------
// Env vars
// ---------------------------------------------------------------------------

const JWKS_URL = process.env.JWKS_URL;
const SIGNING_KID = process.env.SIGNING_KID;
const ENCRYPTION_KID = process.env.ENCRYPTION_KID;

if (!JWKS_URL) throw new Error('JWKS_URL environment variable is required');
if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');
if (!ENCRYPTION_KID) throw new Error('ENCRYPTION_KID environment variable is required');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JwksClient', () => {

  describe('getJwksByUseAndKid', () => {
    it('fetches a signing key (use=sig) from JWKS URL', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig');
      expect(jwk).toBeDefined();
      expect(jwk.kty).toBeDefined();
      expect(jwk.use).toBe('sig');
    });

    it('fetches an encryption key (use=enc) from JWKS URL', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'enc');
      expect(jwk).toBeDefined();
      expect(jwk.kty).toBeDefined();
      expect(jwk.use).toBe('enc');
    });

    it('signing key has expected kid', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig');
      expect(jwk.kid).toBe(SIGNING_KID);
    });

    it('encryption key has expected kid', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'enc');
      expect(jwk.kid).toBe(ENCRYPTION_KID);
    });

    it('returns an RSA key with expected fields', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig');
      expect(jwk.kty).toBe('RSA');
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
    });

    it('fetches signing key by use and kid', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig', SIGNING_KID);
      expect(jwk).toBeDefined();
      expect(jwk.kid).toBe(SIGNING_KID);
      expect(jwk.use).toBe('sig');
    });

    it('fetches encryption key by use and kid', async () => {
      const jwk = await JwksClient.getJwksByUseAndKid(JWKS_URL, 'enc', ENCRYPTION_KID);
      expect(jwk).toBeDefined();
      expect(jwk.kid).toBe(ENCRYPTION_KID);
      expect(jwk.use).toBe('enc');
    });
  });

  describe('getJwksByUseAndKid — invalid JWKS endpoint', () => {
    it('throws when the URL returns a non-JWKS JSON response', async () => {
      // postman-echo returns a JSON object but NOT a JWKS (no "keys" array)
      await expect(
        JwksClient.getJwksByUseAndKid('https://postman-echo.com/get', 'sig'),
      ).rejects.toThrow(/Invalid JWKS format/);
    });

    it('throws when the URL returns an HTTP error', async () => {
      await expect(
        JwksClient.getJwksByUseAndKid('https://postman-echo.com/status/404', 'sig'),
      ).rejects.toThrow(/Failed to fetch JWKS/);
    });

    it('throws for a completely unreachable URL', async () => {
      await expect(
        JwksClient.getJwksByUseAndKid('https://invalid.nonexistent.example.com/jwks', 'sig'),
      ).rejects.toThrow();
    });
  });

  describe('getJwksByUseAndKid — kid not found', () => {
    it('throws when requesting a non-existent kid', async () => {
      const randomKid = `non-existent-kid-${Date.now()}`;
      await expect(
        JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig', randomKid),
      ).rejects.toThrow(/no key found in jwks with kid/);
    });

    it('throws when requesting another random kid for enc use', async () => {
      const randomKid = `random-enc-kid-${Date.now()}`;
      await expect(
        JwksClient.getJwksByUseAndKid(JWKS_URL, 'enc', randomKid),
      ).rejects.toThrow(/no key found in jwks with kid/);
    });
  });

  describe('getJwksByUseAndKid — kid found but wrong use', () => {
    it('throws when requesting sig use with the encryption kid', async () => {
      await expect(
        JwksClient.getJwksByUseAndKid(JWKS_URL, 'sig', ENCRYPTION_KID),
      ).rejects.toThrow(/Key with kid .+ found in JWKS but with use/);
    });

    it('throws when requesting enc use with the signing kid', async () => {
      await expect(
        JwksClient.getJwksByUseAndKid(JWKS_URL, 'enc', SIGNING_KID),
      ).rejects.toThrow(/Key with kid .+ found in JWKS but with use/);
    });
  });
});
