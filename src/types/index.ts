import {
  cartItemsSchema,
  historyValidationSchema,
  newAuthorSchema,
  newBookSchema,
  newReviewSchema,
  updateBookSchema,
} from "@/middlewares/validator";
import { RequestHandler } from "express";
import { z } from "zod";

type AuthorHandlerBody = z.infer<typeof newAuthorSchema>;
type NewBookBody = z.infer<typeof newBookSchema>;
type updateBookBody = z.infer<typeof updateBookSchema>;
type newReviewBody = z.infer<typeof newReviewSchema>;
type bookHistoryBody = z.infer<typeof historyValidationSchema>;
type purchasedByTheUser = { bookId: string };
type cartBody = z.infer<typeof cartItemsSchema>;

export type IsPurchasedByTheUserHandler = RequestHandler<
  {},
  {},
  purchasedByTheUser
>;
export type RequestAuthorHandler = RequestHandler<{}, {}, AuthorHandlerBody>;
export type CreateBookRequestHandler = RequestHandler<{}, {}, NewBookBody>;
export type UpdateBookRequestHandler = RequestHandler<{}, {}, updateBookBody>;
export type AddReviewRequestHandler = RequestHandler<{}, {}, newReviewBody>;
export type CartRequestHandler = RequestHandler<{}, {}, cartBody>;
export type UpdateHistoryRequestHandler = RequestHandler<
  {},
  {},
  bookHistoryBody
>;
