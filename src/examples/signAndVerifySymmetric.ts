import { JwtHelper, TSignParams, TVerifyParams } from '../lib/JwtHelper';

const SIGNING_KID = process.env.SIGNING_KID;

if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');

const SYMMETRIC_SECRET = 'super-secret-key-at-least-32-chars!!';

async function main() {
  const signParams: TSignParams = {
    keyMaterial: {
      algType: 'symmetric',
      alg: 'HS256',
      secret: SYMMETRIC_SECRET,
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: {
      sub: '1234567890',
      name: 'Jane Doe',
      iss: 'https://example.com',
    },
    setValidityInS: 120,
    setJti: true,
  };

  const token = await JwtHelper.sign(signParams);
  console.log('Signed JWT:', token);

  const verifyParams: TVerifyParams = {
    keyMaterial: {
      algType: 'symmetric',
      alg: 'HS256',
      secret: SYMMETRIC_SECRET,
    },
    mustHaveHeaders: ['kid'],
    mustMatchHeaders: { kid: SIGNING_KID },
    mustHaveClaims: ['sub', 'iss', 'exp', 'iat', 'jti'],
    verifyFutureExp: true,
    verifyPastIat: true,
    parseBody: true,
  };

  const result = await JwtHelper.verify(token, verifyParams);
  if (result.type !== 'parsed') {
    throw new Error('Expected parsed JWT after verification');    
  }    
  console.log('Verified JWT header:', result.header);
  console.log('Verified JWT body:', result.body);
}

main().catch(console.error);
