// Pàgines EJS per gestionar els CRUD des del navegador: /manage/resources i /manage/bookings
// (les dades es modifiquen amb fetch cap a l'API REST: /resources i /bookings)
import { Router } from "express";
import { requirePage } from "../middleware.js";
import { readData } from "../db.js";
import { UserRepository } from "../user-repository.js";

const router = Router();

router.get("/resources", requirePage, (req, res) => {
  res.render("manage-resources", { resources: readData("resources") });
});

router.get("/bookings", requirePage, (req, res) => {
  const me = req.session.user;
  const resources = readData("resources");

  // L'admin veu totes les reserves; l'usuari només les seves
  let bookings = readData("bookings");
  if (me.role !== "admin") {
    bookings = bookings.filter((b) => b.userId === me.id);
  }

  bookings = bookings
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((b) => {
      const resource = resources.find((r) => r.id === b.resourceId);
      const owner = UserRepository.findById(b.userId);
      return {
        ...b,
        resourceName: resource ? resource.name : "Recurs eliminat",
        ownerName: owner ? owner.username : "desconegut",
      };
    });

  res.render("manage-bookings", { resources, bookings });
});

export default router;
