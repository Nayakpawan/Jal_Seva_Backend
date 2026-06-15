import express from "express";
import { adminLogin } from "../controllers/userController.js";

const router = express.Router();

// 🔥 admin login route
router.post("/login", adminLogin);

export default router;