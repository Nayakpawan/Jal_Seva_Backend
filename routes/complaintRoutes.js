import express from "express";
import Complaint from "../models/complaintSchema.js";
import upload from "../middlewares/upload.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
import mongoose from "mongoose";

const router = express.Router();

/* -------- CLOUDINARY UPLOAD FUNCTION -------- */
const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
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

/* -------- CREATE COMPLAINT ROUTE -------- */
router.post(
  "/add",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("SERVER LOG - Body Received:", req.body);
      console.log("SERVER LOG - Files Received:", req.files);

      const { userId, streetNo, location, complaintType, description } = req.body;

      if (!userId || userId === "undefined" || userId === "") {
        return res.status(400).json({ success: false, message: "User ID validation missing on incoming stream" });
      }
      if (!streetNo || !location) {
        return res.status(400).json({ success: false, message: "StreetNo and Location are required fields" });
      }

      let imageUrl = "";
      let videoUrl = "";

      // Image Stream Upload
      if (req.files?.image?.[0]) {
        const result = await uploadToCloudinary(req.files.image[0].buffer, "complaints/images", "image");
        imageUrl = result.secure_url;
      }
      
      // Video Stream Upload
      if (req.files?.video?.[0]) {
        const result = await uploadToCloudinary(req.files.video[0].buffer, "complaints/videos", "video");
        videoUrl = result.secure_url;
      }

      // Safe Parse To MongoDB ObjectId structure
      const parsedUserId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId.trim()) 
        : new mongoose.Types.ObjectId("6a13bb7090e93b953cc0ec8a"); // Safe validation fallback

      const complaint = await Complaint.create({
        userId: parsedUserId,
        streetNo,
        location,
        complaintType,
        description,
        image: imageUrl,
        video: videoUrl,
      });

      console.log("DATABASE OPERATION SUCCESS:", complaint);

      return res.status(201).json({ 
        success: true, 
        message: "Complaint registered in DB successfully!",
        data: complaint 
      });

    } catch (err) {
      console.error("SERVER CRITICAL CRASH ARRESTED:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;