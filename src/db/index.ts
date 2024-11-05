import mongoose from "mongoose";

const uri = process.env.MONGO_URI;

if (!uri) throw new Error("Database uri is missing!");

export const dbConnect = () => {
  mongoose
    .connect(uri)
    .then(() => {
      console.log("Data base connected");
    })
    .catch((error) => {
      console.log("Data base connection failed : ", error.message);
    });
};
