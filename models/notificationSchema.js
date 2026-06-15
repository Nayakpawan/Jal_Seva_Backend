import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Notification title is required"],
    trim: true 
  },
  message: { 
    type: String, 
    required: [true, "Notification body message is required"],
    trim: true 
  },
  category: { 
    type: String, 
    enum: ["General", "Timing", "Scheme", "Complaint"], 
    default: "General" 
  },
  // 🎯 Water Timing Specific Meta Fields
  supplyTime: {
    type: String,
    trim: true,
    default: "N/A"
  },
  delayTime: {
    type: String,
    trim: true,
    default: "None"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;