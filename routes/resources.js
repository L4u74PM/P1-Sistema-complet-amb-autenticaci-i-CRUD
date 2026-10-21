// CRUD de recursos: /resources
// Llegir: qualsevol usuari autenticat. Crear/modificar/esborrar: només admin.
import { Router } from "express";
import { readData, writeData, nextId } from "../db.js";
import { requireAdmin } from "../middleware.js";

const router = Router();

// Valida les dades d'un recurs. Retorna un missatge d'error o null si tot està bé
const validateResource = ({ name, type, capacity }) => {
  if (typeof name !== "string" || name.trim().length < 2) return "El nom ha de tenir mínim 2 caràcters";
  if (typeof type !== "string" || type.trim().length < 2) return "El tipus és obligatori";
  if (!Number.isInteger(capacity) || capacity < 1) return "La capacitat ha de ser un enter major que 0";
  return null;
};

// READ (tots)
router.get("/", (req, res) => {
  res.json(readData("resources"));
});

// READ (un)
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const resource = readData("resources").find((r) => r.id === id);
  if (!resource) return res.status(404).json({ error: "Recurs no trobat" });
  res.json(resource);
});

// CREATE
router.post("/", requireAdmin, (req, res) => {
  const error = validateResource(req.body);
  if (error) return res.status(400).json({ error });

  const resources = readData("resources");
  const newResource = {
    id: nextId(resources),
    name: req.body.name.trim(),
    type: req.body.type.trim(),
    capacity: req.body.capacity,
  };
  resources.push(newResource);
  writeData("resources", resources);
  res.status(201).json(newResource);
});

// UPDATE
router.put("/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const resources = readData("resources");
  const index = resources.findIndex((r) => r.id === id);
  if (index === -1) return res.status(404).json({ error: "Recurs no trobat" });

  // Barregem les dades antigues amb les noves i validem el resultat
  const updated = { ...resources[index], ...req.body, id };
  const error = validateResource(updated);
  if (error) return res.status(400).json({ error });

  resources[index] = {
    id,
    name: updated.name.trim(),
    type: updated.type.trim(),
    capacity: updated.capacity,
  };
  writeData("resources", resources);
  res.json(resources[index]);
});

// DELETE
router.delete("/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const resources = readData("resources");
  const index = resources.findIndex((r) => r.id === id);
  if (index === -1) return res.status(404).json({ error: "Recurs no trobat" });

  // Regla: no s'esborra un recurs que té reserves
  const hasBookings = readData("bookings").some((b) => b.resourceId === id);
  if (hasBookings) return res.status(409).json({ error: "El recurs té reserves, no es pot eliminar" });

  resources.splice(index, 1);
  writeData("resources", resources);
  res.json({ message: "Recurs eliminat" });
});

export default router;
