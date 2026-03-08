from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ─── Category Enum ──────────────────────────────────────────
class ExpenseCategory(str, Enum):
    FOOD = "food"
    TRANSPORT = "transport"
    BILLS = "bills"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    HEALTH = "health"
    EDUCATION = "education"
    SUBSCRIPTIONS = "subscriptions"
    GROCERIES = "groceries"
    TRAVEL = "travel"
    OTHER = "other"


# ─── Auth Models ────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Budget Models ──────────────────────────────────────────
class BudgetCreate(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Format: YYYY-MM")
    total_amount: float = Field(..., gt=0)
    category_limits: Optional[dict[str, float]] = None


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    month: str
    total_amount: float
    category_limits: Optional[dict[str, float]] = None
    created_at: datetime


# ─── Expense Models ─────────────────────────────────────────
class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: ExpenseCategory
    description: str = Field(..., min_length=1, max_length=200)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    category: str
    description: str
    date: str
    notes: Optional[str] = None
    created_at: datetime


# ─── Savings Goal Models ────────────────────────────────────
class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0)
    deadline: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    icon: Optional[str] = "🎯"


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(None, gt=0)
    deadline: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    icon: Optional[str] = None


class ContributionCreate(BaseModel):
    amount: float = Field(..., gt=0)


class GoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[str] = None
    icon: str = "🎯"
    contributions: List[dict] = []
    created_at: datetime
