## Licence a vlastnictví

Tento software a veškerý jeho zdrojový kód je 100% vlastnictvím Patrika Lukse a Adama Kroupy. Veškerá práva vyhrazena. Jakékoli použití, kopírování, šíření nebo úpravy jsou bez výslovného písemného souhlasu obou autorů zakázány. Podrobnosti viz soubor LICENSE.

## Monitoring, alerting a strategické checklisty

- **Monitoring & Alerting**: Kompletní pokrytí backendu i frontendu (Prometheus, Sentry, Alertmanager, CI testy)
- **Výkonnostní testy**: Load test backendu pomocí k6 (`backend/tests/loadtest.k6.js`, `npm run loadtest`)
- **Asset audit**: Analýza velikosti bundle pomocí `rollup-plugin-visualizer` (`frontend/vite.config.js`)
- **Checklisty**: Pravidelný audit monitoringu, alertingu, výkonu a assetů (`MONITORING_ALERTING_AUDIT_CHECKLIST.md`, `PERFORMANCE_ASSET_AUDIT_CHECKLIST.md`)
- **Onboarding**: Aktuální onboarding a provozní dokumentace v `ONBOARDING_CHECKLIST.md`, `MONITORING_ALERTING_README.md`, `PERFORMANCE_ASSET_AUDIT_CHECKLIST.md`

### Rychlé odkazy

- [Monitoring & Alerting README](MONITORING_ALERTING_README.md)
- [Výkonnostní a asset audit checklist](PERFORMANCE_ASSET_AUDIT_CHECKLIST.md)
- [Onboarding checklist](ONBOARDING_CHECKLIST.md)

---

## Rychlý start: Spuštění celé aplikace ServisKol

### Dokumentace Bikes API

Detailní popis všech endpointů kol, limitů, soft delete, restore a skriptů naleznete v souboru `backend/README_BIKES_API.md`.

## Spuštění v Dockeru

1. Otevřete terminál a přejděte do kořenové složky projektu:
   ```sh
   cd /Users/patrikluks/Applications/serviskol
   ```
2. Spusťte všechny služby najednou:

   ```sh
   docker-compose up --build
   ```

   - Frontend poběží na http://localhost:8080
   - Backend poběží na http://localhost:3001
   - MongoDB na portu 27017

3. Pro zastavení všech služeb použijte:
   ```sh
   docker-compose down
   ```

---

## Seedování testovacích dat

Pro naplnění databáze testovacími uživateli spusťte:

```sh
node backend/scripts/seedTestData.js
```

- Vloží dva uživatele (klient a technik, heslo: test123).
- Ujistěte se, že běží MongoDB a máte správně nastavený `MONGODB_URI` v `.env`.

---

## Rychlý start bez Dockeru

1. Otevřete terminál a přejděte do kořenové složky projektu:
   ```sh
   cd /Users/patrikluks/Applications/serviskol
   ```
2. Nainstalujte závislosti (pouze při prvním spuštění nebo po změně balíčků):
   ```sh
   npm install
   ```
3. Spusťte celý projekt jedním příkazem:

   ```sh
   npm run dev
   ```

   - Tím se automaticky spustí backend i frontend.
   - Frontend poběží na adrese, kterou vypíše terminál (obvykle http://localhost:5173).
   - Backend poběží na http://localhost:3001.
   - Frontend volá API na implicitní adrese `http://localhost:5001` (viz `frontend/.env.example`). Pro změnu:
     1. Zkopírujte `frontend/.env.example` na `frontend/.env`.
     2. Upravte hodnotu `VITE_API_BASE_URL`.
     3. Restartujte frontend (vite načítá env při startu).

## 4. Chyby sledujte v terminálu

Pokud se objeví chyba, zkopírujte ji a pošlete ji vývojáři nebo do chatu s podporou.

---

Pro samostatné spuštění backendu nebo frontendu:

- Backend:
  ```sh
  cd backend
  npm start
  ```
- Frontend:
  ```sh
  cd frontend
  npm run dev
  ```

---

## Testování a coverage

### Coverage badge

[![Coverage](https://codecov.io/gh/PatrikLuks/cykloservis_app/graph/badge.svg?token=TOKEN)](https://codecov.io/gh/PatrikLuks/cykloservis_app)

> Po aktivaci repozitáře v Codecov lze odebrat `?token=TOKEN` pokud není nutný.

- Spuštění všech backend testů:
  ```sh
  cd backend && npm test
  ```
- Spuštění coverage reportu backendu:
  ```sh
  cd backend && npm run coverage
  # nebo
  npx jest --coverage
  ```
- Spuštění frontend testů:
  ```sh
  cd frontend && npm run test
  ```
- Coverage reporty najdete v Codecov (viz badge výše).

### Diff coverage gate & Git hooks

Repo má nakonfigurované Git hooky přes Husky:

| Hook         | Funkce                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | Spustí `lint-staged`, automatický prettier + ESLint fix a následně type-check.                                                                  |
| `commit-msg` | Ověření Conventional Commits pomocí `commitlint`.                                                                                               |
| `pre-push`   | Pokud existují změny v `backend/**/*.js`, spustí (podmíněně) backend testy s coverage a diff coverage gate (min. 80 % pokrytí změněných řádků). |

Diff coverage znamená: procento řádků, které jste změnili (v porovnání s `origin/main`), jež jsou pokryté testy. Skript: `backend/scripts/diffCoverage.js`.

Chování `pre-push` hooku:

1. Zjistí změněné backend JS soubory vůči `origin/main` (fallback `HEAD~1`).
2. Pokud žádné – hook se ukončí (rychlý push).
3. Pokud jsou změny, zkontroluje, zda je třeba znovu generovat coverage (chybí `backend/coverage/lcov.info` nebo změněné testy).
4. Spustí `npm run test:backend:coverage` (runInBand pro determinismus) jen pokud je potřeba.
5. Spustí diff coverage gate s prahem 80 % (override: `DIFF_COV_THRESHOLD=75 git push`).

Lokální ruční spuštění diff coverage (např. pro PR před push):

```sh
node backend/scripts/diffCoverage.js --threshold 80
```

Možné vylepšení do budoucna:

- Přidat podporu pro TypeScript/TS soubory (pokud se zavedou) – mapování sourcemap.
- Volitelný mód, který se napojí na `git merge-base` pro složitější rebasované větve.
- Vystavení diff coverage výsledků jako badge z CI.

### Bezpečný upload obrázků kol

Implementováno v endpointu `POST /bikes/:id/image`:

- Whitelist MIME: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`.
- Limit velikosti souboru: 1 MB (multer `limits.fileSize`).
- Server generuje sanitizovaný název: `<bikeId>_<timestamp>_<random>.ext` (žádný user input).
- Validace magic bytes knihovnou `file-type` (pokud dostupná). V přísném režimu musí být typ detekovatelný.
- Odstranění starého souboru po úspěšném nahrání nového.

Proměnné prostředí:

| Proměnná              | Výchozí           | Popis                                                                 |
| --------------------- | ----------------- | --------------------------------------------------------------------- |
| `STRICT_UPLOAD_MAGIC` | `0`               | Pokud `1`, vyžaduje detekovatelný povolený typ souboru (magic bytes). |
| `BIKES_UPLOAD_DIR`    | `./uploads/bikes` | Cílový adresář pro ukládání obrázků.                                  |
| `MAX_JSON_BODY`       | `2mb`             | Limit JSON payloadu (např. Base64 image).                             |

Testy:

- `backend/tests/bikes.test.js` (standardní upload – relaxed režim)
- `backend/tests/bikes.upload.strict.test.js` (odmítnutí nevalidního PNG v přísném režimu)

Plánované rozšíření:

- Volitelný AV scan (ClamAV / externí služba)
- Specifický rate limit pro image upload endpoint
- pHash pro detekci duplicitních obrázků
- Periodický cleanup osiřelých souborů

---

## CI/CD a Docker stack v praxi

- Každý commit spouští workflow: lint, testy, build, coverage, audit, build Docker image, push na Docker Hub.
- CI ověřuje, že celý Docker stack lze sestavit a spustit (`docker-compose up --build`).
- Automaticky se kontroluje dostupnost backendu (`/api/health/health`) i frontendu (`/`).
- Pokud některá služba není dostupná, v CI se zobrazí logy kontejnerů pro snadné ladění.
- Po dokončení testů se stack automaticky ukončí a uklidí.

### Release automation (semantic-release)

Repo používá automatizované verzování pomocí `semantic-release`.

- Konvence commitů: Conventional Commits (lintováno přes commit-msg hook commitlint).
- Branch strategie: `main` (stable), volitelné pre-release větve `next`, `beta`, `alpha`.
- Typ verze se určí z commitů (`feat`=minor, `fix`=patch, `BREAKING CHANGE`=major).
- Generuje se `CHANGELOG.md` a GitHub Release – verze se zapíše do `package.json` (root + balíčky).

Příklady validních commit zpráv:

```
feat(auth): přidání dvoufaktorové autentizace
fix(bikes): korekce limitu velikosti obrázku
perf(metrics): optimalizace histogram buckets
docs(readme): doplnění sekce o release procesu
refactor(serviceRequests): zjednodušení validace
chore(ci): úprava cache nastavení
```

### Troubleshooting Docker v CI

- Pokud CI selže na Docker stacku, zkontrolujte logy v příslušném jobu (sekce "Show backend logs", "Show frontend logs").
- Nejčastější chyby: špatné proměnné prostředí, obsazené porty, chybějící závislosti v Dockerfile.
- Pro lokální testování použijte stejné příkazy jako v CI:
  ```sh
  docker-compose up --build
  # ...testování...
  docker-compose down -v
  ```

---

## Troubleshooting CI/CD a e2e testů

- Pokud CI/CD pipeline selže, zkontrolujte logy v příslušném jobu na GitHub Actions.
- Nejčastější chyby:
  - Backend nebo frontend se nespustí (chyba v Dockerfile, špatné proměnné prostředí, obsazené porty)
  - Selhání testů (unit, integrační, e2e) – zkontrolujte výstup testů a opravte chyby v kódu
  - E2E testy selžou kvůli nedostupnosti serverů – ověřte, že backend i frontend jsou správně spuštěny a dostupné na očekávaných portech
  - Problémy s MongoDB – ověřte, že služba běží a proměnná `MONGODB_URI` je správně nastavena
- Po opravě chyby proveďte nový commit a ověřte, že pipeline projde.
- Pro lokální ladění spusťte testy a buildy podle návodu v tomto README.

---

## Troubleshooting

- Pokud nefunguje build/test, zkontrolujte Node.js a npm verzi (doporučeno Node 18+).
- Problémy s Dockerem: ověřte, že porty nejsou obsazené a Docker daemon běží.
- Problémy s MongoDB: zkontrolujte proměnnou `MONGODB_URI` v `.env`.
- Pokud testy selhávají na mockování, spusťte `npm install` a ověřte, že všechny závislosti jsou aktuální.

---

## Další dokumentace a checklisty

- [ONBOARDING_CHECKLIST.md](ONBOARDING_CHECKLIST.md)
- [ONBOARDING_DEV.md](ONBOARDING_DEV.md)
- [ONBOARDING_MOBILE.md](mobile/ONBOARDING_MOBILE.md)
- [GDPR.md](GDPR.md)
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
- [MONITORING_BACKUP.md](MONITORING_BACKUP.md)

---

## Monitoring a alerting

### Sentry (chybové logy)

- Backend podporuje napojení na Sentry – stačí nastavit proměnnou `SENTRY_DSN` v `.env` nebo v Dockeru.
- Pokud je proměnná nastavena, všechny chyby a výjimky se automaticky odesílají do Sentry projektu.
- Pro aktivaci:
  1. Vytvořte projekt v Sentry (https://sentry.io/).
  2. Zkopírujte DSN a vložte do `.env`:
     ```
     SENTRY_DSN=https://...@sentry.io/...
     ```
  3. Restartujte backend.
- Pokud není DSN nastaveno, Sentry se nepoužívá a běh není ovlivněn.

### Prometheus (monitoring metrik)

- Backend nabízí endpoint `/metrics` (Prometheus format, powered by prom-client).
- Stačí přidat scrape config do Promethea, např.:
  ```yaml
  scrape_configs:
    - job_name: 'serviskol-backend'
      static_configs:
        - targets: ['localhost:3001']
  ```
- Metriky zahrnují request count, response time a další systémové statistiky.
- Doporučeno pro produkční monitoring s Prometheus/Grafana.

#### Vlastní metriky

| Název                                        | Typ       | Popis                                                  |
| -------------------------------------------- | --------- | ------------------------------------------------------ |
| `cyklo_http_request_duration_ms`             | Histogram | Latence HTTP dle method/route/status                   |
| `cyklo_http_requests_total`                  | Counter   | Počty požadavků dle method/route/status                |
| `cyklo_http_requests_in_flight`              | Gauge     | Počet paralelně běžících požadavků                     |
| `cyklo_http_request_errors_total`            | Counter   | Chybové odpovědi (4xx/5xx) dle status class            |
| `cyklo_http_status_class_total`              | Counter   | Odpovědi agregované na status class                    |
| `cyklo_apdex_total` / satisfied / tolerating | Counter   | Apdex komponenty (T konfig. proměnnou `APDEX_T_MS`)    |
| `cyklo_rate_limit_rejected_total`            | Counter   | Odmítnuté požadavky rate limiterem                     |
| `cyklo_last_request_id_info`                 | Gauge     | Debug: poslední `x-request-id` (nepoužívat pro alerty) |

#### Korelační ID

Každý požadavek dostane/propaguje `x-request-id` (UUID). Je vracen v odpovědi a objevuje se v aplikačních logách pro snadné dohledání toku. Gauge `cyklo_last_request_id_info` drží poslední ID jen pro rychlou manuální orientaci (není vhodné jej scrapeovat ve vysoké frekvenci ani na něj stavět alerting).

---

## Bezpečnost a údržba

- Pravidelně spouštějte `npm audit` a sledujte badge v README.
- Docker image backendu je optimalizován: obsahuje pouze production závislosti, devDependencies a testy nejsou součástí výsledného image.
- Backend běží v Dockeru pod neprivilegovaným uživatelem (`appuser`).
- V produkci neexponujte port MongoDB do veřejné sítě.
- Pravidelně aktualizujte závislosti (`npm update`, `npm audit fix`).
- Sledujte alerty v Sentry a metriky v Prometheus.

---

## Jak přispívat

- Před úpravami si přečtěte [CONTRIBUTING.md](CONTRIBUTING.md).
- Pro každou změnu vytvořte novou větev, pište testy a popisné commity.
- Všechny PR musí projít CI/CD (lint, testy, build, coverage, audit, Docker build).
- Pravidelně aktualizujte závislosti (Dependabot).

---

Pro dotazy a zpětnou vazbu kontaktujte hlavního maintenera nebo využijte issues v repozitáři.

---

## Další poznámky k Dockeru

- Frontend Dockerfile je optimalizován: výsledný image obsahuje pouze produkční build, devDependencies nejsou součástí image.
- Build probíhá v oddělené fázi, výsledný statický web běží v Nginx (alpine).
- Pro lokální build a testování použijte:
  ```sh
  docker build -f Dockerfile.frontend -t serviskol-frontend:latest .
  docker run -p 8080:80 serviskol-frontend:latest
  ```

---

## E2E testy (Playwright)

Používáme Playwright pro end-to-end scénáře (registrace, ověření kódu, dokončení profilu).

Struktura testů: `frontend/tests/e2e`.

Spuštění (lokálně):

```sh
cd frontend
npm run test:e2e
```

Rychlý end-to-end běh včetně startu stacku a povolených test-utils:

```sh
npm run e2e:local
```

Pro plný registrační flow je třeba povolit test-utils endpointy spuštěním backendu s proměnnou:

```sh
ENABLE_TEST_UTILS=1 npm run dev
```

V CI e2e jobu je proměnná nastavena automaticky přes docker-compose (`ENABLE_TEST_UTILS=1`).

Playwright ukládá trace a video pro retry (viz `playwright.config.ts`).

### Remote dev offloading

Pro odlehčení lokálnímu stroji lze synchronizovat zdrojové kódy na vzdálený server pomocí `rsync` skriptů:

Proměnné prostředí:

- `REMOTE_DEV_HOST` (např. `user@server`)
- `REMOTE_DEV_PATH` (např. `/home/user/cykloapp`)

Příkazy:

```sh
npm run remote:sync:backend
npm run remote:sync:frontend
npm run remote:sync
```

Na vzdáleném serveru poprvé:

```sh
cd backend && npm install && cd ../frontend && npm install
```

Následně lze spustit docker-compose nebo jednotlivé služby. Pro průběžnou synchronizaci lze použít watch nástroj (např. `fswatch` + opakovaný rsync) dle potřeby.
