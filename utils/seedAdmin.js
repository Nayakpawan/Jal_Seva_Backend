import { Admin } from "../models/adminModel.js";

export const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: "admin@gmail.com" });

    if (!adminExists) {
      await Admin.create({
        email: "admin@gmail.com",
        password: "admin123", 
      });
      console.log("🔥 Default Admin Created");
    } else {
      console.log("✔ Admin already exists");
    }
  } catch (error) {
    console.error("Seed Admin Error:", error);
  }
};