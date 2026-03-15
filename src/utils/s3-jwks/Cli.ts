import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { JwksManager } from './JwksManager';

// type TJwksCliArgs = {
//   command: 'init' | 'publish' | 'add-key' | 'remove-key' | 'list';
//   bucket: string;
//   key: string;
//   region: string;
//   'out-dir': string;
//   kid?: string;
//   alg: string;
//   'key-size'?: number;
//   'key-use': 'sig' | 'enc';
//   force?: boolean;
// };

async function run(): Promise<void> {
  const args = parseArgs();
  const command = args._?.[0] as string;

  if (!command) {
    console.error('Error: A command is required (init)');
    process.exit(1);
  }

  const manager = new JwksManager({
    bucket: args.bucket,
    tenant: args.tenant,
    region: args.region,
    outDir: args['out-dir'],
  });

  switch (command) {
    case 'init':
      await manager.init(args['key-size']);
      break;

    default:
      console.error(`Error: Unknown command "${command}". Use init `);
      process.exit(1);
  }
}

function parseArgs(): any {
  const argv = yargs(hideBin(process.argv))
    .command('init', 'Initialise a new JWKS with a signing and encryption key pair')
    // .command('publish', 'Publish the local JWKS to S3')
    // .command('add-key', 'Generate a new key pair and add to the JWKS')
    // .command('remove-key', 'Remove a key from the JWKS by kid')
    // .command('list', 'List all keys in the local JWKS')

    .option('bucket', {
      alias: 'b',
      description: 'S3 bucket name',
      type: 'string',
      demandOption: true,
    })

    .option('tenant', {
      alias: 't',
      description: 'Tenant name. JWKS will be hosted at https://s3.<region>.amazonaws.com/<bucket>/<tenant>',
      type: 'string',
      demandOption: true,
    })

    .option('region', {
      alias: 'r',
      description: 'AWS region',
      type: 'string',
      demandOption: true,
    })

    .option('out-dir', {
      alias: 'd',
      description: 'Local directory for storing key material',
      type: 'string',
      demandOption: true,
    })

    .option('key-size', {
      description: 'RSA key size in bits',
      type: 'number',
      default: 2048,
    })

    .help()
    .alias('help', 'h')

    .strict()
    .fail((msg, err, yargs) => {
      if (err) throw err;
      console.error('Error:', msg);
      console.log(yargs.help());
      process.exit(1);
    })
    .parse();

  return argv;
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err.message ?? err);
    process.exit(1);
  });
