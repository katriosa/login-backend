import express from "express";
import cors from "cors";
import { createUser, login, getNewAccessToken } from "./auth.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      !email ||
      !email.includes("@") ||
      !password ||
      password.trim().length < 6
    ) {
      return res.status(400).send({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken, id } = createUser(email, password);

    res.status(201).send({
      message: "User created successfully",
      user: { accessToken, refreshToken, id, email },
    });
  } catch (error) {
    res.status(400).send({ error: `Signup failed: ${error.message}` });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { accessToken, id } = login(email, password);

    res
      .status(200)
      .send({ message: "Login successful", user: { accessToken, id } });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).send({ error: `Login failed: ${error.message}` });
    }
    res.status(500).send({ error: `Login failed: ${error.message}` });
  }
});

app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).send({ error: "Refresh token required" });
  }

  try {
    const newAccessToken = getNewAccessToken(refreshToken);
    res.send({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).send({ error: "Invalid refresh token" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
