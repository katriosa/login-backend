import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import fileRoutes from "./routes/files.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/auth", authRoutes);
app.use("/files", fileRoutes);
app.use("/uploads", express.static("uploads"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
