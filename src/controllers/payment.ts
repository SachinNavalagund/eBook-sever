import stripe from "@/stripe";
import { sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";

export const handlePayment: RequestHandler = async (req, res) => {
  const payload = req.body;
  const sig = req.headers["stripe-signature"];

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig!, endpointSecret);
  } catch (err) {
    return sendErrorResponse({
      res,
      message: "Could not complete the status",
      status: 400,
    });
  }

  console.log(event);

  res.send();
};
