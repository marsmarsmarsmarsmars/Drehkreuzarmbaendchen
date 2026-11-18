"""SQLAlchemy models and Pydantic schemas for the application.

All tables are defined in a single SQLite file (`data.db`).  The models are
simple and reflect exactly the requirements described in the spec.
"""

from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, declarative_base
from pydantic import BaseModel, Field, ConfigDict

Base = declarative_base()


# ---------------------------------------------------------------------------
# Database tables
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "admin" or "user"

    issues = relationship("Issue", back_populates="user")


class NumberRange(Base):
    __tablename__ = "number_ranges"
    id = Column(Integer, primary_key=True, index=True)
    range_start = Column(Integer, nullable=False)
    range_end = Column(Integer, nullable=False)
    valid_until = Column(Date, nullable=False, default=date(9999, 12, 31))

    __table_args__ = (
        CheckConstraint("range_start <= range_end", name="ck_range_start_end"),
    )

    bands = relationship("Band", back_populates="range")


class Band(Base):
    __tablename__ = "bands"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False, index=True)
    range_id = Column(Integer, ForeignKey("number_ranges.id"), nullable=False)

    range = relationship("NumberRange", back_populates="bands")
    issues = relationship("Issue", back_populates="band", order_by="Issue.timestamp")


class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    band_id = Column(Integer, ForeignKey("bands.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # "ISSUE" or "RETURN"
    person_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    band = relationship("Band", back_populates="issues")
    user = relationship("User", back_populates="issues")


class ExportMeta(Base):
    __tablename__ = "export_meta"
    id = Column(Integer, primary_key=True, default=1)
    last_change = Column(DateTime, nullable=True)

    __table_args__ = (UniqueConstraint("id", name="uq_export_meta_id"),)


# ---------------------------------------------------------------------------
# Pydantic schemas (used for request / response bodies)
# ---------------------------------------------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=5)
    role: str = Field(..., pattern="^(admin|user)$")


class UserRead(BaseModel):
    id: int
    username: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class NumberRangeCreate(BaseModel):
    range_start: int
    range_end: int
    valid_until: Optional[date] = None


class NumberRangeRead(BaseModel):
    id: int
    range_start: int
    range_end: int
    valid_until: date

    model_config = ConfigDict(from_attributes=True)


class BandCreate(BaseModel):
    number: int
    range_id: int


class BandRead(BaseModel):
    id: int
    number: int
    range_id: int
    issued: bool = False
    person_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IssueCreate(BaseModel):
    person_name: str


class IssueRead(BaseModel):
    id: int
    band_id: int
    user_id: int
    action: str
    person_name: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)