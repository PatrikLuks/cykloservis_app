# Spuštění projektu (Backend + Frontend)

## Rychlý start
```bash
# Instalace (root spustí instalace i v /backend a /frontend)
npm install

# Vývoj (společné výstupy, backend + frontend, nodemon)
npm run dev
```

## Dostupné skripty (root `package.json`)
| Skript | Popis |
|--------|-------|
| dev / dev:attached / dev:both | Backend (nodemon) + frontend přes concurrently |
| dev:backend | Backend bez watch |
| dev:backend:watch | Backend s nodemon (přímý) |
| dev:frontend | Frontend (CRA) |
| dev:backend:detached | Backend na pozadí (PID v backend.pid, log backend.out.log) |
| dev:backend:detached:watch | Backend (nodemon) na pozadí |
| dev:detached | Backend detached + frontend v popředí |
| stop:backend | Ukončí detached backend |
| health / health:url | Ověří /api/health/health endpoint |

## Logy
- Detached režimy zapisují do `backend.out.log` (ignorováno v Gitu).
- V attached režimu jsou prefixy `backend` a `frontend` barevně odlišeny.

## Konfigurace
- `.env` (viz `.env.example`) musí obsahovat `MONGO_URI`.
- `nodemon.json` definuje watch cestu.

## Health check
```bash
npm run health
# nebo vlastní URL
node scripts/healthCheck.js http://localhost:5001/api/health/health
```
Exit kódy: 0 OK, 2-4 různé chyby (tělo, parse, síť/timeout).

## Typické workflow
1. Vytvoř `.env` z `.env.example` a uprav MONGO_URI.
2. `npm install`
3. `npm run dev`
4. Otevři http://localhost:3000
5. Změny v backendu vyvolají restart nodemonu.

## Úklid / Stop
- Ctrl+C (dvakrát pokud se ptá concurrently) ukončí oba procesy.
- Detached backend: `npm run stop:backend`.

## Potíže & řešení
| Problém | Příčina | Řešení |
|---------|---------|--------|
| Backend hlásí `uri must be a string` | Chybí MONGO_URI | Zkontroluj `.env` |
| Exit code 130 | Ctrl+C | Očekávané, není chyba |
| Frontend běží, backend ne | Přerušen backend nebo špatný MONGO_URI | Zkontroluj log / health |

