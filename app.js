import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/userRouter.js";
import { removeUnverifiedAccounts } from "./automation/removeUnverifiedAccounts.js";
import adminRoutes from "./routes/adminRoutes.js";
import complaintRoutes from './routes/complaintRoutes.js'
export const app = express();
config({ path: "./config.env" });

// app.use(
//   cors({
//     origin: [
//         "http://localhost:4000",
//       "http://localhost:8081",
//       "http://localhost:3001",
//       "http://10.23.91.167:4000",
//       "http://10.23.91.167:8081", // EXPO
//       "exp://10.23.91.167:8081",  // EXPO APP
//       "http://10.224.177.167:4000",
//       "http://10.224.177.167:8081",
//       process.env.FRONTEND_URL,
//     ],

//     methods: ["GET", "POST", "PUT", "DELETE"],
// allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:8081",
      "http://localhost:3001",      // Aapka current react dashboard browser port
      "http://10.157.161.167:4000", // Aapka current backend running port
      "http://10.157.161.167:3001", // Aapka current frontend running domain
      "http://10.157.161.167:8081", // EXPO mobile app connectivity
      "http://10.23.91.167:4000",
      "http://10.23.91.167:8081",
      "exp://10.23.91.167:8081",
      "http://10.224.177.167:4000",
      "http://10.224.177.167:8081",
      process.env.FRONTEND_URL,"http://localhost:5173", "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRoutes); 
removeUnverifiedAccounts();
connection();
app.use(errorMiddleware);
