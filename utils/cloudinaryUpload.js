import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadToCloudinary = (fileBuffer, folder, type = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: type,
        chunk_size: 6000000,
        timeout: 120000,
      },
      (error, result) => {
        if (error) {
          console.log("CLOUDINARY ERROR:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    const bufferStream = streamifier.createReadStream(fileBuffer);

    bufferStream.on("error", reject);

    bufferStream.pipe(stream);
  });
};