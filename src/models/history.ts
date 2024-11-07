import { Model, model, ObjectId, Schema } from "mongoose";

export interface Settings {
  lastLocation: string;
  highlights: { selection: string; fill: string }[];
}

interface HistoryDoc extends Settings {
  bookId: ObjectId;
  reader: ObjectId;
}

const historySchema = new Schema<HistoryDoc>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    reader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastLocation: String,
    highlights: [
      {
        selection: String,
        fill: String,
      },
    ],
  },
  { timestamps: true }
);

const HistoryModel = model("History", historySchema) as Model<HistoryDoc>;

export default HistoryModel;
