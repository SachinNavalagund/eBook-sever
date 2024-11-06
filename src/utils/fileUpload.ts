import s3Client from "@/cloud/aws";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { File } from "formidable";
import fs from "fs";

export const updateAvatarToAws = async (
  file: File,
  uniqueFileName: string,
  avatarId?: string
) => {
  const bucketName = "ebook-public-storage";
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
    url: `https://${bucketName}.s3.amazonaws.com/${uniqueFileName}`,
  };
};
