// CRUD de reserves: /bookings
// Cada usuari gestiona les seves reserves; l'admin pot gestionar-les totes.
import { Router } from "express";
import { readData, writeData, nextId } from "../db.js";

const router = Router();

// Crea una notificació per a un usuari (db/notifications.json)
const addNotification = (userId, message) => {
  const notifications = readData("notifications");
  notifications.push({
    id: nextId(notifications),
    userId,
    message,
    date: new Date().toISOString(),
  });
  writeData("notifications", notifications);
};

// Comprova si l'usuari pot veure/modificar la reserva (propietari o admin)
const canAccess = (user, booking) => user.role === "admin" || booking.userId === user.id;

// Valida les dades d'una reserva i les regles de negoci.
// Retorna { status, error } si hi ha algun problema, o null si tot està bé.
const validateBooking = ({ resourceId, start, end }, ignoreId = null) => {
  const resource = readData("resources").find((r) => r.id === resourceId);
  if (!Number.isInteger(resourceId) || !resource) {
    return { status: 404, error: "El recurs no existeix" };
  }

  if (typeof start !== "string" || typeof end !== "string") {
    return { status: 400, error: "Cal indicar start i end (format 2027-01-20T10:00:00Z)" };
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate) || isNaN(endDate)) {
    return { status: 400, error: "Les dates no són vàlides" };
  }
  if (endDate <= startDate) {
    return { status: 400, error: "La data de fi ha de ser posterior a la d'inici" };
  }

  // Regla de negoci: no es pot solapar amb una altra reserva del mateix recurs
  const overlap = readData("bookings").some(
    (b) =>
      b.id !== ignoreId &&
      b.resourceId === resourceId &&
      startDate < new Date(b.end) &&
      new Date(b.start) < endDate
  );
  if (overlap) {
    return { status: 409, error: "El recurs ja està reservat en aquest horari" };
  }

  return null;
};

// READ (totes): l'admin veu totes, l'usuari només les seves
router.get("/", (req, res) => {
  const me = req.session.user;
  let bookings = readData("bookings");
  if (me.role !== "admin") {
    bookings = bookings.filter((b) => b.userId === me.id);
  }
  res.json(bookings);
});

// READ (una)
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const booking = readData("bookings").find((b) => b.id === id);
  if (!booking) return res.status(404).json({ error: "Reserva no trobada" });
  if (!canAccess(req.session.user, booking)) {
    return res.status(403).json({ error: "No tens permís per veure aquesta reserva" });
  }
  res.json(booking);
});

// CREATE
router.post("/", (req, res) => {
  const { resourceId, start, end } = req.body;
  const problem = validateBooking({ resourceId, start, end });
  if (problem) return res.status(problem.status).json({ error: problem.error });

  const bookings = readData("bookings");
  const newBooking = {
    id: nextId(bookings),
    userId: req.session.user.id, // sempre és l'usuari del token
    resourceId,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
  };
  bookings.push(newBooking);
  writeData("bookings", bookings);

  addNotification(newBooking.userId, `Reserva #${newBooking.id} creada correctament`);
  res.status(201).json(newBooking);
});

// UPDATE
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const bookings = readData("bookings");
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: "Reserva no trobada" });
  if (!canAccess(req.session.user, bookings[index])) {
    return res.status(403).json({ error: "No tens permís per modificar aquesta reserva" });
  }

  // Dades noves, o les antigues si no s'envien
  const data = {
    resourceId: req.body.resourceId ?? bookings[index].resourceId,
    start: req.body.start ?? bookings[index].start,
    end: req.body.end ?? bookings[index].end,
  };
  const problem = validateBooking(data, id);
  if (problem) return res.status(problem.status).json({ error: problem.error });

  bookings[index] = {
    ...bookings[index],
    resourceId: data.resourceId,
    start: new Date(data.start).toISOString(),
    end: new Date(data.end).toISOString(),
  };
  writeData("bookings", bookings);

  addNotification(bookings[index].userId, `Reserva #${id} modificada`);
  res.json(bookings[index]);
});

// DELETE
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const bookings = readData("bookings");
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: "Reserva no trobada" });
  if (!canAccess(req.session.user, bookings[index])) {
    return res.status(403).json({ error: "No tens permís per eliminar aquesta reserva" });
  }

  const [removed] = bookings.splice(index, 1);
  writeData("bookings", bookings);

  addNotification(removed.userId, `Reserva #${id} cancel·lada`);
  res.json({ message: "Reserva eliminada" });
});

export default router;
