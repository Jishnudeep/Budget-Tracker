from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_indexes
from app.routes.auth_routes import router as auth_router
from app.routes.budget_routes import router as budget_router
from app.routes.expense_routes import router as expense_router
from app.routes.goals_routes import router as goals_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    await create_indexes()
    yield


app = FastAPI(
    title="Budget Tracker API",
    description="A dynamic budget tracking API with expense management and savings goals.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(budget_router)
app.include_router(expense_router)
app.include_router(goals_router)


@app.get("/")
async def root():
    return {"message": "Budget Tracker API is running", "docs": "/docs"}
