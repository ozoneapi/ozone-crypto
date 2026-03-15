//
// Signing algorithms
//
const TNoneSigningAlgorithm = ['none'] as const;
const TSymetricSigningAlgorithms = ['HS256' , 'HS384' , 'HS512'] as const
const AssymetricSigningAlgorithms = ['RS256' , 'RS384' , 'RS512' , 'PS256' , 'PS384' , 'PS512' , 'ES256' , 'ES384' , 'ES512'] as const

export type TNoneSigningAlgorithm = typeof TNoneSigningAlgorithm[number];
export type TSymetricSigningAlgorithms = typeof TSymetricSigningAlgorithms[number];
export type TAsymmetricSigningAlgorithms = typeof AssymetricSigningAlgorithms[number];

export type TSigningAlgorithms = TAsymmetricSigningAlgorithms |TSymetricSigningAlgorithms |TNoneSigningAlgorithm;

//
// JWS
//
export interface TJwsHeader {
  alg: TSigningAlgorithms | undefined;
  kid?: string;
  jwk?: TJwkPublicKey;
  typ?: string;
  cty?: string;
  crit?: ReadonlyArray<string>;
}

export type TJws<T extends Record<string, unknown> = Record<string, unknown>> = TUnparsedJws | TParsedJws<T>;

export type TUnparsedJws = {
  type: 'unparsed';
  header: Record<string, unknown>;
  unparsedBody: string;
  signature?: string;
}

export type TParsedJws<T extends Record<string, unknown> = Record<string, unknown>> = {
  type: 'parsed';
  header: Record<string, unknown>;
  body: T;
  signature?: string;
}

export type TAud = string | Array<string>;

export type TStandardClaims = {
  iss?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  aud?: TAud;
}

//
// JWE algorithms
//
export type TKeyManagementAlgorithms = 'RSA-OAEP-256'|'RSA-OAEP';
export type TContentEncryptionAlgorithms = 'A256GCM'|'A128CBC-HS256';


//
// JWK
//
export const KeyOps = ['encrypt' , 'decrypt' , 'sign' , 'verify'] as const;
export type TKeyOps = typeof KeyOps[number];

export type TJwkPublicKey = {
  alg?: TSigningAlgorithms | TKeyManagementAlgorithms,
  kty: string,
  kid?: string,
  use?: string,
  e?: string,
  n?: string,
  x5t?: string,
  x5c?: Array<string>,
  key_ops?: Array<TKeyOps>,
  "x56#S256"?: string
}

export type TJwkPrivateKey = TJwkPublicKey & {
  d: string,
  p: string,
  q: string,
  dp: string,
  dq: string,
  qi: string
}

export interface TJwks {
  keys: Array<TJwkPublicKey>
}