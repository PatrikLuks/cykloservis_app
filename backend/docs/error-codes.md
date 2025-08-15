# Error Codes Registry

| Code | Meaning | Typical HTTP | Notes |
|------|---------|--------------|-------|
| VALIDATION_ERROR | Vstupní validace selhala | 400 | `details.errors` nebo specifické pole |
| USER_NOT_FOUND | Uživatel neexistuje | 400 | Auth flow (login, profile, verify-code) |
| INVALID_REQUEST | Neúplný nebo chybný reset požadavek | 400 | reset/verify-reset |
| INVALID_CODE | Chybný verifikační / reset kód | 400 | verify-code, verify-reset-code |
| ACCOUNT_EXISTS | Účet už existuje / ověřen | 400 | register |
| EMAIL_NOT_VERIFIED | Email dosud neověřen | 400 | login, complete-profile |
| PASSWORD_NOT_SET | Heslo není nastaveno | 400 | login |
| INVALID_CREDENTIALS | Nesprávné přihlašovací údaje | 400 | login |
| ALREADY_VERIFIED | Email už byl ověřen | 400 | verify-code |
| BIKE_INVALID | Kolo neplatné nebo nepřístupné | 400 | service-requests create |
| MAX_BIKES_REACHED | Limit kol překročen | 409 | bikes create |
| PAYLOAD_TOO_LARGE | Soubor/obsah příliš velký | 413 | upload, image handling |
| FORBIDDEN | Přístup zakázán | 403 | admin / chráněné operace |
| SERVER_ERROR | Neočekávaná interní chyba | 500 | Zachyceno middlewarem |

## Usage
Všechny chyby používají tvar:
```
{
  "error": "Popis problému",
  "code": "ERROR_CODE",
  "details": { ... } // volitelné
}
```

## Governance
- Přidání nového kódu vyžaduje aktualizovat tento soubor + TS enum + (pokud relevantní) OpenAPI popis.
- Kódy jsou stabilní; změna významu = BREAKING CHANGE.
