import mongoose from "mongoose";

const WorkerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Worker name is required"],
    trim: true 
  },
   email: { 
    type: String, 
    required: [true, "Worker email is required"],
    trim: true 
  },
  role: { 
    type: String, 
    required: [true, "Role is required"], // e.g., Supply Operator, Senior Plumber
    trim: true 
  },
  phone: { 
    type: String, 
    required: [true, "Phone number is required"],
    trim: true 
  },
  imageUrl: { 
    type: String, 
    default: "" // Yahan aap cloudinary ya external image ka URL daal sakte hain
  },
  workerType: { 
    type: String, 
    enum: ["workers", "plumbers","supervisor"], // Frontend segmented buttons se match karne ke liye
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Worker = mongoose.model("Worker", WorkerSchema);
export default Worker;