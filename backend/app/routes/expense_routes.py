from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user
from app.database import expenses_collection
from app.models import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    """Create a new expense."""
    expense_doc = {
        "user_id": current_user["id"],
        "amount": expense_data.amount,
        "category": expense_data.category.value,
        "description": expense_data.description,
        "date": expense_data.date,
        "notes": expense_data.notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = await expenses_collection.insert_one(expense_doc)

    return ExpenseResponse(
        id=str(result.inserted_id),
        **{k: v for k, v in expense_doc.items() if k != "_id"},
    )


@router.get("/", response_model=list[ExpenseResponse])
async def get_expenses(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get expenses with optional filters."""
    query = {"user_id": current_user["id"]}

    if month:
        query["date"] = {"$regex": f"^{month}"}
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query
    if category:
        query["category"] = category

    cursor = expenses_collection.find(query).sort("date", -1)
    expenses = await cursor.to_list(length=500)

    return [
        ExpenseResponse(
            id=str(e["_id"]),
            user_id=e["user_id"],
            amount=e["amount"],
            category=e["category"],
            description=e["description"],
            date=e["date"],
            notes=e.get("notes"),
            created_at=e["created_at"],
        )
        for e in expenses
    ]


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense_data: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing expense."""
    try:
        oid = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid expense ID")

    expense = await expenses_collection.find_one({"_id": oid, "user_id": current_user["id"]})
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    update_data = {k: v for k, v in expense_data.model_dump().items() if v is not None}
    if "category" in update_data:
        update_data["category"] = update_data["category"].value if hasattr(update_data["category"], "value") else update_data["category"]

    if update_data:
        await expenses_collection.update_one({"_id": oid}, {"$set": update_data})

    updated = await expenses_collection.find_one({"_id": oid})
    return ExpenseResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        amount=updated["amount"],
        category=updated["category"],
        description=updated["description"],
        date=updated["date"],
        notes=updated.get("notes"),
        created_at=updated["created_at"],
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an expense."""
    try:
        oid = ObjectId(expense_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid expense ID")

    result = await expenses_collection.delete_one({"_id": oid, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
