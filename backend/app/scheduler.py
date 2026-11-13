"""Background job that creates JSON and CSV exports after 30 min idle.

The job runs in an ``asyncio`` task started from ``main.py``.  It checks the
``export_meta.last_change`` column every minute.  If the timestamp is older than
30 minutes, the export is written to ``backend/export/`` and the column is
cleared.
"""

import asyncio
import csv
import json
import os
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

from . import crud, models

EXPORT_DIR = os.getenv("EXPORT_DIR", os.path.join(os.path.dirname(__file__), "..", "export"))
EXPORT_INTERVAL = timedelta(minutes=30)


async def _export_task(db: Session) -> None:
    """Write JSON and CSV files based on current band status."""
    os.makedirs(EXPORT_DIR, exist_ok=True)
    data: List[dict] = crud.generate_export_data(db)

    # JSON
    json_path = os.path.join(EXPORT_DIR, "export.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # CSV (semicolon separated for easier Excel import)
    csv_path = os.path.join(EXPORT_DIR, "export.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["band_number", "issued", "person_name"])
        for row in data:
            writer.writerow([row["band_number"], row["issued"], row["person_name"]])


async def export_worker(db_factory) -> None:
    """Continuously monitor ``export_meta`` and trigger export when idle.

    ``db_factory`` is a callable that returns a new ``Session`` (SQLAlchemy
    ``sessionmaker``).  Using a fresh session each loop avoids stale connections.
    """
    while True:
        await asyncio.sleep(60)  # check every minute
        db: Session = db_factory()
        try:
            meta = db.query(models.ExportMeta).filter(models.ExportMeta.id == 1).first()
            if meta and meta.last_change:
                if datetime.utcnow() - meta.last_change >= EXPORT_INTERVAL:
                    await _export_task(db)
                    # reset timestamp so we don't export repeatedly
                    meta.last_change = None
                    db.commit()
        finally:
            db.close()