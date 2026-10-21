import express from "express";
import cookieParser from "cookie-parser";
import { PORT } from "./config.js";
import { authenticate, requireAuth } from "./middleware.js";
import { UserRepository } from "./user-repository.js";
import authRoutes from "./routes/auth.js";
import resourcesRoutes from "./routes/resources.js";
import bookingsRoutes from "./routes/bookings.js";
import pagesRoutes from "./routes/pages.js";

const app = express();

app.use(express.json());           // cos JSON (formularis amb fetch i API)
app.use(cookieParser());           // per llegir la cookie amb el JWT
app.use(express.static("public")); // carpeta pública: css i js del navegador
app.set("view engine", "ejs");     // Fem servir el motor ejs
app.set("views", "./views");       // carpeta on desem els arxius .ejs

app.use(authenticate); // comprova el token a cada petició

// Pàgines i autenticació: /, /register, /login, /logout, /protected, /profile
app.use("/", authRoutes);

// Pàgines per gestionar els CRUD des del navegador
app.use("/manage", pagesRoutes);

// CRUD (API REST): només per a usuaris autenticats
app.use("/resources", requireAuth, resourcesRoutes);
app.use("/bookings", requireAuth, bookingsRoutes);

// Usuaris d'exemple (només es creen si no existeixen). Els ids són fixos
// perquè db/bookings.json i db/notifications.json hi fan referència.
const exampleUsers = [
  { id: "00000000-0000-4000-8000-000000000001", username: "admin", password: "Admin1234", role: "admin" },
  { id: "00000000-0000-4000-8000-000000000002", username: "maria", password: "Maria1234", role: "user" },
  { id: "00000000-0000-4000-8000-000000000003", username: "joan", password: "Joan1234", role: "user" },
];
for (const u of exampleUsers) {
  if (!UserRepository.findByUsername(u.username)) await UserRepository.create(u);
}

// Gestió d'errors: no mostrem mai la traça (stack) al client
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cos de la petició no és un JSON vàlid" });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: "Error intern del servidor" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
