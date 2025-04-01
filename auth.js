import bcrypt from "bcryptjs";
import db from "./db.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const secretAccessKey = process.env.ACCESS_SECRET_KEY;
const secretRefreshKey = process.env.REFRESH_SECRET_KEY;

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

  const accessToken = jwt.sign({ id }, secretAccessKey, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id }, secretRefreshKey, {
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
  const accessToken = jwt.sign({ id: user.id }, secretAccessKey, {
    expiresIn: "15m",
  });
  return { accessToken, id: user.id };
}

export function getNewAccessToken(token) {
  const decoded = jwt.verify(token, secretRefreshKey);
  const newAccessToken = jwt.sign({ id: decoded.id }, secretAccessKey, {
    expiresIn: "15m",
  });
  return newAccessToken;
}
