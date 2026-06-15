import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = catchAsyncError(
  async (req, res, next) => {
    let token = req.cookies.token;

    // EXPO / REACT NATIVE TOKEN
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    // NO TOKEN
    if (!token) {
      return next(
        new ErrorHandler(
          "User is not authenticated.",
          401
        )
      );
    }

    // VERIFY TOKEN
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    // FIND USER
    req.user = await User.findById(decoded.id);

    next();
  }
);