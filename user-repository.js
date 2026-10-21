import bcrypt from "bcryptjs";
import DBLocal from "db-local";
import crypto from "node:crypto";
import { SALT_ROUNDS } from "./config.js";

const { Schema } = new DBLocal({ path: "./db" });

// Esquema de dades amb els camps especificats (es guarda a db/User.json)
const User = Schema("User", {
  _id: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

// Llança un error amb un codi HTTP associat
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

// Classe per crear usuaris, fer login i consultar-los
export class UserRepository {
  // El rol per defecte és "user". Les rutes públiques MAI passen el rol (només el seed)
  static async create({ username, password, role = "user", id = crypto.randomUUID() }) {
    // 1. Validacions
    Validation.username(username);
    Validation.password(password);

    // 2. Assegurar-se que el username no existeix
    const user = User.findOne({ username });
    if (user) fail(409, "El nom d'usuari ja existeix");

    // 3. Encriptem la contrasenya (hash és asíncron: no bloqueja el fil principal)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Creem l'usuari
    User.create({
      _id: id,
      username,
      password: hashedPassword,
      role,
    }).save();

    return id;
  }

  static async login({ username, password }) {
    Validation.username(username);
    Validation.password(password);

    const user = User.findOne({ username });
    // Mateix missatge si falla l'usuari o la contrasenya (no donem pistes)
    if (!user) fail(401, "Credencials incorrectes");

    // bcrypt.compare no desencripta: encripta la contrasenya i compara
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) fail(401, "Credencials incorrectes");

    // Per no enviar el password copiem tot el contingut menys el password
    const { password: _, ...publicUser } = user;
    return publicUser;
  }

  static findByUsername(username) {
    return User.findOne({ username });
  }

  static findById(id) {
    const user = User.findOne({ _id: id });
    if (!user) return undefined;
    const { password: _, ...publicUser } = user;
    return publicUser;
  }
}

class Validation {
  static username(username) {
    if (typeof username != "string") fail(400, "L'usuari ha de ser text");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      fail(400, "L'usuari ha de tenir entre 3 i 20 caràcters (lletres, números o _)");
  }

  static password(password) {
    if (typeof password != "string") fail(400, "La contrasenya ha de ser text");
    if (password.length < 8 || password.length > 72 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      fail(400, "La contrasenya ha de tenir mínim 8 caràcters, amb lletres i números");
  }
}
