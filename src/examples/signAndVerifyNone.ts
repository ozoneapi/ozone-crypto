import { JwtHelper, TSignParams, TVerifyParams } from '../lib/JwtHelper';

const SIGNING_KID = process.env.SIGNING_KID;

if (!SIGNING_KID) throw new Error('SIGNING_KID environment variable is required');

async function main() {
  const signParams: TSignParams = {
    keyMaterial: {
      algType: 'none',
      alg: 'none',
    },
    kid: SIGNING_KID,
    typ: 'JWT',
    body: {
      sub: '1234567890',
      name: 'Unsigned User',
      iss: 'https://example.com',
    },
    setValidityInS: 60,
  };

  const token = await JwtHelper.sign(signParams);
  console.log('Signed JWT (none):', token);

  const verifyParams: TVerifyParams = {
    keyMaterial: {
      algType: 'none',
      alg: 'none',
    },
    mustHaveHeaders: ['kid'],
    mustMatchHeaders: { kid: SIGNING_KID },
    mustHaveClaims: ['sub', 'iss'],
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
