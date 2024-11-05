import { RequestHandler } from "express";
import crypto from "crypto";
import UserModel from "@/models/user";
import VerificationTokenModel from "@/models/verificationToken";
import nodemailer from "nodemailer";
import mail from "@/utils/mail";

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

  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "396b3f4c43b423",
      pass: "77c78408c91e91",
    },
  });

  const link = `http://localhost:8000/verify?token=${randomToken}&userId=${userId}`;

  mail.sendVerificationMail({
    to: user.email,
    from: "sachinyash420@gmail.com",
    subject: "Auth Verification",
    content: `
        <div>
          <p>Please click on <a href="${link}">this link</a> to verify your account </p>
        </div>
        `,
  });

  res.json({ message: "Please check your email for link" });
};
