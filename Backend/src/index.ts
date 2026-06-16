import express from "express";
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:4200'
}));

app.get("/", (req, res) => {
  res.json("Api is working")
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});