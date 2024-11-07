import { addReview, getPublicReviews, getReview } from "@/controllers/review";
import { isAuth, isPurchasedByTheUser } from "@/middlewares/auth";
import { newReviewSchema, validate } from "@/middlewares/validator";
import { Router } from "express";

const reviewRouter = Router();

reviewRouter.post(
  "/",
  isAuth,
  isPurchasedByTheUser,
  validate(newReviewSchema),
  addReview
);

reviewRouter.get("/:bookId", isAuth, getReview);
reviewRouter.get("/list/:bookId", getPublicReviews);

export default reviewRouter;
