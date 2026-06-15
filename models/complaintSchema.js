import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User ID is required to create a complaint"]
    },
    streetNo: { type: String, required: true },
    location: { type: String, required: true },
    complaintType: String,
    description: String,
    image: String,
    video: String,
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"], 
      default: "Pending",
    },
  },
  { timestamps: true }
);

complaintSchema.pre("save", function(next) {
  if (this.userId && typeof this.userId === "string") {
    try {
      this.userId = new mongoose.Types.ObjectId(this.userId.trim());
    } catch (err) {
      return next(new Error("Invalid User ID format conversion failed"));
    }
  }
  next();
});

export default mongoose.model("Complaint", complaintSchema);