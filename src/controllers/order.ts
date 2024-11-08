import { BookDoc } from "@/models/book";
import OrderModel from "@/models/order";
import UserModel from "@/models/user";
import stripe from "@/stripe";
import { StripeCustomer } from "@/types/stripeTypes";
import { sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const getOrders: RequestHandler = async (req, res) => {
  const orders = await OrderModel.find({ userId: req.user.id }).populate<{
    orderItems: {
      id: BookDoc;
      price: number;
      qty: number;
      totalPrice: number;
    }[];
  }>("orderItems.id");

  res.json({
    orders: orders.map((item) => {
      return {
        id: item._id,
        stripCustomerId: item.stripCustomerId,
        paymentId: item.paymentId,
        totalAmount: item.totalAmount
          ? (item.totalAmount / 100).toFixed(2)
          : "0",
        paymentStatus: item.paymentStatus,
        date: item.createdAt,
        orderItems: item.orderItems.map(
          ({ id: book, price, qty, totalPrice }) => {
            return {
              id: book._id,
              title: book.title,
              slug: book.slug,
              cover: book.cover?.url,
              qty,
              price: price.toFixed(2),
              totalPrice: totalPrice.toFixed(2),
            };
          }
        ),
      };
    }),
  });
};

export const getOrderStatus: RequestHandler = async (req, res) => {
  const { bookId } = req.params;

  let status = false;

  if (!isValidObjectId(bookId)) {
    res.json({ status });
    return;
  }

  const user = await UserModel.findOne({ _id: req.user.id, books: bookId });
  if (user) status = true;
  res.json({ status });
};

export const getOrderSuccessStatus: RequestHandler = async (req, res) => {
  const { sessionId } = req.body;

  if (typeof sessionId !== "string")
    return sendErrorResponse({
      status: 400,
      message: "Invalid session id!",
      res,
    });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const customerId = session.customer;

  let customer: StripeCustomer;

  if (typeof customerId === "string") {
    customer = (await stripe.customers.retrieve(
      customerId
    )) as unknown as StripeCustomer;

    const { orderId } = customer.metadata;

    const order = await OrderModel.findById(orderId).populate<{
      orderItems: {
        id: BookDoc;
        price: number;
        qty: number;
        totalPrice: number;
      }[];
    }>("orderItems.id");

    if (!order) {
      return sendErrorResponse({
        res,
        message: "Order not found!",
        status: 404,
      });
    }

    const data = order?.orderItems.map(
      ({ id: book, price, qty, totalPrice }) => {
        return {
          id: book._id,
          title: book.title,
          slug: book.slug,
          cover: book.cover?.url,
          price: price.toFixed(2),
          qty,
          totalPrice: price.toFixed(2),
        };
      }
    );

    res.json({
      orders: data,
      totalAmount: order.totalAmount
        ? (order.totalAmount / 100).toFixed(2)
        : "0",
    });
    return;
  }

  sendErrorResponse({
    message: "Something went wrong order not found!",
    status: 404,
    res,
  });
};
