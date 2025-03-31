import bcrypt from "bcryptjs";
import db from "./db.js";
import jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET_KEY;

export function createUser(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (user) {
    throw new Error("User creation failed, invalid credentials");
  }

  const id = Math.random().toString() + email;

  const hashedPassword = bcrypt.hashSync(password, 12);

  const result = db
    .prepare("INSERT INTO users (email, password, id) VALUES (?, ?, ?)")
    .run(email, hashedPassword, id);

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
