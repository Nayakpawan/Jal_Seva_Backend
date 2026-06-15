import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
title: { type: String, required: true },
  description: { type: String, required: true },
 { type: String, required: true },
  image: { type: String }, 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("News_Notice", noticeSchema);
