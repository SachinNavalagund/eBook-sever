import HistoryModel from "@/models/history";
import { UpdateHistoryRequestHandler } from "@/types";
import { sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const updateBookHistory: UpdateHistoryRequestHandler = async (
  req,
  res
) => {
  const { bookId, highlights, lastLocation, remove } = req.body;

  let history = await HistoryModel.findOne({ bookId, reader: req.user.id });

  if (!history) {
    history = new HistoryModel({
      reader: req.user.id,
      bookId,
      lastLocation,
      highlights,
    });
  } else {
    if (lastLocation) history.lastLocation = lastLocation;
    //storing highlight
    if (highlights?.length && !remove) history.highlights.push(...highlights);

    //remove highlight
    if (highlights?.length && remove) {
      history.highlights = history.highlights.filter(
        (item) => !highlights.find((h) => h.selection === item.selection)
      );
    }
  }

  await history.save();

  res.send();
};

export const getBookHistory: RequestHandler = async (req, res) => {
  const { bookId } = req.params;
  console.log(bookId);

  if (!isValidObjectId(bookId)) {
    return sendErrorResponse({
      message: "Invalid book id!",
      status: 422,
      res,
    });
  }

  const history = await HistoryModel.findOne({
    bookId: bookId,
    reader: req.user.id,
  });

  if (!history) {
    return sendErrorResponse({
      message: "History not found",
      status: 404,
      res,
    });
  }

  res.json({
    history: {
      lastLocation: history.lastLocation,
      highlights: history.highlights.map((h) => ({
        fill: h.fill,
        selection: h.selection,
      })),
    },
  });
};
