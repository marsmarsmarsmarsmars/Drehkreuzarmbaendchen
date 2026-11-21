"""CRUD helper functions used by the FastAPI routes.

All functions receive a SQLAlchemy ``Session`` object.  They raise ``HTTPException``
with German error messages when a business rule is violated.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from . import models, auth


# ---------------------------------------------------------------------------
# User handling
# ---------------------------------------------------------------------------

def get_all_users(db: Session) -> List[models.User]:
    return db.query(models.User).all()


def get_user(db: Session, user_id: int) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    return user

def update_user(db: Session, user_id: int, username: Optional[str] = None, password: Optional[str] = None, role: Optional[str] = None) -> models.User:
    user = get_user(db, user_id)
    if username:
        user.username = username
    if password:
        user.password_hash = auth.get_password_hash(password)
    if role:
        user.role = role
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> None:
    user = get_user(db, user_id)
    db.delete(user)
    db.commit()



def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return None
    if not auth.verify_password(password, user.password_hash):
        return None
    return user


# ---------------------------------------------------------------------------
# Number ranges
# ---------------------------------------------------------------------------

def create_number_range(db: Session, start: int, end: int, valid_until: Optional[datetime] = None) -> models.NumberRange:
    nr = models.NumberRange(
        range_start=start,
        range_end=end,
        valid_until=valid_until.date() if valid_until else models.NumberRange.valid_until.default,
    )
    db.add(nr)
    db.commit()
    db.refresh(nr)
    return nr


def get_all_number_ranges(db: Session) -> List[models.NumberRange]:
    return db.query(models.NumberRange).all()


# ---------------------------------------------------------------------------
# Bands
# ---------------------------------------------------------------------------

def create_band(db: Session, number: int, range_id: int) -> models.Band:
    if db.query(models.Band).filter(models.Band.number == number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Band‑Nummer bereits vergeben",
        )
    band = models.Band(number=number, range_id=range_id)
    db.add(band)
    db.commit()
    db.refresh(band)
    return band


def get_all_bands(db: Session) -> List[models.Band]:
    return db.query(models.Band).all()


def get_band(db: Session, band_id: int) -> models.Band:
    band = db.query(models.Band).filter(models.Band.id == band_id).first()
    if not band:
        raise HTTPException(status_code=404, detail="Band nicht gefunden")
    return band


def _last_issue(db: Session, band_id: int) -> Optional[models.Issue]:
    return (
        db.query(models.Issue)
        .filter(models.Issue.band_id == band_id)
        .order_by(models.Issue.timestamp.desc())
        .first()
    )


def issue_band(db: Session, band_id: int, user_id: int, person_name: str) -> models.Issue:
    band = get_band(db, band_id)
    last = _last_issue(db, band_id)
    if last and last.action == "ISSUE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Band ist bereits ausgegeben",
        )
    issue = models.Issue(
        band_id=band.id,
        user_id=user_id,
        action="ISSUE",
        person_name=person_name,
        timestamp=datetime.utcnow(),
    )
    db.add(issue)
    # update export meta
    _touch_export_meta(db)
    db.commit()
    db.refresh(issue)
    return issue


def return_band(db: Session, band_id: int, user_id: int) -> models.Issue:
    band = get_band(db, band_id)
    last = _last_issue(db, band_id)
    if not last or last.action != "ISSUE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Band ist nicht ausgegeben",
        )
    ret = models.Issue(
        band_id=band.id,
        user_id=user_id,
        action="RETURN",
        person_name=last.person_name,  # keep same person for audit trail
        timestamp=datetime.utcnow(),
    )
    db.add(ret)
    _touch_export_meta(db)
    db.commit()
    db.refresh(ret)
    return ret


def _touch_export_meta(db: Session) -> None:
    meta = db.query(models.ExportMeta).filter(models.ExportMeta.id == 1).first()
    if not meta:
        meta = models.ExportMeta(id=1, last_change=datetime.utcnow())
        db.add(meta)
    else:
        meta.last_change = datetime.utcnow()
    db.flush()


# ---------------------------------------------------------------------------
# Export helpers (used by the scheduler)
# ---------------------------------------------------------------------------

def generate_export_data(db: Session) -> List[dict]:
    """Return a list of dicts with the current status of every band.

    Each dict contains ``band_number``, ``issued`` (bool) and ``person_name`` (empty
    string if not issued).  This structure can be serialized directly to JSON or
    CSV.
    """
    data = []
    for band in db.query(models.Band).all():
        last = _last_issue(db, band.id)
        issued = bool(last and last.action == "ISSUE")
        data.append(
            {
                "band_number": band.number,
                "issued": issued,
                "person_name": last.person_name if issued else "",
            }
        )
    return data