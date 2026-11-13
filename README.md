# Drehkreuz‑Armbändchen

Dieses Projekt verwaltet die Ausgabe und Rückgabe von Armbändern mit Chip‑Nummer
für ein Drehkreuz‑System. Es ist **plattformunabhängig** und läuft unter
Windows, Linux und Android (PWA). Der Server ist in **Python 3.11+** mit
FastAPI implementiert, die Datenbank ist SQLite und das Frontend ist ein React‑SPA
gebaut mit Vite.
Es wurde  mit KI erzeugt.


## Features

* Mehrbenutzer‑Login (Benutzername / Passwort) mit JWT‑Authentifizierung
* Verwaltung von Nummernkreisen und einzelnen Bändern
* Ausgabe (`ISSUE`) und Rückgabe (`RETURN`) mit Protokollierung
* Automatischer Export (JSON + CSV) 30 Minuten nach der letzten Änderung
* Deutsches UI (lokalisiert für `de‑DE`)
* Responsive Design – funktioniert als Web‑App, PWA (Android) und kann später
  mit Electron als Desktop‑App verpackt werden
* Der Server kann später auf einem Raspberry Pi laufen, jetzt lokal auf jedem
  Rechner.

## Projektstruktur

```
drehkreuz-armbaendchen/
│
├─ backend/                     # Python FastAPI Server
│   ├─ app/
│   │   ├─ main.py
│   │   ├─ models.py
│   │   ├─ crud.py
│   │   ├─ auth.py
│   │   ├─ scheduler.py
│   │   └─ i18n.py
│   ├─ requirements.txt
│   └─ export/                # Wird von Scheduler befüllt (JSON/CSV)
│
├─ client/                      # React‑Vite SPA
│   ├─ src/
│   │   ├─ i18n/de.json
│   │   ├─ components/
│   │   │   ├─ Login.jsx
│   │   │   ├─ Dashboard.jsx
│   │   │   ├─ IssueDialog.jsx
│   │   │   └─ ReturnDialog.jsx
│   │   ├─ services/api.ts
│   │   └─ App.jsx
│   ├─ index.html
│   ├─ vite.config.ts
│   ├─ tailwind.config.cjs
│   ├─ postcss.config.cjs
│   └─ package.json
│
├─ .gitignore
└─ docker-compose.yml (optional für Pi‑Deployment)
```

## Schnellstart (lokal)

### Voraussetzungen
* **Python 3.11+** (https://www.python.org/downloads/)
* **Node.js 20+** (https://nodejs.org/)

### Backend starten
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Der Server ist dann unter `http://localhost:8000` erreichbar.

### Frontend starten
```bash
cd client
npm install
npm run dev   # Vite dev‑Server, standardmäßig http://localhost:5173
```
Das Frontend kommuniziert mit dem Backend über `http://localhost:8000/api`.

### Benutzer anlegen (einmalig)
Im Backend‑Ordner ein Python‑Shell öffnen und folgenden Code ausführen:
```python
from app import crud, models, database
from sqlalchemy.orm import Session

db: Session = database.SessionLocal()
# admin‑Benutzer
crud.create_user(db, username="admin", password="admin123", role="admin")
db.close()
```
Damit kann man sich mit `admin / admin123` einloggen.

## Weiterführende Dokumentation

* **API‑Dokumentation** – automatisch verfügbar unter `http://localhost:8000/docs`
* **Export‑Verzeichnis** – `backend/export/` enthält `export.json` und `export.csv`
* **Docker‑Deployment** – Siehe `docker-compose.yml` (nicht Teil des Minimal‑Setups)

---

Bei Fragen oder Erweiterungswünschen einfach ein Issue öffnen oder per Mail
kontaktieren.

Viel Spaß beim Entwickeln!