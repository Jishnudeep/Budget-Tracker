from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.database import budgets_collection, expenses_collection
from app.models import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budget", tags=["Budget"])


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_budget(budget_data: BudgetCreate, current_user: dict = Depends(get_current_user)):
    """Create or update budget for a specific month."""
    user_id = current_user["id"]

    existing = await budgets_collection.find_one({"user_id": user_id, "month": budget_data.month})

    if existing:
        await budgets_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "total_amount": budget_data.total_amount,
                "category_limits": budget_data.category_limits,
            }},
        )
        existing["total_amount"] = budget_data.total_amount
        existing["category_limits"] = budget_data.category_limits
        return BudgetResponse(
            id=str(existing["_id"]),
            user_id=user_id,
            month=existing["month"],
            total_amount=budget_data.total_amount,
            category_limits=budget_data.category_limits,
            created_at=existing["created_at"],
        )

    budget_doc = {
        "user_id": user_id,
        "month": budget_data.month,
        "total_amount": budget_data.total_amount,
        "category_limits": budget_data.category_limits,
        "created_at": datetime.now(timezone.utc),
    }
    result = await budgets_collection.insert_one(budget_doc)

    return BudgetResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        month=budget_data.month,
        total_amount=budget_data.total_amount,
        category_limits=budget_data.category_limits,
        created_at=budget_doc["created_at"],
    )


@router.get("/{month}", response_model=BudgetResponse)
async def get_budget(month: str, current_user: dict = Depends(get_current_user)):
    """Get budget for a specific month (format: YYYY-MM)."""
    budget = await budgets_collection.find_one({
        "user_id": current_user["id"],
        "month": month,
    })
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No budget set for this month")

    return BudgetResponse(
        id=str(budget["_id"]),
        user_id=budget["user_id"],
        month=budget["month"],
        total_amount=budget["total_amount"],
        category_limits=budget.get("category_limits"),
        created_at=budget["created_at"],
    )


@router.get("/{month}/summary")
async def get_budget_summary(month: str, current_user: dict = Depends(get_current_user)):
    """Get budget summary with spending analytics for a month."""
    user_id = current_user["id"]

    budget = await budgets_collection.find_one({"user_id": user_id, "month": month})
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No budget set for this month")

    # Get all expenses for this month
    expenses_cursor = expenses_collection.find({
        "user_id": user_id,
        "date": {"$regex": f"^{month}"},
    })
    expenses = await expenses_cursor.to_list(length=1000)

    total_spent = sum(e["amount"] for e in expenses)
    total_budget = budget["total_amount"]
    remaining = total_budget - total_spent

    # Category breakdown
    category_spending = {}
    for expense in expenses:
        cat = expense["category"]
        category_spending[cat] = category_spending.get(cat, 0) + expense["amount"]

    # Daily spending for velocity & heatmap
    daily_spending = {}
    for expense in expenses:
        day = expense["date"]
        daily_spending[day] = daily_spending.get(day, 0) + expense["amount"]

    # Calculate spending velocity
    import calendar
    year, mo = int(month.split("-")[0]), int(month.split("-")[1])
    days_in_month = calendar.monthrange(year, mo)[1]
    today = datetime.now(timezone.utc)

    if today.year == year and today.month == mo:
        days_elapsed = today.day
    elif (today.year > year) or (today.year == year and today.month > mo):
        days_elapsed = days_in_month
    else:
        days_elapsed = 0

    time_percentage = (days_elapsed / days_in_month * 100) if days_in_month > 0 else 0
    budget_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0

    # Spending streak calculation
    streak = 0
    daily_allowance = total_budget / days_in_month if days_in_month > 0 else 0
    if days_elapsed > 0:
        for day_num in range(days_elapsed, 0, -1):
            day_str = f"{month}-{day_num:02d}"
            day_spent = daily_spending.get(day_str, 0)
            if day_spent <= daily_allowance:
                streak += 1
            else:
                break

    # Forecast
    if days_elapsed > 0:
        daily_avg = total_spent / days_elapsed
        projected_total = daily_avg * days_in_month
    else:
        projected_total = 0

    return {
        "month": month,
        "total_budget": total_budget,
        "total_spent": round(total_spent, 2),
        "remaining": round(remaining, 2),
        "budget_percentage": round(budget_percentage, 1),
        "time_percentage": round(time_percentage, 1),
        "category_spending": category_spending,
        "category_limits": budget.get("category_limits"),
        "daily_spending": daily_spending,
        "spending_streak": streak,
        "daily_allowance": round(daily_allowance, 2),
        "projected_total": round(projected_total, 2),
        "days_in_month": days_in_month,
        "days_elapsed": days_elapsed,
    }
