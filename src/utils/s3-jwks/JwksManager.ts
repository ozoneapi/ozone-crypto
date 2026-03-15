import fs from 'fs';
import path from 'path';
import { S3Client } from './S3Client';
import { TJwks } from '../../lib/JwtTypes';
import { KeyHelper, TKeyPair } from '../../lib/KeyHelper';

export type TJwksManagerConfig = {
  bucket: string;
  tenant: string;
  region: string;
  outDir: string;
};

export type TPublishOptions = {
  force: boolean;
};

export type TRemoveKeyOptions = {
  kid: string;
};

type TLocalManifest = {
  keys: Array<TKeyPair>;
};

export class JwksManager {
  private readonly config: TJwksManagerConfig;
  private readonly s3Client: S3Client;
  private readonly manifestPath: string;

  constructor(config: TJwksManagerConfig) {
    this.config = config;
    this.s3Client = new S3Client(config.region);
    this.manifestPath = path.join(config.outDir, 'manifest.json');
  }

  /**
   * Initialise a new JWKS — generates a signing key pair and an encryption key pair,
   * writes them to the local key directory, and publishes the JWKS to S3.
   */
  async init(keySize: number): Promise<void> {
    this.ensureOutDir();

    if (this.manifestExists()) {
      throw new Error('Error: Output directory already initialised. Use add-key to add more keys, or delete the directory to start fresh.');
    }

    console.log(`Initialising JWKS in ${this.config.outDir}`);

    // Generate signing key pair
    const sigEntry = await this.generateAndStoreKeyPair( keySize, 'sig');

    // Generate encryption key pair
    const encEntry = await this.generateAndStoreKeyPair(keySize, 'enc');

    const manifest: TLocalManifest = {
      keys: [sigEntry, encEntry],
    };

    this.writeManifest(manifest);

    // Publish to S3
    await this.publishJwks(false);

    console.log('Init complete.');
  }

  /**
   * Publish the local JWKS (public keys only) to S3.
   */
  async publish(options: TPublishOptions): Promise<void> {
    if (!this.manifestExists()) {
      console.error('Error: No manifest found. Run init first.');
      process.exit(1);
    }

    await this.publishJwks(options.force);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private ensureOutDir(): void {
    if (!fs.existsSync(this.config.outDir)) {
      fs.mkdirSync(this.config.outDir, { recursive: true });
    }
  }

  private manifestExists(): boolean {
    return fs.existsSync(this.manifestPath);
  }

  private readManifest(): TLocalManifest {
    const raw = fs.readFileSync(this.manifestPath, 'utf-8');
    return JSON.parse(raw) as TLocalManifest;
  }

  private writeManifest(manifest: TLocalManifest): void {
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  private async generateAndStoreKeyPair(keySize: number, keyUse: 'sig' | 'enc'): Promise<TKeyPair> {

    let alg;
    switch (keyUse) {
      case 'sig':
        alg = 'PS256';
        break;
      case 'enc':
        alg = 'RSA-OAEP';
        break;
      default:
        throw new Error(`Unsupported key use: ${keyUse}`);
    }

    const keyPair = await KeyHelper.generateRsaKeyPair(keySize, alg, keyUse);

    // Write files
    const privateKeyFile = `${keyPair.publicJwk.kid}-${keyUse}-key.key`;
    const publicKeyFile = `${keyPair.publicJwk.kid}-${keyUse}-key.pub`;
    const privateJwkFile = `${keyPair.publicJwk.kid}-${keyUse}-key.private-jwk.json`;
    const publicJwkFile = `${keyPair.publicJwk.kid}-${keyUse}-key.public-jwk.json`;

    fs.writeFileSync(path.join(this.config.outDir, privateKeyFile), keyPair.privateKeyPem, 'utf-8');
    fs.writeFileSync(path.join(this.config.outDir, publicKeyFile), keyPair.publicKeyPem, 'utf-8');
    fs.writeFileSync(path.join(this.config.outDir, privateJwkFile), JSON.stringify(keyPair.privateJwk, null, 2), 'utf-8');
    fs.writeFileSync(path.join(this.config.outDir, publicJwkFile), JSON.stringify(keyPair.publicJwk, null, 2), 'utf-8');

    return keyPair;
  }

  private async publishJwks(force: boolean): Promise<void> {
    const manifest = this.readManifest();

    // Build JWKS from public JWKs only
    const jwks: TJwks = { keys: [] };

    for (const entry of manifest.keys) {
      const publicJwkFile = path.join(this.config.outDir, `${entry.publicJwk.kid}-${entry.publicJwk.use}-key.public-jwk.json`);
      
      if (!fs.existsSync(publicJwkFile)) {
        console.error(`Error: Public JWK file not found: ${publicJwkFile}`);
        process.exit(1);
      }

      const publicJwk = JSON.parse(fs.readFileSync(publicJwkFile, 'utf-8'));
      jwks.keys.push(publicJwk);
    }

    const jwksJson = JSON.stringify(jwks, null, 2);

    // Write local copy
    const localJwksPath = path.join(this.config.outDir, 'jwks.json');
    fs.writeFileSync(localJwksPath, jwksJson, 'utf-8');
    console.log(`Local JWKS written: ${localJwksPath}`);

    // Check if exists on S3 (unless force)
    if (!force) {
      const exists = await this.s3Client.objectExists(this.config.bucket, this.config.tenant);
      if (exists) {
        console.error('Error: JWKS already exists on S3. Use --force or the publish command with --force to overwrite.');
        process.exit(1);
      }
    }

    // Upload to S3
    await this.s3Client.putObject(this.config.bucket, this.config.tenant, jwksJson, 'application/json');

    const s3Url = `https://s3.${this.config.region}.amazonaws.com/${this.config.bucket}/${this.config.tenant}`;
    console.log(`JWKS published to S3: ${s3Url}`);
  }
}
