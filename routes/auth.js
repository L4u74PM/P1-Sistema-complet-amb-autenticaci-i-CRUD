// Autenticació: /register, /login, /logout, /protected + pàgines
import { Router } from "express";
import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "../config.js";
import { requirePage } from "../middleware.js";
import { UserRepository } from "../user-repository.js";
import { readData } from "../db.js";

const router = Router();

// Opcions de la cookie segura
const cookieOptions = {
  httpOnly: true,                                 // JavaScript del navegador no la pot llegir
  sameSite: "strict",                             // no s'envia des d'altres webs
  secure: process.env.NODE_ENV === "production",  // només per HTTPS (en producció)
  maxAge: 1000 * 60 * 60,                         // 1 hora
};

// Genera el JWT (caduca en 1 hora) i el guarda a la cookie
const createSession = (res, user) => {
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    SECRET_JWT_KEY,
    { expiresIn: "1h" }
  );
  res.cookie("access_token", token, cookieOptions);
  return token;
};

// ---------- Pàgines ----------
router.get("/", (req, res) => {
  res.render("index");
});

// Si ja hi ha sessió, la plantilla mostra "Hola <username>" en lloc dels formularis
router.get("/login", (req, res) => {
  const me = req.session.user;
  res.render("login", me ? { username: me.username } : {});
});

// ---------- REGISTRE ----------
router.post("/register", async (req, res) => {
  const { username, password } = req.body; // el rol MAI es llegeix del cos de la petició
  try {
    const id = await UserRepository.create({ username, password });
    const user = UserRepository.findById(id);
    const token = createSession(res, user); // iniciem sessió automàticament
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
});

// ---------- LOGIN ----------
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await UserRepository.login({ username, password });
    const token = createSession(res, user);
    res.json({ user, token });
  } catch (error) {
    res.status(error.status || 401).json({ error: error.message });
  }
});

// ---------- LOGOUT ----------
router.post("/logout", (req, res) => {
  res.clearCookie("access_token").json({ message: "Sessió tancada" });
});

router.get("/logout", (req, res) => {
  res.clearCookie("access_token").redirect("/");
});

// ---------- PÀGINES PRIVADES ----------
router.get("/protected", requirePage, (req, res) => {
  const me = req.session.user;
  const resources = readData("resources");

  // Les meves reserves, amb el nom del recurs
  const bookings = readData("bookings")
    .filter((b) => b.userId === me.id)
    .map((b) => {
      const resource = resources.find((r) => r.id === b.resourceId);
      return { ...b, resourceName: resource ? resource.name : "Recurs eliminat" };
    });

  const notifications = readData("notifications").filter((n) => n.userId === me.id);

  res.render("protected", { resources, bookings, notifications });
});

router.get("/profile", requirePage, (req, res) => {
  const profile = UserRepository.findById(req.session.user.id);
  res.render("profile", { profile });
});

export default router;
