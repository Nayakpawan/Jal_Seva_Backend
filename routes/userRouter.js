import express from "express";
import multer from "multer";
import {
  register,
  verifyOTP,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
  createComplaint,
  getComplaints,
  createNotification,
  getAllNotifications,
  getTeamMembers,
  addTeamMember,
  deleteTeamMember,
  addIncharge,
  getAllIncharge,
  getCurrentIncharge,
  getAllComplaints,
  updateComplaintStatus,
  getDashboardStats,
  createNotice,
  deleteNotice,
  getAllNotices,
  // getInchargeById
  // adminLogin
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";


// 🛠️ Multer Buffer Config (Isi sequence me setup hoga)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB maximum image file size cap
});

const router = express.Router();


// router.post("/login", adminLogin);
router.post("/register", register);
router.post("/otp-verification", verifyOTP);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset", resetPassword);
router.post("/add", createComplaint);
router.get("/my-complaints", getComplaints);
router.post("/addnotification",createNotification);
router.get("/notifications",getAllNotifications);
router.post("/team/add", upload.single("image"), addTeamMember); // 🚀 Multi-part file buffer handling
router.get("/team", getTeamMembers);
router.delete("/team/delete/:id", deleteTeamMember);
router.post("/addIncharge", upload.single("image"), addIncharge);
router.get("/incharge", getAllIncharge);
// router.get("/details/:id", getInchargeById);
router.get("/incharge/current", getCurrentIncharge);
router.get("/all-complaints",getAllComplaints)

router.put("/update-status/:id", updateComplaintStatus);
router.get("/dashboard-stats", getDashboardStats);

router.post("/add-notice", upload.single('image'), createNotice);
router.delete("/delete-notice/:id", deleteNotice);
router.get("/all-notices", getAllNotices);
export default router;
