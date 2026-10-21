// Middlewares d'autenticació mitjançant JWT i autorització segons el rol de l'usuari.
import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY } from "./config.js";

// Llegeix el token des de la cookie o de la capçalera Authorization,
// el valida i l'emmagatzema a req.session.user perquè estigui disponible
// durant la petició.
const authenticate = (req, res, next) => {
  req.session = { user: null };

  let token = req.cookies.access_token;
  const header = req.headers.authorization;
  if (!token && header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (token) {
    try {
      req.session.user = jwt.verify(token, SECRET_JWT_KEY); // falla si el token és invàlid o ha caducat
    } catch (error) {
      req.session.user = null;
    }
  }

  res.locals.user = req.session.user; // disponible a les plantilles EJS
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Cal iniciar sessió (token absent, invàlid o caducat)" });
  }
  next();
};

// Per a pàgines protegides: si l'usuari no està autenticat, el redirigim a /login.
const requirePage = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// Autorització: si l'usuari no és administrador, retornem 403 Forbidden.
const requireAdmin = (req, res, next) => {
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Només un administrador pot fer aquesta acció" });
  }
  next();
};

export { authenticate, requireAuth, requirePage, requireAdmin };
