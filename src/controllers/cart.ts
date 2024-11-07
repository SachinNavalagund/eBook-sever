import CartModel from "@/models/cart";
import { CartRequestHandler } from "@/types";
import { sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";
import { ObjectId } from "mongoose";

export const updateCart: CartRequestHandler = async (req, res) => {
  const { items } = req.body;

  let cart = await CartModel.findOne({ userId: req.user.id });

  if (!cart) {
    //create new cart
    cart = await CartModel.create({ userId: req.user.id, items });
  } else {
    //we are updating the cart
    for (const item of items) {
      const oldProduct = cart.items.find(
        ({ product }) => item.product === product.toString()
      );

      if (oldProduct) {
        oldProduct.quantity += item.quantity;

        //if quantity is 0 or less than zero remove product from cart
        if (oldProduct.quantity <= 0) {
          cart.items = cart.items.filter(
            ({ product }) => oldProduct.product !== product
          );
        }
      } else {
        cart.items.push({
          product: item.product as any,
          quantity: item.quantity,
        });
      }
    }

    await cart.save();
  }

  res.json({ cart: cart._id });
};

export const getCart: RequestHandler = async (req, res) => {
  const cart = await CartModel.findOne({ userId: req.user.id }).populate<{
    items: {
      quantity: number;
      product: {
        _id: ObjectId;
        title: string;
        slug: string;
        cover?: { url: string; id: string };
        price: { mrp: number; sale: number };
      };
    }[];
  }>({
    path: "items.product",
    select: "title slug cover price",
  });

  if (!cart) {
    return sendErrorResponse({
      message: "Cart not found!",
      status: 404,
      res,
    });
  }

  res.json({
    cart: {
      id: cart._id,
      items: cart.items.map((item) => ({
        quantity: item.quantity,
        product: {
          id: item.product._id,
          title: item.product.title,
          slug: item.product.slug,
          cover: item.product.cover?.url,
          price: {
            mrp: (item.product.price.mrp / 100).toFixed(2),
            sale: (item.product.price.sale / 100).toFixed(2),
          },
        },
      })),
    },
  });
};

export const clearCart: RequestHandler = async (req, res) => {
  await CartModel.findOneAndDelete({ userId: req.user.id }, { items: [] });

  res.json();
};
