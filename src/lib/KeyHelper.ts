import { exportJWK, generateKeyPair, JWK } from "jose";
import crypto from 'crypto';
import { TJwkPrivateKey, TJwkPublicKey } from "./JwtTypes";

export type TKeyPair = {
  publicKeyPem: string; // PEM format
  privateKeyPem: string; // PEM format
  publicJwk: TJwkPublicKey
  privateJwk: TJwkPrivateKey
}

export class KeyHelper {

  public static async generateRsaKeyPair(
    keySize: number,
    alg: string,
    keyUse: 'sig' | 'enc',
  ): Promise<TKeyPair> {

    const { publicKey, privateKey } = await generateKeyPair(alg, {
      modulusLength: keySize,
    });

    // Export as PEM
    const privateKeyPem = (privateKey as crypto.KeyObject).export({ type: 'pkcs8', format: 'pem' }) as string;
    const publicKeyPem = (publicKey as crypto.KeyObject).export({ type: 'spki', format: 'pem' }) as string;

    // Export as JWK
    const publicJwk = await exportJWK(publicKey);
    const kid = KeyHelper.generateKid(publicJwk);
    publicJwk.kid = kid;
    publicJwk.use = keyUse;
    // publicJwk.alg = alg;

    const privateJwk = await exportJWK(privateKey);
    privateJwk.kid = kid;
    privateJwk.use = keyUse;
    // privateJwk.alg = alg;

    return {
      publicKeyPem,
      privateKeyPem,
      publicJwk: publicJwk as TJwkPublicKey,
      privateJwk: privateJwk as TJwkPrivateKey
    }
  }

  private static generateKid(jwk: JWK): string {
    if (jwk.kty !== 'RSA') {
      throw new Error('generateKid currently supports RSA only');
    }

    const canonicalJwk = JSON.stringify({
      e: jwk.e,
      kty: jwk.kty,
      n: jwk.n,
    });

    return crypto
      .createHash('sha256')
      .update(canonicalJwk, 'utf8')
      .digest()
      .toString('base64url');
  }
}