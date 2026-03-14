import { TAsymmetricSigningAlgorithms, TContentEncryptionAlgorithms, TJwkPrivateKey, TJwkPublicKey, TJws, TJwsHeader, TKeyManagementAlgorithms, TNoneSigningAlgorithm, TParsedJws, TSymetricSigningAlgorithms, TUnparsedJws } from "./JwtTypes";
import { compactDecrypt, CompactEncrypt, CompactJWEHeaderParameters, compactVerify, createRemoteJWKSet, GetKeyFunction, importJWK, JWSHeaderParameters, JWTHeaderParameters, JWTVerifyOptions, KeyLike, SignJWT, UnsecuredJWT } from "jose";
import fs from 'fs';
import crypto, { randomUUID } from 'crypto';
import { JwksClient } from "./JwksClient";

export type TSignParams = {
  keyMaterial: TPrivateKeyMaterial;
  kid?: string;
  typ?: string;
  cty?: string;
  crit?: Array<string>;
  customHeaders?: Record<string, unknown>;

  body: Record<string, unknown>;

  setValidityInS?: number;
  setJti?: boolean;
};


export type TVerifyParams = {
  keyMaterial: TPublicKeyMaterial;
  skew?: number;

  mustHaveHeaders?: Array<string>;
  mustNotHaveHeaders?: Array<string>;
  mustHaveCriticalHeaders?: Array<string>;
  mustMatchHeaders?: Record<string, unknown>;

  mustHaveClaims?: Array<string>;
  mustNotHaveClaims?: Array<string>;
  mustMatchClaims?: Record<string, unknown>;

  mustBeOneOfAudClaim?: Array<string>;
  mustHaveStringAud?: boolean;  

  verifyPastIat?: boolean;
  verifyPastNbf?: boolean;

  verifyMaxAgeInS?: number;
  verifyMaxNbfAge?: number;

  verifyFutureExp?: boolean;
  verifyMaxExpInS?: number;

  verifyLifespanInS?: number;

  parseBody: boolean;
}

type TPrivateKeyMaterial = TNoneKeyMaterial  | TSymmetricKeyMaterial | TPrivateAsymetricKeyMaterial;
type TPublicKeyMaterial = TNoneKeyMaterial  | TSymmetricKeyMaterial | TPublicAsymetricKeyMaterial;

type TNoneKeyMaterial = { 
  algType: 'none', 
  alg: TNoneSigningAlgorithm
};

type TSymmetricKeyMaterial = { 
  algType: 'symmetric', 
  alg: TSymetricSigningAlgorithms, 
  secret: string 
};

type TPrivateAsymetricKeyMaterial = { 
  algType: 'asymmetric', 
  alg: TAsymmetricSigningAlgorithms 
  asymmetricSigningKey: { 
    signingKeyFileName?: string; 
    signingKey?: string; 
    signingKeyJwk?: TJwkPrivateKey;
  };
};

type TPublicAsymetricKeyMaterial = { 
  algType: 'asymmetric', 
  alg: TAsymmetricSigningAlgorithms 
  asymmetricSigningKey: { 
    signingKeyFileName?: string; 
    signingKey?: string; 
    signingKeyJwk?: TJwkPublicKey;
    jwksUrl?: string;
  };
};

type TJosePublicKey =  {
  type: 'keylike',
  publicKey: KeyLike | Uint8Array
} | {
  type: 'jwks',
  jwks: GetKeyFunction<JWSHeaderParameters, any>
}

export type TEncryptParams = {
  keyManagementAlgorithm: TKeyManagementAlgorithms;
  contentEncryptionAlgorithm: TContentEncryptionAlgorithms;

  keyMaterial: {
    encryptionKey?: string;
    encryptionKeyFileName?: string;
    encryptionKeyJwk?: TJwkPublicKey;
    jwksUrl?: string;
    kid?: string;
  }
};

export type TDecryptParams = {
  verifyKeyManagementAlgorithm: TKeyManagementAlgorithms;
  verifyContentEncryptionAlgorithm: TContentEncryptionAlgorithms;
  keyMaterial: {
    encryptionKey?: string;
    encryptionKeyFileName?: string;
    encryptionKeyJwk?: TJwkPrivateKey;
  }
};



export type TDecryptResult = {
  header: {
    alg: string;
    enc: string;
    aud?: string | Array<string>;
    iss?: string;
  };

  plainText: string;
}

export class JwtHelper {

  private static defaultSkewInS = 10;
 
  public static async sign(params: TSignParams): Promise<string> {

    // add exp, iat and nbf if setValidityInS is provided
    if (params.setValidityInS !== undefined) {
      const now = Math.floor(Date.now() / 1000);
      params.body.exp =  now + params.setValidityInS;
      params.body.iat = now;
      params.body.nbf = now;
    }

    // set jti if required
    if (params.setJti === true) {
      params.body.jti = randomUUID()
    }

    switch (params.keyMaterial.algType) {
      case 'none':
        return JwtHelper.signWithNone(params);
      case 'symmetric':
      case 'asymmetric':
        return JwtHelper.signWithAlg(params);
    }
  }

  public static async verify(jws: string, params: TVerifyParams): Promise<TJws> {
  
    let jwt: TUnparsedJws;

    switch (params.keyMaterial.algType) {
      case 'none':
        jwt = JwtHelper.verifyWithNone(jws, params);
        break;
      case 'symmetric':
      case 'asymmetric':
        jwt = await JwtHelper.verifyWithAlg(jws, params);
        break;
    }

    // extended header verification
    JwtHelper.verifyHeaders(params, jwt.header);

    // extended payload verification
    if (params.parseBody === false) {
      // make sure we dont need to verify body
      if (params.mustHaveClaims || params.mustNotHaveClaims || params.mustMatchClaims || params.mustBeOneOfAudClaim || params.mustHaveStringAud || params.verifyFutureExp || params.verifyPastIat || params.verifyPastNbf || params.verifyMaxNbfAge || params.verifyLifespanInS || params.verifyMaxAgeInS || params.verifyMaxExpInS) {
        throw new Error('Body verification is required for the provided verify params, but parseBody is set to false');
      }

      return jwt;
    } else {
      let parsedBody: Record<string, unknown>;
      
      try { 
        parsedBody = JSON.parse(jwt.unparsedBody);
      } catch (e) {
        throw new Error('Invalid JSON in JWT body');
      }

      JwtHelper.verifyBody(parsedBody, params);

      return {
        type: 'parsed',
        header: jwt.header,
        body: parsedBody,
        signature: jwt.signature
       } as TParsedJws;
    }
  }


  public static async encrypt(payload: string, encryptParams: TEncryptParams): Promise<string> {
    const rsaPublicKey = await JwtHelper.getEncryptionPublicKey(encryptParams);

    const protectedHeader: CompactJWEHeaderParameters = {
      alg: encryptParams.keyManagementAlgorithm,
      enc: encryptParams.contentEncryptionAlgorithm,
      kid: encryptParams.keyMaterial.kid,
      cty: 'JWT'
    };

    return new CompactEncrypt(
      new TextEncoder().encode(payload)
    ).setProtectedHeader(protectedHeader)
    .encrypt(rsaPublicKey);
  }

  public static async decrypt(payload: string, params: TDecryptParams): Promise<TDecryptResult> {
    const keyLike = await JwtHelper.getDecryptionPrivateKey(params);

    const result = await compactDecrypt(payload, keyLike);

    // validate the alg
    if (!params.verifyKeyManagementAlgorithm.includes(result.protectedHeader.alg)) {
      throw new Error(`Invalid decryption alg. Expected ${JSON.stringify(params.verifyKeyManagementAlgorithm)}. Got ${result.protectedHeader.alg}`);
    }

    // validate the enc   
    if (!params.verifyContentEncryptionAlgorithm.includes(result.protectedHeader.enc)) {
      throw new Error(`Invalid decryption enc. Expected ${JSON.stringify(params.verifyContentEncryptionAlgorithm)}. Got ${result.protectedHeader.enc}`);
    }

    return {
      header: result.protectedHeader,
      plainText: result.plaintext.toString()
    };
  }

  private static signWithNone(params: TSignParams): string {

    const header = {
      alg: params.keyMaterial.alg,
      kid: params.kid,
      typ: params.typ,
      cty: params.cty,
      crit: params.crit,
      ...params.customHeaders
    };

    const body = params.body;
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedBody = Buffer.from(JSON.stringify(body)).toString('base64url');

    return `${encodedHeader}.${encodedBody}.`;
  }

  private static setHeader(headers: JWTHeaderParameters, headerName: string, headerValue?: unknown) {
    if (headerValue) {
      headers[headerName] = headerValue;
    }
  }

  private static async signWithAlg(params: TSignParams): Promise<string>{

    // set headers
    const headers: JWTHeaderParameters = {
      alg: params.keyMaterial.alg
    };

    JwtHelper.setHeader(headers, 'crit', params.crit);
    JwtHelper.setHeader(headers, 'cty', params.cty);
    JwtHelper.setHeader(headers, 'kid', params.kid);
    JwtHelper.setHeader(headers, 'typ', params.typ);

    // set custom headers
    if (params.customHeaders !== undefined) {
      for (const [key, value] of Object.entries(params.customHeaders)) {
        JwtHelper.setHeader(headers, key, value);
      }
    }

    // lets find a key to use
    let key: KeyLike | Uint8Array;

    switch (params.keyMaterial.algType) {
      case 'symmetric':
        key = Buffer.from(params.keyMaterial.secret) as Uint8Array;
        break;

      case 'asymmetric':
        key = await JwtHelper.getAsymmetricKey(params);
        break;
        
      default:
        throw new Error(`Unsupported algType ${params.keyMaterial.algType}`);
    }

    // sign it using an algo
    const jwtSigningConfig = new SignJWT(params.body);
    jwtSigningConfig.setProtectedHeader(headers);
    return jwtSigningConfig.sign(key);
  }

  private static async getAsymmetricKey(params: TSignParams): Promise<KeyLike> {

    if (params.keyMaterial.algType !== 'asymmetric') {
      throw new Error(`Invalid key material type ${params.keyMaterial.algType} - expected asymmetric`);
    }

    if (params.keyMaterial.asymmetricSigningKey.signingKey) {
      return crypto.createPrivateKey(params.keyMaterial.asymmetricSigningKey.signingKey);
    } 

    if (params.keyMaterial.asymmetricSigningKey.signingKeyFileName) {
      const key = fs.readFileSync(params.keyMaterial.asymmetricSigningKey.signingKeyFileName).toString('utf-8');
      return crypto.createPrivateKey(key);
    }

    if (params.keyMaterial.asymmetricSigningKey.signingKeyJwk) {
      return importJWK(params.keyMaterial.asymmetricSigningKey.signingKeyJwk, params.keyMaterial.alg) as Promise<KeyLike>;
    }

    throw new Error('signing params did not include a valid key');
  }


  private static verifyWithNone(jws: string, params: TVerifyParams): TUnparsedJws {
    const parts = jws.split('.');

    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    if (signature !== '') {
      throw new Error('Signature must be empty for alg none');
    }
    
    const headerJson = Buffer.from(encodedHeader, 'base64url').toString('utf-8');
    const unparsedBody = Buffer.from(encodedPayload, 'base64url').toString('utf-8');

    let header: Record<string, unknown>;

    try {
      header = JSON.parse(headerJson);
    } catch (e) {
      throw new Error('Invalid JSON in JWT header');
    }

    return {
      type: 'unparsed',
      header,
      unparsedBody
    };
  }

  static async verifyWithAlg(jws: string, params: TVerifyParams): Promise<TUnparsedJws> {
    // lets find a key to use
    let publicKey: TJosePublicKey

    switch (params.keyMaterial.algType) {
      case 'none':
        throw new Error('Invalid algType none for verifyWithAlg');

      case 'symmetric':
        publicKey = { type: 'keylike', publicKey: Buffer.from(params.keyMaterial.secret) };
        break;
      default:
        publicKey = await JwtHelper.getAsymmetricPublicKey(params);
    }

    // verify it
    const verifyOptions: JWTVerifyOptions = { algorithms: [params.keyMaterial.alg], clockTolerance: params.skew ?? JwtHelper.defaultSkewInS };

    let result;
    switch (publicKey.type) {
      case 'keylike':
        result = await compactVerify(jws, publicKey.publicKey, verifyOptions);
        break;

      case 'jwks':
        result = await compactVerify(jws, publicKey.jwks, verifyOptions);
        break;
    }

    return {
      type: 'unparsed',
      header: result.protectedHeader,
      unparsedBody: new TextDecoder().decode(result.payload)
    }    
  }

  private static async getAsymmetricPublicKey(params: TVerifyParams): Promise<TJosePublicKey> {

    if (params.keyMaterial.algType !== 'asymmetric') {
      throw new Error(`Invalid key material type ${params.keyMaterial.algType} - expected asymmetric`);
    }

    if (params.keyMaterial.asymmetricSigningKey.signingKey !== undefined) {
      return { type: 'keylike', publicKey: crypto.createPublicKey(params.keyMaterial.asymmetricSigningKey.signingKey) };
    }

    if (params.keyMaterial.asymmetricSigningKey.signingKeyFileName !== undefined) {
      const key = fs.readFileSync(params.keyMaterial.asymmetricSigningKey.signingKeyFileName).toString('utf-8');
      return { type: 'keylike', publicKey: crypto.createPublicKey(key) };
    }

    if (params.keyMaterial.asymmetricSigningKey.signingKeyJwk !== undefined) {
      return { type: 'keylike', publicKey: await importJWK(params.keyMaterial.asymmetricSigningKey.signingKeyJwk, params.keyMaterial.alg) as KeyLike };
    }

    if (params.keyMaterial.asymmetricSigningKey.jwksUrl !== undefined) {
      return { type: 'jwks', jwks: createRemoteJWKSet(new URL(params.keyMaterial.asymmetricSigningKey.jwksUrl)) };
    }

    throw new Error('signing params did not include a valid public key');
  }  

  private static verifyHeaders(params: TVerifyParams, headers: Record<string, unknown>): void {

    // verify mustNotHaveHeaders
    if (params.mustNotHaveHeaders) {
      for (const header of params.mustNotHaveHeaders) {
        if (headers[header] !== undefined) {
          throw new Error(`Header ${header} must not be present`);
        }
      }
    }

    // verify mustHaveHeaders
    if (params.mustHaveHeaders !== undefined) {
      for (const header of params.mustHaveHeaders) {
        if (headers[header] === undefined) {
          throw new Error(`Header ${header} must be present`);
        }
      }
    }

    // check critical headers
    if (params.mustHaveCriticalHeaders !== undefined) {

      // ensure it is defined as a header
      for (const header of params.mustHaveCriticalHeaders) {
        if (headers[header] === undefined) {
          throw new Error(`Critical header ${header} must be present`);
        }
      }      

      // ensure crit claim is defined
      if (headers.crit === undefined) {
        throw new Error('crit claim must be present when critical headers are required');
      }

      // ensure crit claim is an array
      if (!Array.isArray(headers.crit)) {
        throw new Error('crit claim must be an array');
      }

      // ensure crit claim includes all critical headers
      const critHeaders = headers.crit as Array<string>;
      for (const header of params.mustHaveCriticalHeaders) {
        if (!critHeaders.includes(header)) {
          throw new Error(`crit claim must include ${header} when it is required as a critical header`);
        }
      }
    }

    // check headers have specific value
    if (params.mustMatchHeaders !== undefined) {
      for (const [key, value] of Object.entries(params.mustMatchHeaders)) {
        if (headers[key] !== value) {
          throw new Error(`Header ${key} must have value ${value}`);
        }
      }
    }
  }

  private static verifyBody(decodedJwtPayload: Record<string, unknown>, params: TVerifyParams): void {

    const now = Date.now() / 1000;  //in sec as skew value in sec
    const skew = params.skew ?? JwtHelper.defaultSkewInS;

    if (params.mustNotHaveClaims) {
      for (const claim of params.mustNotHaveClaims) {
        if (decodedJwtPayload[claim] !== undefined) {
          throw new Error(`Claim ${claim} must not be present`);
        }
      }
    }

    if (params.mustHaveClaims !== undefined) {
      for (const claim of params.mustHaveClaims) {
        if (decodedJwtPayload[claim] === undefined) {
          throw new Error(`Claim ${claim} must be present`);
        }
      }
    }    

    if (params.mustMatchClaims !== undefined) {
      const mustMatchkeys = Object.keys(params.mustMatchClaims);
      for (const key of mustMatchkeys) {
        const actualValue = decodedJwtPayload[key];
        const value = params.mustMatchClaims[key];

        if (actualValue !== value) {
          throw new Error(`Claim ${key} must have value ${value}`);
        }
      }
    }

    if (params.mustBeOneOfAudClaim !== undefined) {
      if (decodedJwtPayload.aud === undefined) {
        throw new Error('aud claim must be present');
      }

      if (Array.isArray(decodedJwtPayload.aud)) {
        let found = false;

        for (const aud of decodedJwtPayload.aud) {
          if (params.mustBeOneOfAudClaim.includes(aud)) {
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error(`aud claim must include at least one of ${params.mustBeOneOfAudClaim.join(',')}`);
        }
      } else {
        if (typeof decodedJwtPayload.aud !== 'string') {
          throw new Error('aud claim must be a string or an array of strings');
        }

        if (!params.mustBeOneOfAudClaim.includes(decodedJwtPayload.aud)) {
          throw new Error(`aud claim must be one of ${params.mustBeOneOfAudClaim.join(',')}`);
        }
      }
    } 

    if (params.mustHaveStringAud === true) {
      if (decodedJwtPayload.aud === undefined) {
        throw new Error('aud claim must be present');
      }

      if (typeof decodedJwtPayload.aud !== 'string') {
        throw new Error('aud claim must be a string');
      }
    }

    if (params.verifyFutureExp === true) {

      // ensure exp is a number      
      if (typeof decodedJwtPayload.exp !== 'number') {
        throw new Error('exp claim must be a number');
      }

      if (decodedJwtPayload.exp < (now - skew)) {
        throw new Error(`exp claim is in the past - exp is ${decodedJwtPayload.exp}, now is ${now}, threshold with skew is ${now -skew}`);
      }
    }

    if (params.verifyPastIat === true) {
      // ensure iat is a number
      if (typeof decodedJwtPayload.iat !== 'number') {
        throw new Error('iat claim must be a number');
      }

      if (decodedJwtPayload.iat > (now + skew)) {
        throw new Error(`iat claim is in the future - iat is ${decodedJwtPayload.iat}, now is ${now}, threshold with skew is ${now + skew}`);
      }
    }

    if (params.verifyPastNbf == true) {
      if (typeof decodedJwtPayload.nbf !== 'number') {
        throw new Error('nbf claim must be a number');
      }

      if (decodedJwtPayload.nbf > (now + skew)) {
        throw new Error(`nbf claim is in the future - nbf is ${decodedJwtPayload.nbf}, now is ${now}, threshold with skew is ${now + skew}`);
      }
    }

    if (params.verifyMaxNbfAge) {
      if (typeof decodedJwtPayload.nbf !== 'number') {
        throw new Error('nbf claim must be a number');
      }

      const minNbf = now - skew - params.verifyMaxNbfAge;
      if (decodedJwtPayload.nbf < minNbf) {
        throw new Error(`nbf claim is too old - nbf is ${decodedJwtPayload.nbf}, now is ${now}, threshold with skew is ${minNbf}. Max permitted age is ${params.verifyMaxNbfAge}`);
      }
    }

    if (params.verifyLifespanInS !== undefined) {
      if (typeof decodedJwtPayload.exp !== 'number') {
        throw new Error('exp claim must be a number');
      }

      if (typeof decodedJwtPayload.iat !== 'number') {
        throw new Error('iat claim must be a number');
      } 

      const lifeSpan = decodedJwtPayload.exp - decodedJwtPayload.iat;
      if (lifeSpan > params.verifyLifespanInS) {
        throw new Error(`Token validity period is too long - exp is ${decodedJwtPayload.exp}, iat is ${decodedJwtPayload.iat}, life span is ${lifeSpan}, max permitted is ${params.verifyLifespanInS}`);
      }
    }

    if (params.verifyMaxAgeInS !== undefined) {
      if (typeof decodedJwtPayload.iat !== 'number') {
        throw new Error('iat claim must be a number');
      }

      const age = now - decodedJwtPayload.iat;
      if (age > params.verifyMaxAgeInS) {
        throw new Error(`Token is too old - iat is ${decodedJwtPayload.iat}, now is ${now}, age is ${age}, max permitted age is ${params.verifyMaxAgeInS}`);
      }
    }
  }

  private static async getEncryptionPublicKey(params: TEncryptParams): Promise<KeyLike | Uint8Array> {

    if (params.keyMaterial.encryptionKey) {
      return crypto.createPublicKey(params.keyMaterial.encryptionKey);
    }

    if (params.keyMaterial.encryptionKeyFileName) {
      const key = fs.readFileSync(params.keyMaterial.encryptionKeyFileName).toString('utf-8');
      return crypto.createPublicKey(key);
    }

    if (params.keyMaterial.encryptionKeyJwk) {
      return importJWK(params.keyMaterial.encryptionKeyJwk, 'RSA-OAEP');
    }

    if (params.keyMaterial.jwksUrl) {
      const jwk = await JwksClient.getJwksByUseAndKid(params.keyMaterial.jwksUrl, 'enc');
      return importJWK(jwk, 'RSA-OAEP');
    }

    throw new Error('encryption params did not include a valid public key');
  }

  private static async getDecryptionPrivateKey(params: TDecryptParams): Promise<KeyLike | Uint8Array> {
    if (params.keyMaterial.encryptionKey !== undefined) {
      return crypto.createPrivateKey(params.keyMaterial.encryptionKey);
    }

    if (params.keyMaterial.encryptionKeyFileName !== undefined) {
      const key = fs.readFileSync(params.keyMaterial.encryptionKeyFileName).toString('utf-8');
      return crypto.createPrivateKey(key);
    }

    if (params.keyMaterial.encryptionKeyJwk !== undefined) {
      return importJWK(params.keyMaterial.encryptionKeyJwk, 'RSA-OAEP');
    }

    throw new Error('decryption params did not include a valid private key');
  }


}