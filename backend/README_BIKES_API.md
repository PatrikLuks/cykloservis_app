# Bikes API

Komplexní popis endpointů pro správu kol v aplikaci.

## Model (Bike)
Pole | Typ | Poznámka
---- | --- | -------
`title` | String (req) | Název kola
`type` | String | Typ (Horské, Silniční...)
`manufacturer` | String | Výrobce
`model` | String | Model označení
`year` | Number | 1900–2100
`minutesRidden` | Number | >=0, uložené minuty
`imageUrl` | String | Base64 `data:image/...` nebo URL (MVP)
`driveBrand` | String | Značka pohonu
`driveType` | String | Typ pohonu
`color` | String | Barva
`brakes` | String | Brzdy
`suspension` | String | Odpružení
`suspensionType` | String | Typ odpružení
`specs` | String | Specifikace
`deletedAt` | Date | Soft delete timestamp

Indexy: `(ownerEmail, createdAt)`, `(ownerEmail, deletedAt)`.

## Autentizace
Všechny níže uvedené endpointy kromě administrátorského hard delete vyžadují platný JWT (Bearer token). `ownerEmail` se vždy odvozuje ze session, ignoruje se z payloadu.

## Rate limits & limity
- POST /bikes: max 30 požadavků / 15 min / IP (konfigurovatelné ENV `CREATE_BIKE_RATE_MAX`).
- Maximální počet kol na uživatele: `MAX_BIKES_PER_USER` (default 100, env proměnná).
- Obrázky Base64: max ~1.2MB délka řetězce, MIME povoleno png|jpg|jpeg|webp.
- Multipart upload: max 1MB na soubor (serverový limit multeru).

## Endpointy

### GET /bikes
Vrátí seznam nesmazaných (bez `deletedAt`) kol uživatele seřazený desc dle vytvoření.

### GET /bikes/deleted
Vrátí seznam soft-smazaných kol (ty, které mají `deletedAt`).

### POST /bikes
Vytvoří kolo. Body (JSON) – minimálně `title`. Volitelná pole viz model. `imageUrl` validováno: délka + MIME pattern.

### GET /bikes/:id
Detail kola (pokud patří uživateli a není soft-deleted).

### PUT /bikes/:id
Update subsetu polí. Nelze měnit `ownerEmail`. Obrázek podléhá stejným limitům.

### DELETE /bikes/:id
Soft delete – nastaví `deletedAt`. Opakované mazání vrátí `{ ok:true, softDeleted:false }` pokud už bylo.

### POST /bikes/:id/restore
Obnoví soft-deleted kolo (smaže `deletedAt`). 404 pokud neexistuje nebo není smazané.

### DELETE /bikes/:id/hard (ADMIN)
Trvalé odstranění kola – vyžaduje aby JWT payload obsahoval `role: "admin"`.

### POST /bikes/:id/image
Multipart upload / výměna obrázku. Pole formuláře: `image`. Povoleny typy: png, jpg/jpeg, webp. Po úspěchu server uloží soubor na disk (`/uploads/bikes/...`) a do `imageUrl` uloží relativní cestu.

## Skripty
Název | Popis
----- | -----
`npm run purge:bikes` | Trvale smaže kola s `deletedAt <= nyní - BIKE_PURGE_DAYS` (default 30 dní).
`npm run migrate:bikes:ownerEmailLower` | Normalizuje `ownerEmail` na lowercase u existujících dokumentů.

## Migrační proměnné
- `MAX_BIKES_PER_USER` – limit kol.
- `BIKE_PURGE_DAYS` – počet dní pro purge.

## Plánovaná vylepšení
- Generování náhledů / optimalizace (sharp, webp konverze, různé velikosti).
- Caching agregovaných statistik (počet servisů, km) pro dashboard.
- Validace reálné dekomprimované velikosti Base64 vs. deklarovaný MIME.
- Endpoint pro přidělení / změnu role uživatele (admin promotion) + audit.

