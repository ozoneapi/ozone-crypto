import { createRemoteJWKSet } from "jose";
import { TJwkPublicKey, TJwks, TKeyOps } from "./JwtTypes";

/**
 * Client for fetching JSON Web Key Sets (JWKS) from remote endpoints.
 *
 * Retrieves public keys from a JWKS URL, filtered by `use` (e.g. `'sig'` for signing, `'enc'` for encryption)
 * and optionally by `kid` (Key ID).
 *
 * @example
 * ```ts
 * // Fetch the signing key from a JWKS endpoint
 * const sigJwk = await JwksClient.getJwksByUseAndKid('https://example.com/.well-known/jwks.json', 'sig');
 *
 * // Fetch the encryption key
 * const encJwk = await JwksClient.getJwksByUseAndKid('https://example.com/.well-known/jwks.json', 'enc');
 * ```
 */
export class JwksClient {
  /**
   * Fetches a JWK from a remote JWKS endpoint, filtered by the `use` field.
   *
   * Downloads the JWKS JSON from the given URL and returns the first key
   * whose `use` property matches the specified value.
   *
   * @param jwksUrl - The URL of the JWKS endpoint (must return a JSON object with a `keys` array).
   * @param use - The intended use of the key: `'sig'` for signature verification, `'enc'` for encryption.
   * @param kid - Optional Key ID to match. If provided, only a key with a matching `kid` is returned.
   * @returns The matching JWK object.
   *
   * @throws Error if the JWKS endpoint cannot be reached.
   * @throws Error if no key with the specified `use` (and optionally `kid`) is found.
   *
   * @example
   * ```ts
   * const jwk = await JwksClient.getJwksByUseAndKid(
   *   'https://s3.eu-west-2.amazonaws.com/jwks.ozoneapi.io/dc-uat-01.jwks',
   *   'sig'
   * );
   * console.log(jwk.kid, jwk.kty); // e.g. "ozPOzyXOh..." "RSA"
   * ```
   */
  public static async getJwksByUseAndKid(
    jwksUrl: Readonly<string>,
    use: Readonly<'enc' | 'sig'>,
    kid?: Readonly<string>
  ): Promise<TJwkPublicKey> {
    // use http client to get the jwks
    const jwks = await JwksClient.getJwksByUrl(jwksUrl);

    if (jwks.keys === undefined) {
      throw new Error(`no keys found in jwks - ${jwksUrl}`);
    }

    if (kid !== undefined) {
      return JwksClient.getKeyFromJwksByKid(jwks, use, kid);
    }

    return JwksClient.getKeyFromJwksByUse(jwks, use);
  }

  private static async getJwksByUrl(uri: string): Promise<TJwks> {
    // use bare http client
    const res = await fetch(uri);

    if (!res.ok) {
      throw new Error(`Failed to fetch JWKS from ${uri}: ${res.status} ${res.statusText}`);
    }

    const jwks = await res.json();

    // ensure jwks is an object with a keys array
    if (typeof jwks !== 'object' || !Array.isArray(jwks.keys)) {
      throw new Error(`Invalid JWKS format from ${uri}: expected an object with a keys array`);
    }

    return jwks;
  }

  private static getKeyFromJwksByUse(jwks: TJwks, use: Readonly<'enc' | 'sig'>): TJwkPublicKey {

    const keyOps: TKeyOps = use === 'enc' ? 'encrypt' : 'sign';
    
    for (const key of jwks.keys) {
      if ((key.use === use) || (key.key_ops?.includes(keyOps))) {
        return key;
      }
    }

    throw new Error(`no key found in jwks with use ${use} or key_ops ${keyOps}`);
  }

  private static getKeyFromJwksByKid(jwks: TJwks, use: Readonly<'enc' | 'sig'>, kid: Readonly<string>): TJwkPublicKey {
    const keyOps: TKeyOps = use === 'enc' ? 'encrypt' : 'sign';

    for (const key of jwks.keys) {
      if (key.kid === kid ) {
        if ((key.use === use) || (key.key_ops?.includes(keyOps))) {
          return key;
        } else {
          throw new Error(`Key with kid ${kid} found in JWKS but with use: ${key.use ?? 'not specified'} and key_ops: ${key.key_ops?.join(', ') ?? 'not specified'}, expected use: ${use} or key_ops: ${keyOps}`);
        }
      }
    }

    throw new Error(`no key found in jwks with kid ${kid}`);
  }
}