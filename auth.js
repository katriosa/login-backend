import bcrypt from "bcryptjs";
import db from "./db.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const secretKey = process.env.JWT_SECRET_KEY;

export function createUser(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (user) {
    throw new Error(`User with email "${email}" already exists`);
  }

  const id = uuidv4();

  const hashedPassword = bcrypt.hashSync(password, 12);

  try {
    const stmt = db.prepare(
      "INSERT INTO users (email, password, id) VALUES (?, ?, ?)"
    );
    stmt.run(email, hashedPassword, id);
  } catch (error) {
    console.error("Database insert error:", error);
    throw new Error("Failed to create user");
  }

  const token = jwt.sign({ id }, secretKey, {
    expiresIn: "1h",
  });

  const newUser = { token, id };
  return newUser;
}
export function login(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    const error = new Error("User creation failed, invalid credentials");
    error.status = 400;
    throw error;
  }
  const token = jwt.sign({ id: user.id }, secretKey, {
    expiresIn: "1h",
  });
  return token;
}
