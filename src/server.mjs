import express from "express";
import { arrivalTimes } from "./gtfsFetch.mjs";
const app = express();
const port = 3000;

const routeId = "C";
const stopId = "A19S";

app.get("/", (req, res) => {
  res.send("home page");
});

app.get("/train-times", async (req, res) => {
  let arrivals = await arrivalTimes(routeId, stopId);
  res.send(JSON.stringify(arrivals));
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
