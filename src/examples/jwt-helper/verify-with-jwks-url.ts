import { JwtHelper } from '../../lib/JwtHelper';

/**
 * Example: Verify a JWT using a JWKS URL
 * 
 * Required environment variables:
 * - JWKS_URL: URL to the JWKS endpoint
 */

async function main() {
  const jwksUrl = process.env.JWKS_URL;
  
  if (!jwksUrl) {
    throw new Error('JWKS_URL environment variable is required');
  }

  const sampleJwt = process.argv[2];
  if (!sampleJwt) {
    throw new Error('Please provide a JWT as the first argument');
  }

  const result = await JwtHelper.verify(sampleJwt, {
    keyMaterial: {
      algType: 'asymmetric',
      alg: 'PS256',
      asymmetricSigningKey: {
        jwksUrl: jwksUrl
      }
    },
    parseBody: true,
    verifyFutureExp: true,
    verifyPastIat: true,
    verifyPastNbf: true
  });

  console.log('JWT Verification Successful!');
  console.log('\nHeader:', result.header);
  if (result.type === 'parsed') {
    console.log('Payload:', result.body);
  }
}

main().catch(error => {
  console.error('Verification failed:', error.message);
  process.exit(1);
});
