import datetime
import os
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.database import SessionLocal
from backend.models import User, StudyPlan, StudyPlanEntry, StudyPlanPenalty, UserPoints

def test_penalties():
    from backend.database import engine
    from backend.models import Base
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Get first user
        user = db.query(User).first()
        if not user:
            print("No users found.")
            return

        print(f"Testing for user {user.username}")
        
        # Get user points
        points = db.query(UserPoints).filter(UserPoints.user_id == user.id).first()
        if not points:
            points = UserPoints(user_id=user.id, total_points=20, tasks_completed=2)
            db.add(points)
        else:
            points.total_points = 20
        db.commit()
        db.refresh(points)
        
        initial_points = points.total_points
        print(f"Initial points: {initial_points}")

        # Delete any existing plans for test
        db.query(StudyPlan).filter(StudyPlan.user_id == user.id).delete()
        db.query(StudyPlanPenalty).delete()
        db.commit()

        # Create a dummy plan
        yesterday = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
        plan = StudyPlan(
            user_id=user.id,
            level="Level 1",
            semester="Semester 1",
            weekly_hours=10,
            start_time="09:00",
            total_hours=10,
            study_days=3,
        )
        plan.created_at = yesterday  # Force created_at to yesterday
        db.add(plan)
        db.commit()
        db.refresh(plan)

        yesterday_name = yesterday.strftime('%A')

        # Add a dummy entry for yesterday
        entry = StudyPlanEntry(
            plan_id=plan.id,
            day_of_week=yesterday_name,
            subject_name="Test Subject",
            hours=100,
            from_time="09:00 AM",
            to_time="10:00 AM",
            is_completed=False
        )
        db.add(entry)
        db.commit()

        print(f"Created plan with entry for {yesterday_name} (yesterday), uncompleted.")

        # Trigger get_saved_plan logic
        # We can just call it via TestClient or by importing the router
        from backend.routers.smartstudy import get_saved_plan
        from fastapi import HTTPException
        
        try:
            get_saved_plan(db=db, current_user=user)
        except Exception as e:
            print(f"get_saved_plan raised: {e}")

        # Check points again
        points_after = db.query(UserPoints).filter(UserPoints.user_id == user.id).first()
        final_points = points_after.total_points if points_after else 0
        print(f"Points after get_saved_plan: {final_points}")

        if initial_points - final_points == 10 or (initial_points == 0 and final_points == 0):
            print("Penalty logic successfully deducted points or stayed at 0.")
        else:
            print("Penalty logic failed or points mismatch.")

    finally:
        db.close()

if __name__ == "__main__":
    test_penalties()
