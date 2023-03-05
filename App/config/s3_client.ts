import { S3Client } from "@aws-sdk/client-s3";

const s3_client = new S3Client({
  region: "us-east-1",
});

export default s3_client;
