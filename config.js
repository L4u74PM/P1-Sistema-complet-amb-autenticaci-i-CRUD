// Configuració de l'aplicació (es pot canviar amb variables d'entorn)
export const PORT = process.env.PORT ?? 3000;

// Rondes de "salt" de bcrypt: més valor = més segur però més lent
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS ?? 10);

// Clau secreta per signar els JWT. En producció cal definir-la amb una variable d'entorn!
export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY ?? "clau-secreta-nomes-per-desenvolupar";
