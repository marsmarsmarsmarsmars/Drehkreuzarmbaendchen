# Drehkreuz‑Armbändchen

Dieses Projekt verwaltet die Ausgabe und Rückgabe von Armbändern mit Chip‑Nummer für ein Drehkreuz‑System. Es ist **plattformunabhängig** und läuft unter Windows, Linux und Android (PWA). Der Server ist in **Python 3.11+** mit FastAPI implementiert, die Datenbank ist SQLite und das Frontend ist ein React‑SPA gebaut mit Vite.

## Features

* Mehrbenutzer‑Login (Benutzername / Passwort) mit JWT‑Authentifizierung
* Verwaltung von Nummernkreisen und einzelnen Bändern
* Ausgabe (`ISSUE`) und Rückgabe (`RETURN`) mit Protokollierung
* Automatischer Export (JSON + CSV) 30 Minuten nach der letzten Änderung
* Deutsches UI (lokalisiert für `de‑DE`)
* Responsive Design – funktioniert als Web‑App, PWA (Android) und kann später mit Electron als Desktop‑App verpackt werden
* Der Server kann später auf einem Raspberry Pi laufen, jetzt lokal auf jedem Rechner.

## Projektstruktur

```
Drehkreuz‑Armbändchen/
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
└─ README.md
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

# Installation auf Raspberry Pi (ARMv6, Raspberry OS Lite)

Ein einzelner Befehl installiert alles und richtet einen System‑d‑Dienst ein:

```bash
# Interactive (default)
curl -fsSL https://raw.githubusercontent.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen/main/install-armv6.sh | sudo bash -s

# Non‑interactive (skip confirmation)
curl -fsSL https://raw.githubusercontent.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen/main/install-armv6.sh | sudo bash -s -- --yes
# or set the env var:
AUTOYES=1 curl -fsSL https://raw.githubusercontent.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen/main/install-armv6.sh | sudo bash -s
# optional cleanup after install (frees space):
# sudo bash -s -- --cleanup   # or set CLEANUP=1
# or set the env var:
CLEANUP=1 curl -fsSL https://raw.githubusercontent.com/marsmarsmarsmarsmars/Drehkreuzarmbaendchen/main/install-armv6.sh | sudo bash -s
```

Der Installer prüft die Python‑Version, installiert notwendige Pakete, legt den System‑Benutzer `armbaendchen` an, klont das Repository nach `/opt/armbaendchen`, richtet ein Python‑Virtualenv ein, erstellt das Daten‑Verzeichnis und installiert den System‑d‑Dienst **armbaendchen.service**.

## Service verwalten

```bash
sudo systemctl {start|stop|restart|status} armbaendchen
```
Der Service läuft automatisch nach dem Booten.

# Update

Ein Update‑Helper ist installiert unter `/opt/armbaendchen/service/armbaendchen-update.sh`. Zum Aktualisieren führen Sie aus:

```bash
sudo /opt/armbaendchen/service/armbaendchen-update.sh
```
Der Helper pullt die neuesten Änderungen, installiert neue Python‑Abhängigkeiten, führt ggf. notwendige Datenbankschema‑Updates durch und startet den Service neu.

* **Neu:** Das Update‑Script unterstützt jetzt das Flag `--repair` (oder `--force`). Mit diesem Flag werden selbst bei identischem Repository‑Stand ein vollständiger Reset und eine Neuinstallation des Frontends erzwungen – ideal zur Wiederherstellung einer beschädigten oder unvollständigen Installation.
* **Neu:** Bei einem regulären Update prüft das Skript zudem, ob `client/dist/index.html` fehlt und führt dann ebenfalls einen Reset des Frontends aus.

## Weiterführende Dokumentation

* **API‑Dokumentation** – automatisch verfügbar unter `http://localhost:8000/docs`
* **Export‑Verzeichnis** – `backend/export/` enthält `export.json` und `export.csv`

---

## Datenbank

Die SQLite‑Datenbank wird unter dem Installationspfad in einem persistenten Verzeichnis abgelegt:
```
/opt/armbaendchen/data/data.db
```
Das Verzeichnis `data/` wird vom Installer angelegt und mit dem System‑Benutzer `armbaendchen` besessen, sodass die Datenbank über Neustarts und Service‑Neustarts hinweg erhalten bleibt.

## Erster Admin‑Benutzer

Beim ersten Start ist die Benutzertabelle leer. Das Backend erlaubt das Anlegen des aller‑ersten Benutzers (typischerweise ein Administrator) **ohne Authentifizierung**. Das Frontend bietet jetzt einen Setup‑Screen dafür:
1. Rufen Sie die Anwendung im Browser auf (z. B. `http://<IP‑Adresse>:8000`).
2. Klicken Sie auf **„Ersten Admin anlegen“** und geben Sie Benutzername und Passwort ein.
3. Nach erfolgreicher Erstellung können Sie sich mit den neuen Zugangsdaten anmelden.

Falls Sie das Frontend nicht nutzen, können Sie den ersten Admin‑Benutzer alternativ via `curl` anlegen:
```bash
curl -X POST http://<IP>:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin","role":"admin"}'
```

---

Bei Fragen oder Erweiterungswünschen einfach ein Issue öffnen oder per Mail kontaktieren.

Viel Spaß beim Entwickeln!

---

## Anwendung – Menü und Funktionen

### Menüstruktur (Desktop‑ und Mobile‑Ansicht)
* **Desktop** – ein festes seitliches Menü auf der linken Seite.
* **Mobile** – das Menü ist eingeklappt und wird per Klick (Hamburger‑Icon) geöffnet.

#### Menüpunkte
- **Armbändchen** – Übersicht über alle Bänder.
- **Personen**
  - **Anlegen** – neue Personen hinzufügen.
  - **Importieren** – Personen‑Stammdaten aus einer CSV‑Datei laden.
- **Trainingsgruppen** – Verwaltung von Trainingsgruppen.
- **Einstellungen**
  - **Nummernkreise** – Nummernkreis‑Verwaltung.
  - **Trainingsgruppen** – Einstellungen zu Trainingsgruppen.
  - **Benutzerverwaltung** – Admins und Rollen verwalten.
- **Anleitung** – Diese Dokumentation (online verfügbar im UI).

### Armbändchen‑Übersicht
| Feld | Beschreibung |
|------|--------------|
| **Nummer** | Eindeutige, unveränderliche Chip‑Nummer (nicht editierbar). |
| **Status** | `verfügbar`, `reserviert`, `ausgegeben`, `Verlust`. |
| **Person** | Zugeordnete Person (falls reserviert/ausgegeben). |
| **Datum der Ausgabe** | Zeitpunkt der Ausgabe. |
| **Datum der Rückgabe** | Zeitpunkt der Rückgabe. |

#### Aktionen
* **Reservieren** – Band einer Person zuordnen (ohne Ausgabe). 
* **Ausgabe festhalten** – Ausgabedatum und ausführende Person speichern.
* **Rückgabe festhalten** – Rückgabedatum erfassen; optional wird die Zuordnung gelöscht (Bestätigung nötig).
* **Reservierung aufheben** – Zuordnung entfernen, ohne Rückgabe.
* **Historie anzeigen** – Vollständige Protokoll‑Ansicht für jedes Band.

### Personen‑Verwaltung
* **Liste** aller Personen mit Übersicht über zugeordnete Bänder.
* **Band zuordnen** – gleich wie bei Armbändchen (Reservieren, Ausgabe, Rückgabe, Aufhebung).
* **Bänder tauschen** – Zwei Personen können Bänder tauschen (Bestätigung erforderlich).
* **Mehrere Bänder pro Person** – Ausnahme, erfordert explizite Bestätigung durch den Nutzer.
* **Verlust‑Markierung** – Bei Verlust‑Status kann „nicht erneut fragen“ aktiviert werden, sodass keine weitere Nachfrage erfolgt.
* **Historie** – Chronologische Ansicht aller Aktionen einer Person.

---

## Anleitung verfügbar im System
Die komplette Bedienungsanleitung ist jetzt direkt über den Menüpunkt **„Anleitung“** im Frontend abrufbar. Dort finden Sie dieselben Informationen wie in dieser README, inklusive Screenshots und Schritt‑für‑Schritt‑Beschreibungen.

---

Viel Spaß beim Entwickeln!
