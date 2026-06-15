import mongoose from "mongoose";

const InchargeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  officeLocation: { type: String, required: true },
  workingHours: { type: String, default: "10:00 AM - 06:00 PM" },
  availableDays: { type: String, default: "Mon - Sat" },
  imageUrl: { type: String }, // Yahan image ka URL save hoga
}, { timestamps: true });

export default mongoose.model("Incharge", InchargeSchema);