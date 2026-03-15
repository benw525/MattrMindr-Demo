const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

let s3Client = null;

function getStorageConfig() {
  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
    return {
      provider: "r2",
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      bucket: process.env.R2_BUCKET_NAME,
    };
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET_NAME) {
    const config = {
      provider: "s3",
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      bucket: process.env.S3_BUCKET_NAME,
    };
    if (process.env.S3_ENDPOINT) {
      config.endpoint = process.env.S3_ENDPOINT;
      config.forcePathStyle = true;
    }
    return config;
  }

  return null;
}

function getClient() {
  if (s3Client) return s3Client;
  const cfg = getStorageConfig();
  if (!cfg) return null;
  const opts = { region: cfg.region, credentials: cfg.credentials };
  if (cfg.endpoint) opts.endpoint = cfg.endpoint;
  if (cfg.forcePathStyle) opts.forcePathStyle = true;
  s3Client = new S3Client(opts);
  return s3Client;
}

function getBucket() {
  const cfg = getStorageConfig();
  return cfg ? cfg.bucket : null;
}

function isR2Configured() {
  return !!getStorageConfig();
}

function getStorageProvider() {
  const cfg = getStorageConfig();
  return cfg ? cfg.provider : null;
}

async function uploadToR2(key, buffer, contentType) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  await client.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return key;
}

async function downloadFromR2(key) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  const resp = await client.send(new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }));
  const chunks = [];
  for await (const chunk of resp.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function streamFromR2(key, range) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  const params = { Bucket: getBucket(), Key: key };
  if (range) params.Range = range;
  const resp = await client.send(new GetObjectCommand(params));
  return {
    stream: resp.Body,
    contentLength: resp.ContentLength,
    contentType: resp.ContentType,
    contentRange: resp.ContentRange,
    acceptRanges: resp.AcceptRanges,
  };
}

async function deleteFromR2(key) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  await client.send(new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }));
}

async function createMultipartUpload(key, contentType) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  const resp = await client.send(new CreateMultipartUploadCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  }));
  return resp.UploadId;
}

async function uploadPart(key, uploadId, partNumber, buffer) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  const resp = await client.send(new UploadPartCommand({
    Bucket: getBucket(),
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: buffer,
  }));
  return { ETag: resp.ETag, PartNumber: partNumber };
}

async function completeMultipartUpload(key, uploadId, parts) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  await client.send(new CompleteMultipartUploadCommand({
    Bucket: getBucket(),
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
  }));
}

async function abortMultipartUpload(key, uploadId) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  await client.send(new AbortMultipartUploadCommand({
    Bucket: getBucket(),
    Key: key,
    UploadId: uploadId,
  }));
}

async function headObject(key) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  const resp = await client.send(new HeadObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }));
  return { contentLength: resp.ContentLength, contentType: resp.ContentType };
}

async function getPresignedUrl(key, expiresIn = 3600, responseContentType, responseContentDisposition) {
  const client = getClient();
  if (!client) throw new Error("Object storage not configured");
  const params = { Bucket: getBucket(), Key: key };
  if (responseContentType) params.ResponseContentType = responseContentType;
  if (responseContentDisposition) params.ResponseContentDisposition = responseContentDisposition;
  return getSignedUrl(client, new GetObjectCommand(params), { expiresIn });
}

module.exports = {
  isR2Configured,
  getStorageProvider,
  uploadToR2,
  downloadFromR2,
  streamFromR2,
  deleteFromR2,
  headObject,
  getPresignedUrl,
  createMultipartUpload,
  uploadPart,
  completeMultipartUpload,
  abortMultipartUpload,
};
