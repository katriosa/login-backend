import bcrypt from "bcryptjs";
import db from "./db.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const secretAccess = process.env.ACCESS_SECRET;
const secretRefresh = process.env.REFRESH_SECRET;

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
    throw new Error("Database insert error:", error);
  }

  const accessToken = jwt.sign({ id }, secretAccess, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id }, secretRefresh, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken, id };
}
export function login(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    const error = new Error("Login failed, invalid credentials");
    error.status = 400;
    throw error;
  }
  const token = jwt.sign({ id: user.id }, secretKey, {
    expiresIn: "1h",
  });
  return { token, id: user.id };
}

export function getNewAccessToken(token) {
  const decoded = jwt.verify(token, secretRefresh);
  const newAccessToken = jwt.sign({ id: decoded.id }, secretAccess, {
    expiresIn: "15m",
  });
  return newAccessToken;
}
