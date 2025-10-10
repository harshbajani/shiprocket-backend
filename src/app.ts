import express from "express";
import cors from "cors";
import shiprocketRouter from "./routes/shiprocket";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: ["http://localhost:3000"] }));

app.get("/", (_req, res) => {
  res.status(200).send("Shiprocket Backend is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/shiprocket", shiprocketRouter);

export default app;
