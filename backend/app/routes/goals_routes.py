from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.database import goals_collection
from app.models import GoalCreate, GoalUpdate, GoalResponse, ContributionCreate

router = APIRouter(prefix="/goals", tags=["Savings Goals"])


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(goal_data: GoalCreate, current_user: dict = Depends(get_current_user)):
    """Create a new savings goal."""
    goal_doc = {
        "user_id": current_user["id"],
        "name": goal_data.name,
        "target_amount": goal_data.target_amount,
        "current_amount": 0,
        "deadline": goal_data.deadline,
        "icon": goal_data.icon or "🎯",
        "contributions": [],
        "created_at": datetime.now(timezone.utc),
    }
    result = await goals_collection.insert_one(goal_doc)

    return GoalResponse(id=str(result.inserted_id), **{k: v for k, v in goal_doc.items() if k != "_id"})


@router.get("/", response_model=list[GoalResponse])
async def get_goals(current_user: dict = Depends(get_current_user)):
    """Get all savings goals for the current user."""
    cursor = goals_collection.find({"user_id": current_user["id"]}).sort("created_at", -1)
    goals = await cursor.to_list(length=50)

    return [
        GoalResponse(id=str(g["_id"]), **{k: v for k, v in g.items() if k != "_id"})
        for g in goals
    ]


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, goal_data: GoalUpdate, current_user: dict = Depends(get_current_user)):
    """Update a savings goal."""
    try:
        oid = ObjectId(goal_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid goal ID")

    goal = await goals_collection.find_one({"_id": oid, "user_id": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    update_data = {k: v for k, v in goal_data.model_dump().items() if v is not None}
    if update_data:
        await goals_collection.update_one({"_id": oid}, {"$set": update_data})

    updated = await goals_collection.find_one({"_id": oid})
    return GoalResponse(id=str(updated["_id"]), **{k: v for k, v in updated.items() if k != "_id"})


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a savings goal."""
    try:
        oid = ObjectId(goal_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid goal ID")

    result = await goals_collection.delete_one({"_id": oid, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")


@router.post("/{goal_id}/contribute", response_model=GoalResponse)
async def contribute_to_goal(goal_id: str, contribution: ContributionCreate, current_user: dict = Depends(get_current_user)):
    """Add a contribution to a savings goal."""
    try:
        oid = ObjectId(goal_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid goal ID")

    goal = await goals_collection.find_one({"_id": oid, "user_id": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    contribution_doc = {
        "amount": contribution.amount,
        "date": datetime.now(timezone.utc).isoformat(),
    }

    await goals_collection.update_one(
        {"_id": oid},
        {
            "$inc": {"current_amount": contribution.amount},
            "$push": {"contributions": contribution_doc},
        },
    )

    updated = await goals_collection.find_one({"_id": oid})
    return GoalResponse(id=str(updated["_id"]), **{k: v for k, v in updated.items() if k != "_id"})
