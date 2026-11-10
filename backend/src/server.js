import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/game.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }

  console.error("API request failed:", error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to start the backend.");
  }

  if (!process.env.JSON_SECRET) {
    throw new Error("JSON_SECRET is required to sign authentication tokens.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Could not start backend:", error.message);
  process.exitCode = 1;
});