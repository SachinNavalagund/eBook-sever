import { model, ObjectId, Schema } from "mongoose";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  role: "user" | "author";
  name?: string;
  signedUp: boolean;
  avatar?: {
    url: string;
    id: string;
  };
  authorId?: ObjectId;
  books: ObjectId[];
}

const userSchema = new Schema<UserDoc>({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["user", "author"],
    default: "user",
  },
  signedUp: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: Object,
    url: String,
    id: String,
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "Author",
  },
  books: [
    {
      type: Schema.Types.ObjectId,
      ref: "Book",
    },
  ],
});

const UserModel = model("User", userSchema);

export default UserModel;
