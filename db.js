// Funcions per llegir i escriure els fitxers JSON de la carpeta db/
// (executa sempre "node server.js" des de la carpeta arrel del projecte)
import fs from "fs";

const readData = (name) => {
  try {
    const data = fs.readFileSync(`./db/${name}.json`);
    return JSON.parse(data);
  } catch (error) {
    console.error(error);
    return [];
  }
};

const writeData = (name, data) => {
  try {
    fs.writeFileSync(`./db/${name}.json`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
  }
};

// Següent id lliure d'una llista
const nextId = (list) => (list.length === 0 ? 1 : Math.max(...list.map((i) => i.id)) + 1);

export { readData, writeData, nextId };
