import { RequestHandler } from "express";
import crypto from "crypto";
import UserModel from "@/models/user";
import VerificationTokenModel from "@/models/verificationToken";
import mail from "@/utils/mail";
import { formatUserProfile, sendErrorResponse } from "@/utils/helper";
import jwt from "jsonwebtoken";
import { updateAvatarToAws } from "@/utils/fileUpload";
import slugify from "slugify";

export const generateAuthLink: RequestHandler = async (req, res) => {
  const { email } = req.body;

  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await UserModel.create({ email });
  }

  const userId = user._id.toString();

  await VerificationTokenModel.findOneAndDelete({
    userId,
  });

  const randomToken = crypto.randomBytes(36).toString("hex");

  await VerificationTokenModel.create<{ userId: string }>({
    userId,
    token: randomToken,
  });

  const link = `${process.env.VERIFICATION_LINK}?token=${randomToken}&userId=${userId}`;

  await mail.sendVerificationMail({
    link,
    to: user.email,
  });

  res.json({ message: "Please check your email for link" });
};

export const verifyAuthToken: RequestHandler = async (req, res) => {
  const { token, userId } = req.query;

  if (typeof token !== "string" || typeof userId !== "string") {
    return sendErrorResponse({
      status: 403,
      message: "Invalid request!",
      res,
    });
  }

  const verificationToken = await VerificationTokenModel.findOne({ userId });

  if (!verificationToken || !verificationToken.compare(token)) {
    return sendErrorResponse({
      status: 403,
      message: "Invalid request, token mismatch!",
      res,
    });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return sendErrorResponse({
      status: 500,
      message: "Something went wrong, user not found!",
      res,
    });
  }

  await VerificationTokenModel.findByIdAndDelete(verificationToken._id);

  //authentication
  const payload = { userId: user._id };

  const authToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15d",
  });

  res.cookie("authToken", authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  res.redirect(
    `${process.env.AUTH_SUCCESS_URL}?profile=${JSON.stringify(
      formatUserProfile(user)
    )}`
  );
};

export const sendProfileInfo: RequestHandler = async (req, res) => {
  res.json({
    profile: req.user,
  });
};

export const logout: RequestHandler = async (req, res) => {
  res.clearCookie("authToken").send();
};

export const updateProfile: RequestHandler = async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      signedUp: true,
    },
    { new: true }
  );
  if (!user) {
    return sendErrorResponse({
      message: "Something went wrong, user not found!",
      status: 500,
      res,
    });
  }

  //Avatar update
  const file = req.files.avatar;

  if (file && !Array.isArray(file)) {
    const uniqueFileName = `${user._id}-${slugify(req.body.name, {
      lower: true,
      replacement: "-",
    })}.png`;

    user.avatar = await updateAvatarToAws(
      file,
      uniqueFileName,
      user.avatar?.id
    );
    await user.save();
  }

  res.json({ profile: formatUserProfile(user) });
};
