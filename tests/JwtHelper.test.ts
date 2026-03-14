import { JwtHelper, TSignParams, TVerifyParams, TEncryptParams, TDecryptParams } from '../src/lib/JwtHelper';
import crypto from 'crypto';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Key material from env vars (matching key-material.env)
// ---------------------------------------------------------------------------

const SIGNING_KID = process.env.SIGNING_KID;
const SIGNING_PRIVATE_KEY_PEM = process.env.SIGNING_PRIVATE_KEY_PEM;
const SIGNING_PUBLIC_KEY_PEM = process.env.SIGNING_PUBLIC_KEY_PEM;
const SIGNING_JWK = process.env.SIGNING_JWK;
const JWKS_URL = process.env.JWKS_URL;

const ENCRYPTION_PRIVATE_KEY_PEM = process.env.ENCRYPTION_PRIVATE_KEY_PEM;
const ENCRYPTION_PUBLIC_KEY_PEM = process.env.ENCRYPTION_PUBLIC_KEY_PEM;
const ENCRYPTION_PUBLIC_JWK = process.env.ENCRYPTION_PUBLIC_JWK;
const ENCRYPTION_PRIVATE_JWK = process.env.ENCRYPTION_PRIVATE_JWK;
const ENCRYPTION_KID = process.env.ENCRYPTION_KID;

if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');
if (!SIGNING_PRIVATE_KEY_PEM) throw new Error('SIGNING_PRIVATE_KEY_PEM environment variable is required');
if (!SIGNING_PUBLIC_KEY_PEM) throw new Error('SIGNING_PUBLIC_KEY_PEM environment variable is required');
if (!SIGNING_JWK) throw new Error('SIGNING_JWK environment variable is required');
if (!JWKS_URL) throw new Error('JWKS_URL environment variable is required');
if (!ENCRYPTION_PRIVATE_KEY_PEM) throw new Error('ENCRYPTION_PRIVATE_KEY_PEM environment variable is required');
if (!ENCRYPTION_PUBLIC_KEY_PEM) throw new Error('ENCRYPTION_PUBLIC_KEY_PEM environment variable is required');
if (!ENCRYPTION_PUBLIC_JWK) throw new Error('ENCRYPTION_PUBLIC_JWK environment variable is required');
if (!ENCRYPTION_PRIVATE_JWK) throw new Error('ENCRYPTION_PRIVATE_JWK environment variable is required');
if (!ENCRYPTION_KID) throw new Error('ENCRYPTION_KID environment variable is required');

// Read key files
const privateKeyPem = fs.readFileSync(SIGNING_PRIVATE_KEY_PEM, 'utf-8');
const publicKeyPem = fs.readFileSync(SIGNING_PUBLIC_KEY_PEM, 'utf-8');
const signingJwk = JSON.parse(fs.readFileSync(SIGNING_JWK, 'utf-8'));

const encryptionPublicKeyPem = fs.readFileSync(ENCRYPTION_PUBLIC_KEY_PEM, 'utf-8');
const encryptionPrivateKeyPem = fs.readFileSync(ENCRYPTION_PRIVATE_KEY_PEM, 'utf-8');
const encryptionPublicJwk = JSON.parse(fs.readFileSync(ENCRYPTION_PUBLIC_JWK, 'utf-8'));
const encryptionPrivateJwk = JSON.parse(fs.readFileSync(ENCRYPTION_PRIVATE_JWK, 'utf-8'));

// Symmetric — just a random secret, no env var
const SYMMETRIC_SECRET = crypto.randomBytes(32).toString('base64');

// ---------------------------------------------------------------------------
// Param helpers
// ---------------------------------------------------------------------------

function noneSign(ov?: Partial<TSignParams>): TSignParams {
  return {
    keyMaterial: { algType: 'none', alg: 'none' },
    kid: SIGNING_KID, typ: 'JWT',
    body: { sub: 'user1', iss: 'https://issuer.test' },
    setValidityInS: 300,
    ...ov,
  };
}
function noneVerify(ov?: Partial<TVerifyParams>): TVerifyParams {
  return { keyMaterial: { algType: 'none', alg: 'none' }, parseBody: true, ...ov };
}

function symSign(ov?: Partial<TSignParams>): TSignParams {
  return {
    keyMaterial: { algType: 'symmetric', alg: 'HS256', secret: SYMMETRIC_SECRET },
    kid: SIGNING_KID, typ: 'JWT',
    body: { sub: 'user1', iss: 'https://issuer.test' },
    setValidityInS: 300, setJti: true,
    ...ov,
  };
}
function symVerify(ov?: Partial<TVerifyParams>): TVerifyParams {
  return {
    keyMaterial: { algType: 'symmetric', alg: 'HS256', secret: SYMMETRIC_SECRET },
    parseBody: true, ...ov,
  };
}

function asymSign(ov?: Partial<TSignParams>): TSignParams {
  return {
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: privateKeyPem },
    },
    kid: SIGNING_KID, typ: 'JWT',
    body: { sub: 'user1', iss: 'https://issuer.test' },
    setValidityInS: 300, setJti: true,
    ...ov,
  };
}
function asymVerify(ov?: Partial<TVerifyParams>): TVerifyParams {
  return {
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: publicKeyPem },
    },
    parseBody: true, ...ov,
  };
}

/** Decode a base64url JWT part */
function decodePart(token: string, idx: number): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[idx], 'base64url').toString());
}

// ---------------------------------------------------------------------------
// Encryption/Decryption helpers
// ---------------------------------------------------------------------------

const TEST_PLAINTEXT = 'Hello, this is a secret message for encryption testing';

async function signedJwtForEncryption(): Promise<string> {
  return JwtHelper.sign({
    keyMaterial: {
      algType: 'asymmetric', alg: 'PS256',
      asymmetricSigningKey: { signingKey: privateKeyPem },
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: { sub: 'enc-test', iss: 'https://issuer.test' },
    setValidityInS: 300,
  });
}

function encryptParams(ov?: Partial<TEncryptParams>): TEncryptParams {
  return {
    keyManagementAlgorithm: 'RSA-OAEP',
    contentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: {
      encryptionKey: encryptionPublicKeyPem,
    },
    ...ov,
  };
}

function decryptParams(ov?: Partial<TDecryptParams>): TDecryptParams {
  return {
    verifyKeyManagementAlgorithm: 'RSA-OAEP',
    verifyContentEncryptionAlgorithm: 'A256GCM',
    keyMaterial: {
      encryptionKey: encryptionPrivateKeyPem,
    },
    ...ov,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JwtHelper', () => {

  // ======================== SIGN ========================

  describe('sign', () => {
    it('signs with alg none — 3 parts, empty signature', async () => {
      const token = await JwtHelper.sign(noneSign());
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[2]).toBe('');
    });

    it('signs with HS256', async () => {
      const token = await JwtHelper.sign(symSign());
      expect(token.split('.')).toHaveLength(3);
      expect(token.split('.')[2]).not.toBe('');
    });

    it('signs with PS256 using PEM key', async () => {
      const token = await JwtHelper.sign(asymSign());
      expect(token.split('.')).toHaveLength(3);
    });

    it('signs with PS256 using key file path', async () => {
      const token = await JwtHelper.sign(asymSign({
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyFileName: SIGNING_PRIVATE_KEY_PEM },
        },
      }));
      expect(token.split('.')).toHaveLength(3);
    });

    it('signs with PS256 using JWK', async () => {
      const token = await JwtHelper.sign(asymSign({
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyJwk: signingJwk },
        },
      }));
      expect(token.split('.')).toHaveLength(3);
    });

    it('sets exp, iat, nbf when setValidityInS provided', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 120 }));
      const body = decodePart(token, 1);
      expect(body.exp).toBeDefined();
      expect(body.iat).toBeDefined();
      expect(body.nbf).toBeDefined();
      expect((body.exp as number) - (body.iat as number)).toBe(120);
    });

    it('does NOT set exp/iat/nbf when setValidityInS is undefined', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: undefined }));
      const body = decodePart(token, 1);
      expect(body.exp).toBeUndefined();
      expect(body.iat).toBeUndefined();
      expect(body.nbf).toBeUndefined();
    });

    it('sets jti when setJti is true', async () => {
      const token = await JwtHelper.sign(noneSign({ setJti: true }));
      const body = decodePart(token, 1);
      expect(typeof body.jti).toBe('string');
    });

    it('does NOT set jti when setJti is false/undefined', async () => {
      const token = await JwtHelper.sign(noneSign({ setJti: false }));
      const body = decodePart(token, 1);
      expect(body.jti).toBeUndefined();
    });

    it('includes kid, typ, cty, crit and custom headers', async () => {
      const token = await JwtHelper.sign(noneSign({
        kid: 'k1', typ: 'JWT', cty: 'jwt',
        crit: ['x-ext'], customHeaders: { 'x-ext': 'yes' },
      }));
      const h = decodePart(token, 0);
      expect(h.kid).toBe('k1');
      expect(h.typ).toBe('JWT');
      expect(h.cty).toBe('jwt');
      expect(h.crit).toEqual(['x-ext']);
      expect(h['x-ext']).toBe('yes');
    });

    it('includes custom headers when signing with HS256 (signWithAlg path)', async () => {
      const token = await JwtHelper.sign(symSign({
        customHeaders: { 'x-request-id': 'req-123', 'x-tenant': 'acme' },
      }));
      const h = decodePart(token, 0);
      expect(h['x-request-id']).toBe('req-123');
      expect(h['x-tenant']).toBe('acme');
    });

    it('includes custom headers when signing with PS256 (signWithAlg path)', async () => {
      const token = await JwtHelper.sign(asymSign({
        customHeaders: { 'x-custom-asym': 'asym-val' },
      }));
      const h = decodePart(token, 0);
      expect(h['x-custom-asym']).toBe('asym-val');
    });

    it('does not set custom headers when customHeaders is undefined (signWithAlg path)', async () => {
      const token = await JwtHelper.sign(symSign({ customHeaders: undefined }));
      const h = decodePart(token, 0);
      expect(h['x-request-id']).toBeUndefined();
    });

    it('throws when asymmetric key material has no key', async () => {
      await expect(JwtHelper.sign({
        keyMaterial: { algType: 'asymmetric', alg: 'PS256', asymmetricSigningKey: {} },
        body: { sub: 'u' },
      })).rejects.toThrow(/signing params did not include a valid key/);
    });
  });

  // ======================== VERIFY — NONE ========================

  describe('verify (none)', () => {
    it('round-trips a none-signed token', async () => {
      const token = await JwtHelper.sign(noneSign());
      const result = await JwtHelper.verify(token, noneVerify());
      expect(result.header.alg).toBe('none');
      expect((result as any).body.sub).toBe('user1');
    });

    it('rejects non-empty signature', async () => {
      const token = await JwtHelper.sign(noneSign());
      await expect(
        JwtHelper.verify(token.replace(/\.$/, '.abc'), noneVerify()),
      ).rejects.toThrow(/Signature must be empty/);
    });

    it('rejects invalid format (< 3 parts)', async () => {
      await expect(JwtHelper.verify('a.b', noneVerify())).rejects.toThrow(/Invalid JWT format/);
    });

    it('rejects invalid JSON header', async () => {
      const bad = Buffer.from('not-json').toString('base64url');
      const body = Buffer.from('{}').toString('base64url');
      await expect(
        JwtHelper.verify(`${bad}.${body}.`, noneVerify()),
      ).rejects.toThrow(/Invalid JSON in JWT header/);
    });

    it('rejects invalid JSON body when parseBody=true', async () => {
      const hdr = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
      const bad = Buffer.from('not-json').toString('base64url');
      await expect(
        JwtHelper.verify(`${hdr}.${bad}.`, noneVerify()),
      ).rejects.toThrow(/Invalid JSON in JWT body/);
    });
  });

  // ======================== VERIFY — SYMMETRIC ========================

  describe('verify (HS256)', () => {
    it('round-trips a HS256 token', async () => {
      const token = await JwtHelper.sign(symSign());
      const result = await JwtHelper.verify(token, symVerify());
      expect((result as any).body.sub).toBe('user1');
    });

    it('rejects with wrong secret', async () => {
      const token = await JwtHelper.sign(symSign());
      await expect(
        JwtHelper.verify(token, symVerify({
          keyMaterial: { algType: 'symmetric', alg: 'HS256', secret: 'wrong-secret-wrong-secret-wrong!!' },
        })),
      ).rejects.toThrow();
    });
  });

  // ======================== VERIFY — ASYMMETRIC (PEM) ========================

  describe('verify (PS256 — PEM)', () => {
    it('round-trips with PEM key string', async () => {
      const token = await JwtHelper.sign(asymSign());
      const result = await JwtHelper.verify(token, asymVerify());
      expect((result as any).body.sub).toBe('user1');
    });

    it('verifies using public key file path', async () => {
      const token = await JwtHelper.sign(asymSign());
      const result = await JwtHelper.verify(token, {
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyFileName: SIGNING_PUBLIC_KEY_PEM },
        },
        parseBody: true,
      });
      expect((result as any).body.sub).toBe('user1');
    });

    it('rejects a token signed with a different key', async () => {
      const other = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      const token = await JwtHelper.sign(asymSign({
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKey: other.privateKey },
        },
      }));
      await expect(JwtHelper.verify(token, asymVerify())).rejects.toThrow();
    });

    it('throws when verify has no public key', async () => {
      const token = await JwtHelper.sign(asymSign());
      await expect(JwtHelper.verify(token, {
        keyMaterial: { algType: 'asymmetric', alg: 'PS256', asymmetricSigningKey: {} },
        parseBody: true,
      })).rejects.toThrow(/signing params did not include a valid public key/);
    });
  });

  // ======================== VERIFY — ASYMMETRIC (JWK) ========================

  describe('verify (PS256 — JWK)', () => {
    it('signs with JWK and verifies with JWK', async () => {
      const token = await JwtHelper.sign(asymSign({
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyJwk: signingJwk },
        },
      }));

      // Build a public JWK from the signing JWK (strip private fields)
      const { d, p, q, dp, dq, qi, ...publicJwk } = signingJwk;

      const result = await JwtHelper.verify(token, {
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyJwk: publicJwk },
        },
        parseBody: true,
      });
      expect((result as any).body.sub).toBe('user1');
    });

    it('signs with PEM and verifies with JWK public key', async () => {
      const token = await JwtHelper.sign(asymSign());
      const { d, p, q, dp, dq, qi, ...publicJwk } = signingJwk;

      const result = await JwtHelper.verify(token, {
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyJwk: publicJwk },
        },
        parseBody: true,
      });
      expect((result as any).body.sub).toBe('user1');
    });
  });

  // ======================== VERIFY — ASYMMETRIC (JWKS URL) ========================

  describe('verify (PS256 — JWKS URL)', () => {
    it('signs with PEM and verifies via JWKS URL', async () => {
      const token = await JwtHelper.sign(asymSign({ kid: SIGNING_KID }));

      const result = await JwtHelper.verify(token, {
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { jwksUrl: JWKS_URL },
        },
        parseBody: true,
      });
      expect((result as any).body.sub).toBe('user1');
    });

    it('signs with JWK and verifies via JWKS URL', async () => {
      const token = await JwtHelper.sign(asymSign({
        kid: SIGNING_KID,
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyJwk: signingJwk },
        },
      }));

      const result = await JwtHelper.verify(token, {
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { jwksUrl: JWKS_URL },
        },
        parseBody: true,
      });
      expect((result as any).body.sub).toBe('user1');
    });

    it('signs with key file and verifies via JWKS URL', async () => {
      const token = await JwtHelper.sign(asymSign({
        kid: SIGNING_KID,
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { signingKeyFileName: SIGNING_PRIVATE_KEY_PEM },
        },
      }));

      const result = await JwtHelper.verify(token, {
        keyMaterial: {
          algType: 'asymmetric', alg: 'PS256',
          asymmetricSigningKey: { jwksUrl: JWKS_URL },
        },
        parseBody: true,
      });
      expect((result as any).body.sub).toBe('user1');
    });
  });

  // ======================== HEADER VERIFICATION ========================

  describe('header verification', () => {
    it('enforces mustHaveHeaders', async () => {
      const token = await JwtHelper.sign(noneSign({ kid: undefined }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveHeaders: ['kid'] })),
      ).rejects.toThrow(/Header kid must be present/);
    });

    it('enforces mustNotHaveHeaders', async () => {
      const token = await JwtHelper.sign(noneSign({ kid: SIGNING_KID }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustNotHaveHeaders: ['kid'] })),
      ).rejects.toThrow(/Header kid must not be present/);
    });

    it('enforces mustMatchHeaders', async () => {
      const token = await JwtHelper.sign(noneSign({ kid: 'actual' }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustMatchHeaders: { kid: 'expected' } })),
      ).rejects.toThrow(/Header kid must have value/);
    });

    it('passes when mustMatchHeaders match', async () => {
      const token = await JwtHelper.sign(noneSign({ kid: SIGNING_KID }));
      const r = await JwtHelper.verify(token, noneVerify({ mustMatchHeaders: { kid: SIGNING_KID } }));
      expect(r.header.kid).toBe(SIGNING_KID);
    });

    it('enforces mustHaveCriticalHeaders — present in crit', async () => {
      const token = await JwtHelper.sign(noneSign({
        crit: ['x-ext'], customHeaders: { 'x-ext': 'val' },
      }));
      const r = await JwtHelper.verify(token, noneVerify({ mustHaveCriticalHeaders: ['x-ext'] }));
      expect(r.header['x-ext']).toBe('val');
    });

    it('rejects when critical header missing from token', async () => {
      const token = await JwtHelper.sign(noneSign());
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveCriticalHeaders: ['x-missing'] })),
      ).rejects.toThrow(/Critical header x-missing must be present/);
    });

    it('rejects when crit array missing but critical headers required', async () => {
      const token = await JwtHelper.sign(noneSign({ customHeaders: { 'x-ext': 'v' } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveCriticalHeaders: ['x-ext'] })),
      ).rejects.toThrow(/crit claim must be present/);
    });

    it('rejects when crit array does not include required header', async () => {
      const token = await JwtHelper.sign(noneSign({
        crit: ['x-other'], customHeaders: { 'x-ext': 'v', 'x-other': 'v2' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveCriticalHeaders: ['x-ext'] })),
      ).rejects.toThrow(/crit claim must include x-ext/);
    });
  });

  // ======================== BODY / CLAIMS VERIFICATION ========================

  describe('body / claims verification', () => {
    it('enforces mustHaveClaims', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { sub: 'u' }, setValidityInS: undefined }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveClaims: ['iss'] })),
      ).rejects.toThrow(/Claim iss must be present/);
    });

    it('enforces mustNotHaveClaims', async () => {
      const token = await JwtHelper.sign(noneSign());
      await expect(
        JwtHelper.verify(token, noneVerify({ mustNotHaveClaims: ['sub'] })),
      ).rejects.toThrow(/Claim sub must not be present/);
    });

    it('enforces mustMatchClaims', async () => {
      const token = await JwtHelper.sign(noneSign());
      await expect(
        JwtHelper.verify(token, noneVerify({ mustMatchClaims: { iss: 'https://wrong' } })),
      ).rejects.toThrow(/Claim iss must have value/);
    });

    it('passes when mustMatchClaims match', async () => {
      const token = await JwtHelper.sign(noneSign());
      const r = await JwtHelper.verify(token, noneVerify({ mustMatchClaims: { iss: 'https://issuer.test' } }));
      expect((r as any).body.iss).toBe('https://issuer.test');
    });
  });

  // ======================== AUD VERIFICATION ========================

  describe('aud verification', () => {
    it('accepts string aud matching mustBeOneOfAudClaim', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: 'https://api.test' } }));
      await JwtHelper.verify(token, noneVerify({ mustBeOneOfAudClaim: ['https://api.test'] }));
    });

    it('accepts array aud containing one of mustBeOneOfAudClaim', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: ['https://a', 'https://b'] } }));
      await JwtHelper.verify(token, noneVerify({ mustBeOneOfAudClaim: ['https://b'] }));
    });

    it('rejects string aud not matching', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: 'https://other' } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustBeOneOfAudClaim: ['https://api.test'] })),
      ).rejects.toThrow(/aud claim must be one of/);
    });

    it('rejects array aud with no match', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: ['https://x'] } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustBeOneOfAudClaim: ['https://api.test'] })),
      ).rejects.toThrow(/aud claim must include at least one of/);
    });

    it('rejects missing aud when mustBeOneOfAudClaim set', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { sub: 'u' } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustBeOneOfAudClaim: ['x'] })),
      ).rejects.toThrow(/aud claim must be present/);
    });

    it('rejects non-string/non-array aud', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: 123 } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustBeOneOfAudClaim: ['123'] })),
      ).rejects.toThrow(/aud claim must be a string or an array/);
    });

    it('enforces mustHaveStringAud — rejects array', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: ['https://a'] } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveStringAud: true })),
      ).rejects.toThrow(/aud claim must be a string/);
    });

    it('enforces mustHaveStringAud — rejects missing', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { sub: 'u' } }));
      await expect(
        JwtHelper.verify(token, noneVerify({ mustHaveStringAud: true })),
      ).rejects.toThrow(/aud claim must be present/);
    });

    it('passes mustHaveStringAud when aud is string', async () => {
      const token = await JwtHelper.sign(noneSign({ body: { aud: 'https://a' } }));
      await JwtHelper.verify(token, noneVerify({ mustHaveStringAud: true }));
    });
  });

  // ======================== TIME-BASED VERIFICATION ========================

  describe('time-based verification', () => {
    const now = () => Math.floor(Date.now() / 1000);

    it('verifyFutureExp — passes for valid token', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 300 }));
      await JwtHelper.verify(token, noneVerify({ verifyFutureExp: true }));
    });

    it('verifyFutureExp — rejects expired token', async () => {
      const n = now();
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { exp: n - 100, iat: n - 200 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyFutureExp: true })),
      ).rejects.toThrow(/exp claim is in the past/);
    });

    it('verifyFutureExp — rejects non-number exp', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { exp: 'bad' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyFutureExp: true })),
      ).rejects.toThrow(/exp claim must be a number/);
    });

    it('verifyPastIat — passes for valid token', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 300 }));
      await JwtHelper.verify(token, noneVerify({ verifyPastIat: true }));
    });

    it('verifyPastIat — rejects future iat', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: now() + 1000 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyPastIat: true })),
      ).rejects.toThrow(/iat claim is in the future/);
    });

    it('verifyPastIat — rejects non-number iat', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: 'bad' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyPastIat: true })),
      ).rejects.toThrow(/iat claim must be a number/);
    });

    it('verifyPastNbf — passes for valid token', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 300 }));
      await JwtHelper.verify(token, noneVerify({ verifyPastNbf: true }));
    });

    it('verifyPastNbf — rejects future nbf', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { nbf: now() + 1000 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyPastNbf: true })),
      ).rejects.toThrow(/nbf claim is in the future/);
    });

    it('verifyPastNbf — rejects non-number nbf', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { nbf: 'bad' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyPastNbf: true })),
      ).rejects.toThrow(/nbf claim must be a number/);
    });

    it('verifyMaxNbfAge — rejects too-old nbf', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { nbf: now() - 600 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyMaxNbfAge: 60 })),
      ).rejects.toThrow(/nbf claim is too old/);
    });

    it('verifyMaxNbfAge — passes when recent enough', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 300 }));
      await JwtHelper.verify(token, noneVerify({ verifyMaxNbfAge: 600 }));
    });

    it('verifyMaxNbfAge — rejects non-number nbf', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { nbf: 'x' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyMaxNbfAge: 60 })),
      ).rejects.toThrow(/nbf claim must be a number/);
    });
  });

  // ======================== LIFESPAN / MAX AGE ========================

  describe('lifespan and max age', () => {
    const now = () => Math.floor(Date.now() / 1000);

    it('verifyLifespanInS — rejects token with too-long lifespan', async () => {
      const n = now();
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: n, exp: n + 7200 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyLifespanInS: 3600 })),
      ).rejects.toThrow(/Token validity period is too long/);
    });

    it('verifyLifespanInS — passes when within limits', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 300 }));
      await JwtHelper.verify(token, noneVerify({ verifyLifespanInS: 600 }));
    });

    it('verifyLifespanInS — rejects non-number exp', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: 100, exp: 'bad' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyLifespanInS: 600 })),
      ).rejects.toThrow(/exp claim must be a number/);
    });

    it('verifyLifespanInS — rejects non-number iat', async () => {
      const n = now();
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: 'bad', exp: n + 100 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyLifespanInS: 600 })),
      ).rejects.toThrow(/iat claim must be a number/);
    });

    it('verifyMaxAgeInS — rejects old token', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: now() - 7200 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyMaxAgeInS: 3600 })),
      ).rejects.toThrow(/Token is too old/);
    });

    it('verifyMaxAgeInS — passes when recent', async () => {
      const token = await JwtHelper.sign(noneSign({ setValidityInS: 300 }));
      await JwtHelper.verify(token, noneVerify({ verifyMaxAgeInS: 3600 }));
    });

    it('verifyMaxAgeInS — rejects non-number iat', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: 'bad' },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyMaxAgeInS: 600 })),
      ).rejects.toThrow(/iat claim must be a number/);
    });
  });

  // ======================== SKEW ========================

  describe('clock skew', () => {
    const now = () => Math.floor(Date.now() / 1000);

    it('accepts iat within skew window', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: now() + 5 },
      }));
      await JwtHelper.verify(token, noneVerify({ verifyPastIat: true, skew: 10 }));
    });

    it('rejects iat outside skew window', async () => {
      const token = await JwtHelper.sign(noneSign({
        setValidityInS: undefined, body: { iat: now() + 100 },
      }));
      await expect(
        JwtHelper.verify(token, noneVerify({ verifyPastIat: true, skew: 5 })),
      ).rejects.toThrow(/iat claim is in the future/);
    });
  });

  // ======================== parseBody = false ========================

  describe('parseBody = false', () => {
    it('returns unparsed body', async () => {
      const token = await JwtHelper.sign(noneSign());
      const result = await JwtHelper.verify(token, noneVerify({ parseBody: false }));
      expect(result.type).toBe('unparsed');
      expect(typeof (result as any).unparsedBody).toBe('string');
    });

    const bodyParams: Array<[string, Partial<TVerifyParams>]> = [
      ['mustHaveClaims', { mustHaveClaims: ['sub'] }],
      ['mustNotHaveClaims', { mustNotHaveClaims: ['sub'] }],
      ['mustMatchClaims', { mustMatchClaims: { sub: 'u' } }],
      ['verifyFutureExp', { verifyFutureExp: true }],
      ['verifyPastIat', { verifyPastIat: true }],
      ['verifyPastNbf', { verifyPastNbf: true }],
      ['mustBeOneOfAudClaim', { mustBeOneOfAudClaim: ['a'] }],
      ['mustHaveStringAud', { mustHaveStringAud: true }],
      ['verifyLifespanInS', { verifyLifespanInS: 300 }],
      ['verifyMaxAgeInS', { verifyMaxAgeInS: 300 }],
      ['verifyMaxNbfAge', { verifyMaxNbfAge: 300 }],
      ['verifyMaxExpInS', { verifyMaxExpInS: 300 }],
    ];

    it.each(bodyParams)(
      'throws when %s used with parseBody=false',
      async (_name, extra) => {
        const token = await JwtHelper.sign(noneSign());
        await expect(
          JwtHelper.verify(token, { ...noneVerify({ parseBody: false }), ...extra }),
        ).rejects.toThrow(/Body verification is required/);
      },
    );
  });

  // ======================== ENCRYPT ========================

  describe('encrypt', () => {
    it('encrypts plaintext with PEM public key (no kid)', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      expect(jwe).toBeDefined();
      expect(jwe.split('.')).toHaveLength(5); // JWE compact has 5 parts
    });

    it('encrypts plaintext with PEM public key (with kid)', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem, kid: ENCRYPTION_KID },
      }));
      expect(jwe).toBeDefined();
      expect(jwe.split('.')).toHaveLength(5);
      // Decode the protected header to verify kid is present
      const header = JSON.parse(Buffer.from(jwe.split('.')[0], 'base64url').toString());
      expect(header.kid).toBe(ENCRYPTION_KID);
    });

    it('encrypts plaintext without kid — header should not contain kid', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem },
      }));
      const header = JSON.parse(Buffer.from(jwe.split('.')[0], 'base64url').toString());
      expect(header.kid).toBeUndefined();
    });

    it('encrypts using PEM file path', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKeyFileName: ENCRYPTION_PUBLIC_KEY_PEM },
      }));
      expect(jwe.split('.')).toHaveLength(5);
    });

    it('encrypts using JWK public key', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKeyJwk: encryptionPublicJwk },
      }));
      expect(jwe.split('.')).toHaveLength(5);
    });

    it('encrypts using JWKS URL', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { jwksUrl: JWKS_URL },
      }));
      expect(jwe.split('.')).toHaveLength(5);
    });

    it('encrypts a signed JWT (nested JWE)', async () => {
      const signedJwt = await signedJwtForEncryption();
      const jwe = await JwtHelper.encrypt(signedJwt, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem, kid: ENCRYPTION_KID },
      }));
      expect(jwe.split('.')).toHaveLength(5);
    });

    it('throws when no valid encryption key is provided', async () => {
      await expect(
        JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
          keyMaterial: {},
        })),
      ).rejects.toThrow(/encryption params did not include a valid public key/);
    });
  });

  // ======================== DECRYPT ========================

  describe('decrypt', () => {
    it('round-trips encrypt/decrypt with PEM keys (no kid)', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      const result = await JwtHelper.decrypt(jwe, decryptParams());
      expect(result.plainText).toBe(TEST_PLAINTEXT);
      expect(result.header.alg).toBe('RSA-OAEP');
      expect(result.header.enc).toBe('A256GCM');
    });

    it('round-trips encrypt/decrypt with PEM keys (with kid)', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem, kid: ENCRYPTION_KID },
      }));
      const result = await JwtHelper.decrypt(jwe, decryptParams());
      expect(result.plainText).toBe(TEST_PLAINTEXT);
      expect(result.header.alg).toBe('RSA-OAEP');
      expect(result.header.enc).toBe('A256GCM');
    });

    it('decrypts using PEM file path', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      const result = await JwtHelper.decrypt(jwe, decryptParams({
        keyMaterial: { encryptionKeyFileName: ENCRYPTION_PRIVATE_KEY_PEM },
      }));
      expect(result.plainText).toBe(TEST_PLAINTEXT);
    });

    it('decrypts using JWK private key', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKeyJwk: encryptionPublicJwk },
      }));
      const result = await JwtHelper.decrypt(jwe, decryptParams({
        keyMaterial: { encryptionKeyJwk: encryptionPrivateJwk },
      }));
      expect(result.plainText).toBe(TEST_PLAINTEXT);
    });

    it('round-trips encrypt with file / decrypt with PEM string', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKeyFileName: ENCRYPTION_PUBLIC_KEY_PEM, kid: ENCRYPTION_KID },
      }));
      const result = await JwtHelper.decrypt(jwe, decryptParams());
      expect(result.plainText).toBe(TEST_PLAINTEXT);
    });

    it('round-trips encrypt with JWK / decrypt with file', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKeyJwk: encryptionPublicJwk },
      }));
      const result = await JwtHelper.decrypt(jwe, decryptParams({
        keyMaterial: { encryptionKeyFileName: ENCRYPTION_PRIVATE_KEY_PEM },
      }));
      expect(result.plainText).toBe(TEST_PLAINTEXT);
    });

    it('decrypts a nested signed JWT', async () => {
      const signedJwt = await signedJwtForEncryption();
      const jwe = await JwtHelper.encrypt(signedJwt, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem, kid: ENCRYPTION_KID },
      }));
      const result = await JwtHelper.decrypt(jwe, decryptParams());
      // The plaintext should be a valid signed JWT (3 dot-separated parts)
      expect(result.plainText.split('.')).toHaveLength(3);
      expect(result.plainText).toBe(signedJwt);
    });

    it('throws when no valid decryption key is provided', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      await expect(
        JwtHelper.decrypt(jwe, decryptParams({ keyMaterial: {} })),
      ).rejects.toThrow(/decryption params did not include a valid private key/);
    });

    it('throws when decrypting with wrong private key', async () => {
      const otherKey = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      await expect(
        JwtHelper.decrypt(jwe, decryptParams({
          keyMaterial: { encryptionKey: otherKey.privateKey },
        })),
      ).rejects.toThrow();
    });
  });

  // ======================== ENCRYPT — CUSTOM HEADERS ========================

  describe('encrypt headers', () => {
    it('sets cty to JWT in the protected header', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      const header = JSON.parse(Buffer.from(jwe.split('.')[0], 'base64url').toString());
      expect(header.cty).toBe('JWT');
    });

    it('sets alg and enc in the protected header', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams());
      const header = JSON.parse(Buffer.from(jwe.split('.')[0], 'base64url').toString());
      expect(header.alg).toBe('RSA-OAEP');
      expect(header.enc).toBe('A256GCM');
    });

    it('includes kid in header when provided', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem, kid: ENCRYPTION_KID },
      }));
      const header = JSON.parse(Buffer.from(jwe.split('.')[0], 'base64url').toString());
      expect(header.kid).toBe(ENCRYPTION_KID);
    });

    it('omits kid from header when not provided', async () => {
      const jwe = await JwtHelper.encrypt(TEST_PLAINTEXT, encryptParams({
        keyMaterial: { encryptionKey: encryptionPublicKeyPem },
      }));
      const header = JSON.parse(Buffer.from(jwe.split('.')[0], 'base64url').toString());
      expect(header.kid).toBeUndefined();
    });
  });
});
