import express from "express";
import { createUser, login } from "./auth.js";

const app = express();

app.use(express.json());

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

    const { token, id } = createUser(email, password);

    res
      .status(201)
      .send({
        message: "User created successfully",
        user: { token, id, email },
      });
  } catch (error) {
    res
      .status(400)
      .send({ error: "Creating user failed, invalid credentials" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const token = login(email, password);

    res.status(200).send({ message: "Login successful", token });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).send({ error: error.message });
    }
    res.status(500).send({ error: "Login failed, invalid credentials" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
