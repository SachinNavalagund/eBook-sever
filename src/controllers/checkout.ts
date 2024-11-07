import { BookDoc } from "@/models/book";
import CartModel from "@/models/cart";
import { sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const checkout: RequestHandler = async (req, res) => {
  const { cartId } = req.body;

  if (!isValidObjectId(cartId)) {
    return sendErrorResponse({
      res,
      message: "Invalid cart id!",
      status: 404,
    });
  }

  const cart = await CartModel.findById(cartId).populate<{
    items: { product: BookDoc; quantity: number };
  }>({
    path: "items.product",
  });

  if (!cart) {
    return sendErrorResponse({
      res,
      message: "Cart not found!",
      status: 404,
    });
  }
};
