import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";

export const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: "admin@gmail.com" });

    if (!adminExists) {
      // Password hash karna zaroori hai
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      await Admin.create({
        email: "admin@gmail.com",
        password: hashedPassword, // Hash store karein
        role: "admin" // Role ensure karein
      });
      console.log("🔥 Default Admin Created with hashed password");
    } else {
      console.log("✔ Admin already exists");
    }
  } catch (error) {
    console.error("Seed Admin Error:", error);
  }
};
