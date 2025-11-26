import express from "express";
import dotenv from "dotenv";
import { getCitiesAnalytics, getCityAnalytics } from "./analyticsController.ts";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/analytics/cities", getCitiesAnalytics);
app.get("/analytics/city/:name", getCityAnalytics);

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
