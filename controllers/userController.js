import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import { Admin } from "../models/adminModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
import Complaint from "../models/complaintSchema.js";
import Notification from '../models/notificationSchema.js'
import Incharge from "../models/InchargeSchema.js"
import Worker from "../models/workerSchema.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
import mongoose from "mongoose";
import Notice from "../models/newsSchema.js"


 export const register = catchAsyncError(async (req, res, next) => {

  try {

    console.time("REGISTER_API");

    const {
      name,
      email,
      phone,
      streetNo,
      city,
      password,
      verificationMethod,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !name ||
      !email ||
      !phone ||
      !streetNo ||
      !city ||
      !password ||
      !verificationMethod
    ) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    /* ================= PHONE VALIDATION ================= */

    const phoneRegex = /^\+91[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    /* ================= CHECK VERIFIED USER ================= */

    const existingVerifiedUser = await User.findOne({
      $or: [
        {
          email,
          accountVerified: true,
        },
        {
          phone,
          accountVerified: true,
        },
      ],
    });

    if (existingVerifiedUser) {
      return next(
        new ErrorHandler("Phone or Email is already used.", 400)
      );
    }

    /* ================= CHECK OLD UNVERIFIED USERS ================= */

    const oldUnverifiedUsers = await User.find({
      $or: [
        {
          email,
          accountVerified: false,
        },
        {
          phone,
          accountVerified: false,
        },
      ],
    });

    /* LIMIT ATTEMPTS */
    if (oldUnverifiedUsers.length >= 3) {
      return next(
        new ErrorHandler(
          "You exceeded maximum attempts (3). Try again later.",
          400
        )
      );
    }
    /* DELETE OLD UNVERIFIED ACCOUNT */
    if (oldUnverifiedUsers.length > 0) {

      await User.deleteMany({

        _id: {

          $in: oldUnverifiedUsers.map((u) => u._id),

        },

      });

    }


    /* ================= CREATE USER ================= */


    const user = new User({

      name,

      email,

      phone,

      streetNo,

      city,

      password,

    });


    /* GENERATE OTP */


    const verificationCode =

      await user.generateVerificationCode();


    /* SAVE USER */


    await user.save();


    /* ================= SEND RESPONSE FAST ================= */


    res.status(201).json({

      success: true,

      message: "Registration successful. OTP sending...",

      email,

      phone,

    });


    /* ================= SEND OTP IN BACKGROUND ================= */


    try {

      await sendVerificationCode(

        verificationMethod,

        verificationCode,

        name,

        email,

        streetNo,

        city,

        phone

      );


      console.log("OTP SENT SUCCESSFULLY");

    } catch (otpError) {

      console.log("OTP ERROR:", otpError.message);

    }


    console.timeEnd("REGISTER_API");

  } catch (error) {

    console.log("REGISTER ERROR:", error);


    return next(

      new ErrorHandler(

        error.message || "Registration failed",

        500

      )

    );

  }

});

async function sendVerificationCode(
  verificationMethod,
  verificationCode,
  name,
  email,
  streetNo,
  city,
  phone,
  res = null
) {
  try {
    if (verificationMethod === "email") {
      const message = generateEmailTemplate(verificationCode);
     await sendEmail({ email, subject: "Your Verification Code", message });
      res.status(200).json({
        success: true,
        message: `Verification email successfully sent to ${name}`,
      });
    } else if (verificationMethod === "phone") {
      const verificationCodeWithSpace = verificationCode
        .toString()
        .split("")
        .join(" ");
      await client.calls.create({
        twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}. Your verification code is ${verificationCodeWithSpace}.</Say></Response>`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      res.status(200).json({
        success: true,
        message: `OTP sent.`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Invalid verification method.",
      });
    }
  } catch (error) {
    console.log(error);
    console.error("OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Verification code failed to send.",
    });
  }
}

function generateEmailTemplate(verificationCode) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
  `;
}

export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp, phone } = req.body;

  function validatePhoneNumber(phone) {
const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  if (!validatePhoneNumber(phone)) {
    return next(new ErrorHandler("Invalid phone number.", 400));
  }

  try {
    const userAllEntries = await User.find({
      $or: [
        {
          email,
          accountVerified: false,
        },
        {
          phone,
          accountVerified: false,
        },
      ],
    }).sort({ createdAt: -1 });

    if (!userAllEntries) {
      return next(new ErrorHandler("User not found.", 404));
    }

    let user;

    if (userAllEntries.length > 1) {
      user = userAllEntries[0];

      await User.deleteMany({
        _id: { $ne: user._id },
        $or: [
          { phone, accountVerified: false },
          { email, accountVerified: false },
        ],
      });
    } else {
      user = userAllEntries[0];
    }

    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid OTP.", 400));
    }

    const currentTime = Date.now();

    const verificationCodeExpire = new Date(
      user.verificationCodeExpire
    ).getTime();
    console.log(currentTime);
    console.log(verificationCodeExpire);
    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP Expired.", 400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account Verified.", res);
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error.", 500));
  }
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required.", 400));
  }
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );
  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  sendToken(user, 200, "User logged in successfully.", res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});


export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // 5 Digit OTP Generate karein
  const otp = Math.floor(10000 + Math.random() * 90000);
  
  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  await user.save({ validateBeforeSave: false });

  const message = `Your Password Reset OTP is: ${otp}. It will expire in 10 minutes.`;

  try {
    sendEmail({
      email: user.email,
      subject: "PASSWORD RESET OTP",
      message,
    });
    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Cannot send OTP.", 500));
  }
});
export const resetPassword = catchAsyncError(async (req, res, next) => {
  console.log("Reset Password Request Received:", req.body);
  const { email, otp, password, confirmPassword } = req.body;

  // 1. Validation
  if (!email || !otp || !password || !confirmPassword) {
    return next(new ErrorHandler("Please provide all fields.", 400));
  }

  if (password.length < 8) {
    return next(new ErrorHandler("Password must be at least 8 characters long.", 400));
  }

  if (password.length > 32) {
    return next(new ErrorHandler("Password cannot exceed 32 characters.", 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  // 2. Find User
  // Note: select("+password") zaroori hai agar schema mein select: false hai
  const user = await User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordOtpExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid or expired OTP.", 400));
  }

  // 3. Update & Save
  user.password = password; // Pre-save hook (bcrypt) automatically hash kar dega
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  
  await user.save(); // YE LINE BOHOT ZAROORI HAI!

  sendToken(user, 200, "Password Reset Successfully.", res);
});



export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // 🔥 COMPARE HASHED PASSWORD
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      admin,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL */
export const getComplaints = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("Backend received userId for fetch:", userId); // Check karein terminal me id aa rahi hai

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Database se data nikalna
    const data = await Complaint.find({ userId: userId }).sort({ createdAt: -1 });
    
    console.log(`Found ${data.length} complaints for this user.`); // Yeh check karein

    return res.status(200).json({
      success: true,
      count: data.length,
      data, // Frontend isi 'data' key ko read kar raha hai
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


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

/* -------- MAIN CONTROLLER EXPORT -------- */
export const createComplaint = async (req, res) => {
  try {
    console.log("REQ BODY RECEIVED:", req.body);
    console.log("FILES RECEIVED:", req.files);

    const { userId, streetNo, location, complaintType, description } = req.body;

    // 1. Validation checking
    if (!userId || userId === "undefined" || userId === "") {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!streetNo || !location) {
      return res.status(400).json({ success: false, message: "StreetNo and Location are required" });
    }

    let imageUrl = "";
    let videoUrl = "";

    /* 2. CLOUDINARY IMAGE UPLOAD */
    if (req.files?.image?.[0]) {
      const result = await uploadToCloudinary(
        req.files.image[0].buffer,
        "complaints/images",
        "image"
      );
      imageUrl = result.secure_url;
    }

    /* 3. CLOUDINARY VIDEO UPLOAD */
    if (req.files?.video?.[0]) {
      const result = await uploadToCloudinary(
        req.files.video[0].buffer,
        "complaints/videos",
        "video"
      );
      videoUrl = result.secure_url;
    }

    /* 4. SAVE TO MONGODB */
    const complaint = await Complaint.create({
      userId: new mongoose.Types.ObjectId(userId.trim()),
      streetNo,
      location,
      complaintType,
      description,
      image: imageUrl,
      video: videoUrl,
    });

    console.log("DATABASE SAVED SUCCESS:", complaint);

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });

  } catch (error) {
    console.log("SERVER CRITICAL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const createNotification = async (req, res) => {
  try {
    const { title, message, category, supplyTime, delayTime } = req.body;

    // Basic fields checking constraint
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide both headline title and detailed description message.",
      });
    }

    // Data package payload formatting logic
    const postPayload = {
      title,
      message,
      category,
      // Agar category 'Timing' hai toh incoming frontend values use karo, nahi toh system default mapping set karo
      supplyTime: category === "Timing" && supplyTime ? supplyTime : "N/A",
      delayTime: category === "Timing" && delayTime ? delayTime : "None"
    };

    const newAlert = await Notification.create(postPayload);

    return res.status(201).json({
      success: true,
      message: "Notification published successfully! 🚀",
      data: newAlert,
    });

  } catch (error) {
    console.error("Backend Post Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error! Alert publish failed.",
      error: error.message,
    });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    // Sort logic to make sure newest alerts appear right at the top
    const historyLogs = await Notification.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: historyLogs.length,
      data: historyLogs,
    });
  } catch (error) {
    console.error("Backend Get Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load active database tracking logs.",
      error: error.message,
    });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const staff = await Worker.find().sort({ createdAt: -1 });

    const formattedStaff = staff.map(item => {
      // Role mapping logic: Access determine karna
      let accessRole = "user"; // Default
      
      if (item.workerType === "plumbers") {
        accessRole = "manager";
      } else if (item.workerType === "supervisor") {
        accessRole = "supervisor";
      } else {
        accessRole = "user"; // 'workers' ya undefined ke liye
      }

      return {
        id: item._id.toString(),
        name: item.name,
        role: item.role,
        phone: item.phone,
        area: item.area || "General Area",
        access: accessRole,
        imageUrl: item.imageUrl || ""
      };
    });

    // Frontend ko data bhej rahe hain
    return res.status(200).json({
      success: true,
      data: {
        workers: formattedStaff.filter(item => item.access === "user"),
        plumbers: formattedStaff.filter(item => item.access === "manager"),
        supervisors: formattedStaff.filter(item => item.access === "supervisor") // Comma add kiya
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 🎯 POST: Add New Worker With Profile Image

export const addTeamMember = async (req, res) => {
  try {
    const { name, role, phone, email, access } = req.body;

    if (!name || !role || !phone) {
      return res.status(400).json({ success: false, message: "Required fields missing." });
    }

    let finalImageUrl = "";
    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, "jalseva_team", "image");
      finalImageUrl = cloudinaryResult.secure_url;
    }

    // Role mapping logic: Access ke hisaab se workerType set karein
    let type = "workers"; // Default
    if (access === "admin" || access === "manager") {
      type = "plumbers";
    } else if (access === "supervisor") {
      type = "supervisor";
    }

    const newMember = await Worker.create({
      name,
      role,
      phone,
      email: email || undefined,
      imageUrl: finalImageUrl,
      workerType: type // Ab ye schema ke enum se match karega
    });

    return res.status(201).json({
      success: true,
      message: "Team member successfully onboarded! 🚀",
      data: newMember
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params; // URL parameters se member ID nikalenge (e.g., /team/delete/12345)

    // Check karenge ki worker database mein exist karta hai ya nahi
    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker record not found in database."
      });
    }

    // Document ko permanently delete karne ka execution command
    await Worker.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Worker record deleted permanently! 🗑️"
    });

  } catch (error) {
    console.error("Delete Controller Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error during deletion process.",
      error: error.message 
    });
  }
};


export const addIncharge = async (req, res) => {
  try {
    const { name, designation, employeeId, phone, email, officeLocation } = req.body;

    if (!name || !designation || !employeeId || !phone || !officeLocation) {
      return res.status(400).json({ success: false, message: "Required fields are missing!" });
    }

    let imageUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "incharge_profiles");
      imageUrl = result.secure_url;
    }

    const newIncharge = await Incharge.create({
      name, designation, employeeId, phone, email, officeLocation, imageUrl
    });

    res.status(201).json({ success: true, data: newIncharge, message: "Incharge added successfully!" });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Employee ID already exists." });
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getAllIncharge = async (req, res) => {
  try {
    const data = await Incharge.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getCurrentIncharge = async (req, res) => {
  try {
    const incharge = await Incharge.findOne();

    res.status(200).json({
      success: true,
      data: incharge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
    .populate("userId", "name") // User model se sirf 'name' field utha rahe hain
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update Status
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.status(200).json({ success: true, data: updatedComplaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });
    const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });

    res.status(200).json({
      success: true,
      data: { totalUsers, totalComplaints, resolvedComplaints, pendingComplaints }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const createNotice = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and Description are required!" });
    }

    let imageUrl = "";
    // Cloudinary upload logic
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "notice_images");
      imageUrl = result.secure_url;
    }

    // Notice create karna
    const newNotice = await Notice.create({ 
      title, 
      description, 
      image: imageUrl 
    });

    res.status(201).json({ 
      success: true, 
      data: newNotice, 
      message: "Notice posted successfully!" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Notice
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    await Notice.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Notice deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllNotices = async (req, res) => {
  try {
    // Sort by createdAt descending (-1) to get the latest notices first
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: notices.length,
      data: notices 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};