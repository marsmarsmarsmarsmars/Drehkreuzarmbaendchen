"""Entry point for the FastAPI application.

The file sets up the database engine, creates tables on first start, registers the
router with all endpoints and launches the background export worker.
"""

import jwt
from datetime import timedelta
from typing import Generator

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

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

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SQLITE_PATH = os.path.join(BASE_DIR, "data.db")
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

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


# ---------------------------------------------------------------------------
# User management (only admin can create users for now)
# ---------------------------------------------------------------------------

@app.post("/api/users", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
# Export endpoint (returns JSON; CSV can be downloaded via static file server)
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
    import asyncio
    loop = asyncio.get_event_loop()
    loop.create_task(scheduler.export_worker(SessionLocal))