# Sistema de reserves

Aplicació Express per gestionar recursos i reserves. Les dades es guarden en fitxers JSON dins de `db/` (els usuaris, a `db/User.json`, que es crea en iniciar el servidor).

## Inici

```bash
npm install
npm start
```

El servidor s'executa a `http://localhost:3000`. Cal executar-lo des de la carpeta arrel del projecte.

## Usuaris de prova

| Usuari | Contrasenya | Rol |
|---|---|---|
| admin | Admin1234 | Administrador |
| maria | Maria1234 | Usuari |
| joan | Joan1234 | Usuari |

Els registres nous sempre tenen el rol d'usuari. En registrar-se, la sessió s'inicia automàticament.

## Rutes principals

| Mètode | Ruta | Accés |
|---|---|---|
| GET | `/` | Inici |
| GET | `/login` | Formulari d'inici de sessió i registre |
| POST | `/login` | Iniciar sessió |
| POST | `/register` | Registrar-se |
| GET o POST | `/logout` | Tancar sessió |
| GET | `/protected` | Pàgina privada (recursos, reserves i notificacions de l'usuari) |
| GET | `/profile` | Perfil |
| GET | `/manage/resources` | Gestió de recursos (crear, editar i eliminar només per a l'admin) |
| GET | `/manage/bookings` | Gestió de reserves |

## API REST

Les rutes `/resources` i `/bookings` requereixen autenticació. Admeten les operacions habituals de consulta, creació, modificació i eliminació:

| Mètode | Ruta | Accés |
|---|---|---|
| GET | `/resources`, `/resources/:id` | Usuaris autenticats |
| POST, PUT, DELETE | `/resources`, `/resources/:id` | Només administrador |
| GET | `/bookings`, `/bookings/:id` | L'usuari veu les seves; l'admin, totes |
| POST | `/bookings` | Usuaris autenticats |
| PUT, DELETE | `/bookings/:id` | Propietari de la reserva o administrador |

### Codis de resposta

`200` correcte · `201` creat · `400` dades invàlides · `401` no autenticat · `403` sense permisos · `404` no trobat · `409` conflicte (usuari duplicat, solapament...)

## Estructura

```
server.js            Configuració d'Express i muntatge de rutes
config.js            PORT, SALT_ROUNDS i SECRET_JWT_KEY
middleware.js        authenticate, requireAuth, requirePage, requireAdmin
user-repository.js   Usuaris: validació, bcrypt i db-local
db.js                readData / writeData per als fitxers JSON
routes/              auth.js, pages.js, resources.js, bookings.js
views/               Plantilles EJS
public/              styles.css i js/ (register.js, resources.js, bookings.js)
db/                  resources.json, bookings.json, notifications.json (+ User.json)
request.http         Proves amb REST Client
```
