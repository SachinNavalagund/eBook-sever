import "express-async-errors";
import express from "express";

import authRouter from "./routes/auth";
import { dbConnect } from "./db";
import { errorHandler } from "./middlewares/error";
import cookieParser from "cookie-parser";
import { fileParser } from "./middlewares/file";
import authorRouter from "./routes/author";
import bookRouter from "./routes/book";
import reviewRouter from "./routes/review";
import historyRouter from "./routes/history";
import cartRouter from "./routes/cart";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/author", authorRouter);
app.use("/book", bookRouter);
app.use("/review", reviewRouter);
app.use("/history", historyRouter);
app.use("/cart", cartRouter);

app.post("/test", fileParser, (req, res) => {
  console.log(req.body);
  console.log(req.files);
  res.json({});
});

//handling async error
app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on : http://localhost:${port} `);
  dbConnect();
});
