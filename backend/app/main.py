"""Entry point for the FastAPI application.

The file sets up the database engine, creates tables on first start, registers the
router with all endpoints and launches the background export worker.
"""

import jwt
import os
from datetime import timedelta
from typing import Generator

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import asyncio
from fastapi.staticfiles import StaticFiles

from . import models, crud, auth, i18n, scheduler
from .models import (
    Token,
    UserCreate,
    UserRead,
    NumberRangeCreate,
    NumberRangeRead,
    BandCreate,
    BandRead,
    IssueCreate,
    IssueRead,
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_PATH = os.path.join(BASE_DIR, "data", "data.db")
engine = create_engine(f"sqlite:///" + SQLITE_PATH, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they do not exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DLRG Drehkreuz‑Armbändchen API", version="0.1.0")

# Allow the frontend (different port) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Serve built frontend (mount will be done later)

dist_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "client", "dist"))


# Dependency – provides a DB session per request
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Authentication endpoints
# ---------------------------------------------------------------------------

@app.post("/api/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=i18n.MESSAGES["invalid_credentials"],
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return Token(access_token=access_token)


# ---------------------------------------------------------------------------
# Helper – get current user from JWT
# ---------------------------------------------------------------------------

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail=i18n.MESSAGES["invalid_credentials"])
    except Exception:
        raise HTTPException(status_code=401, detail=i18n.MESSAGES["invalid_credentials"])
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail=i18n.MESSAGES["user_not_found"])
    return user


@app.get("/api/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer auflisten")
    return crud.get_all_users(db)

@app.get("/api/users/{user_id}", response_model=UserRead)
def get_user_endpoint(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer ansehen")
    return crud.get_user(db, user_id)

@app.put("/api/users/{user_id}", response_model=UserRead)
def update_user_endpoint(user_id: int, user: UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer ändern")
    return crud.update_user(db, user_id, username=user.username, password=user.password, role=user.role)

@app.delete("/api/users/{user_id}")
def delete_user_endpoint(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer löschen")
    crud.delete_user(db, user_id)
    return {"detail": "Benutzer gelöscht"}

# ---------------------------------------------------------------------------
# User management (only admin can create users for now)
# ---------------------------------------------------------------------------

@app.post("/api/users", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # Allow creation of first user without authentication
    if db.query(models.User).first() is None:
        created = crud.create_user(db, username=user.username, password=user.password, role=user.role)
        return created
    # If token missing or invalid, raise authentication error
    if not token:
        raise HTTPException(status_code=401, detail=i18n.MESSAGES["invalid_credentials"])
    try:
        current_user = get_current_user(token, db)
    except HTTPException:
        raise HTTPException(status_code=401, detail=i18n.MESSAGES["invalid_credentials"])
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Benutzer anlegen")
    created = crud.create_user(db, username=user.username, password=user.password, role=user.role)
    return created


# ---------------------------------------------------------------------------
# Number range endpoints
# ---------------------------------------------------------------------------

@app.post("/api/ranges", response_model=NumberRangeRead)
def create_range(range_in: NumberRangeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Nummernkreise anlegen")
    nr = crud.create_number_range(db, range_in.range_start, range_in.range_end, range_in.valid_until)
    return nr


@app.get("/api/ranges", response_model=list[NumberRangeRead])
def list_ranges(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_all_number_ranges(db)


# ---------------------------------------------------------------------------
# Band endpoints
# ---------------------------------------------------------------------------

@app.post("/api/bands", response_model=BandRead)
def create_band(band_in: BandCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Bänder anlegen")
    band = crud.create_band(db, band_in.number, band_in.range_id)
    # enrich with status fields for the client
    return BandRead(
        id=band.id,
        number=band.number,
        range_id=band.range_id,
        issued=False,
        person_name=None,
    )


@app.get("/api/bands", response_model=list[BandRead])
def list_bands(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = []
    for band in crud.get_all_bands(db):
        last = crud._last_issue(db, band.id)
        issued = bool(last and last.action == "ISSUE")
        result.append(
            BandRead(
                id=band.id,
                number=band.number,
                range_id=band.range_id,
                issued=issued,
                person_name=last.person_name if issued else None,
            )
        )
    return result


@app.post("/api/bands/{band_id}/issue", response_model=IssueRead)
def issue_band(band_id: int, payload: IssueCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    issue = crud.issue_band(db, band_id, current_user.id, payload.person_name)
    return issue


@app.post("/api/bands/{band_id}/return", response_model=IssueRead)
def return_band(band_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ret = crud.return_band(db, band_id, current_user.id)
    return ret




# ---------------------------------------------------------------------------
# First‑setup endpoint – indicates whether any users exist
# ---------------------------------------------------------------------------

@app.get("/api/export")
def export_data(format: str = "json", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    data = crud.generate_export_data(db)
    if format == "csv":
        # generate CSV on the fly
        import io, csv
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        writer.writerow(["band_number", "issued", "person_name"])
        for row in data:
            writer.writerow([row["band_number"], row["issued"], row["person_name"]])
        return {
            "filename": "export.csv",
            "content": output.getvalue(),
        }
    return data


# ---------------------------------------------------------------------------
# Startup – launch background export worker
# ---------------------------------------------------------------------------

@app.on_event("startup")
def start_background_tasks():
    # No default admin user is created automatically.
    # The frontend should prompt the user to create the first account.
    loop = asyncio.get_event_loop()
    loop.create_task(scheduler.export_worker(SessionLocal))


# Serve built frontend if it exists
if os.path.isdir(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")