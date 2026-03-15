import {
  S3Client as AwsS3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * Lightweight S3 client wrapper — only imports @aws-sdk/client-s3 (no full AWS SDK).
 */
export class S3Client {
  private readonly client: AwsS3Client;

  constructor(region: string) {
    this.client = new AwsS3Client({ region });
  }

  /**
   * Check if an object exists in S3.
   */
  async objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Upload a string payload to S3.
   */
  async putObject(bucket: string, key: string, body: string, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );
  }

  /**
   * Get an object from S3 as a string.
   */
  async getObject(bucket: string, key: string): Promise<string> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for s3://${bucket}/${key}`);
    }

    return response.Body.transformToString('utf-8');
  }

  /**
   * Delete an object from S3.
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }
}
