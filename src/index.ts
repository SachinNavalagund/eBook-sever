import express from "express";

const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("<h1>App is running successfully</h1>");
});

app.listen(port, () => {
  console.log(`Server is running on : http://localhost:${port} `);
});
