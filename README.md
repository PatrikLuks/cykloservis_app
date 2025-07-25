# ServisKol

![CI](https://github.com/<VASE-REPO-URL>/actions/workflows/ci.yml/badge.svg)
![Backend Coverage](https://codecov.io/gh/<VASE-REPO-URL>/branch/main/graph/badge.svg?flag=backend)
![Frontend Coverage](https://codecov.io/gh/<VASE-REPO-URL>/branch/main/graph/badge.svg?flag=frontend)
![E2E Tests](https://github.com/<VASE-REPO-URL>/actions/workflows/ci.yml/badge.svg?branch=main&event=push)

---


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
- Spuštění e2e testů (Cypress):
  ```sh
  cd frontend && npx cypress open
  ```
- Coverage reporty najdete v Codecov (viz badge výše).

---

## CI/CD a Docker stack v praxi

- Každý commit spouští workflow: lint, testy, build, coverage, audit, build Docker image, push na Docker Hub.
- CI ověřuje, že celý Docker stack lze sestavit a spustit (`docker-compose up --build`).
- Automaticky se kontroluje dostupnost backendu (`/api/health/health`) i frontendu (`/`).
- Pokud některá služba není dostupná, v CI se zobrazí logy kontejnerů pro snadné ladění.
- Po dokončení testů se stack automaticky ukončí a uklidí.

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

## E2E testy (Cypress)

- Pro ověření funkčnosti loginu, registrace a dalších klíčových scénářů používejte Cypress e2e testy.
- Testy najdete ve složce `frontend/cypress/e2e`.
- Pro běh testů musí být spuštěn backend (`localhost:3001`) i frontend (`localhost:5173`).

### Spuštění e2e testů:
```sh
cd frontend
npm run test:e2e   # interaktivní režim
npx cypress run    # headless režim
```

### Troubleshooting
- Pokud Cypress nenajde frontend, ujistěte se, že běží na správném portu (`5173`).
- Pokud testy selžou, zkontrolujte síťové požadavky, konzoli a logy backendu.
- Pro první spuštění může být nutné nainstalovat Cypress: `npx cypress install`
