import express from "express";
import authRouter from "./routes/auth";
import { dbConnect } from "./db";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on : http://localhost:${port} `);
  dbConnect();
});
