import { Router } from "express";
import { generateAuthLink } from "@/controllers/auth";

import { emailValidationSchema, validate } from "@/middlewares/validator";

const authRouter = Router();

authRouter.post(
  "/generate-link",
  validate(emailValidationSchema),
  generateAuthLink
);

export default authRouter;
