import s3Client from "@/cloud/aws";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { File } from "formidable";
import fs from "fs";
import { generateS3ClientPublicUrl } from "./helper";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const updateAvatarToAws = async (
  file: File,
  uniqueFileName: string,
  avatarId?: string
) => {
  const bucketName = process.env.AWS_PUBLIC_BUCKET;
  //Deleting the image if user already has the avatar
  if (avatarId) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: avatarId,
    });
    await s3Client.send(deleteCommand);
  }

  //Storing file to aws s3 bucket
  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueFileName,
    Body: fs.readFileSync(file.filepath),
  });

  await s3Client.send(putCommand);

  return {
    id: uniqueFileName,
    url: generateS3ClientPublicUrl("ebook-public-storage", uniqueFileName),
  };
};

export const uploadBookCoverToAws = async (
  filepath: string,
  uniqueFileName: string
) => {
  const putCommand = new PutObjectCommand({
    Bucket: process.env.AWS_PUBLIC_BUCKET,
    Key: uniqueFileName,
    Body: fs.readFileSync(filepath),
  });

  await s3Client.send(putCommand);

  return {
    id: uniqueFileName,
    url: generateS3ClientPublicUrl(
      process.env.AWS_PUBLIC_BUCKET!,
      uniqueFileName
    ),
  };
};

interface FileInfo {
  bucket: string;
  uniqueKey: string;
  contentType: string;
}

export const generateFileUploadUrl = async (
  client: S3Client,
  fileInfo: FileInfo
) => {
  const { bucket, uniqueKey, contentType } = fileInfo;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: uniqueKey,
    ContentType: contentType,
  });

  return getSignedUrl(client, command);
};
