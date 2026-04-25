"""
Dentor Smart Study Plan Router
Exposes:
  GET  /api/study-plan/curriculum          → returns the full curriculum tree
  GET  /api/study-plan/subjects            → returns subjects for a given level+semester
  POST /api/study-plan/generate            → runs the scheduling algorithm and returns the plan
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime, timedelta, time as dtime
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, StudyPlan, StudyPlanEntry
from ..routers.auth import get_current_user

router = APIRouter(prefix="/api/study-plan", tags=["Smart Study Plan"])

# ──────────────────────────── Curriculum ────────────────────────────

CURRICULUM: Dict[str, Dict[str, Dict[str, dict]]] = {
    "Level 1": {
        "Semester 1": {
            "English Language 1":    {"base": 2, "hard": False},
            "General Anatomy 1":     {"base": 5, "hard": True},
            "General Physiology 1":  {"base": 5, "hard": True},
            "Biochemistry 1":        {"base": 4, "hard": True},
            "General Microbiology":  {"base": 3, "hard": False},
            "Dental Anatomy 1":      {"base": 5, "hard": True},
            "General Histology 1":   {"base": 3, "hard": False},
        },
        "Semester 2": {
            "English Language 2":    {"base": 2, "hard": False},
            "General Anatomy 2":     {"base": 6, "hard": True},
            "General Physiology 2":  {"base": 5, "hard": True},
            "Biochemistry 2":        {"base": 4, "hard": True},
            "General Microbiology 2":{"base": 3, "hard": False},
            "Dental Anatomy 2":      {"base": 5, "hard": True},
            "General Histology 2":   {"base": 3, "hard": False},
            "Biostatistics":         {"base": 4, "hard": True},
            "Critical Thinking":     {"base": 2, "hard": False},
        },
    },
    "Level 2": {
        "Semester 3": {
            "English & Medical Terminology": {"base": 2, "hard": False},
            "Operative Dentistry 1":         {"base": 5, "hard": True},
            "Removable Prosthodontics 1":    {"base": 5, "hard": True},
            "Fixed Prosthodontics 1":        {"base": 5, "hard": True},
            "Pharmacology 1":                {"base": 4, "hard": True},
            "Dental Biomaterials 1":         {"base": 5, "hard": True},
            "Oral Biology 1":                {"base": 5, "hard": True},
            "General Pathology 1":           {"base": 4, "hard": True},
        },
        "Semester 4": {
            "Operative Dentistry 2":      {"base": 5, "hard": True},
            "Removable Prosthodontics 2": {"base": 5, "hard": True},
            "Fixed Prosthodontics 2":     {"base": 5, "hard": True},
            "Pharmacology 2":             {"base": 4, "hard": True},
            "Dental Biomaterials 2":      {"base": 5, "hard": True},
            "Oral Biology 2":             {"base": 5, "hard": True},
            "General Pathology 2":        {"base": 4, "hard": True},
            "Biophysics":                 {"base": 4, "hard": False},
        },
    },
    "Level 3": {
        "Semester 5": {
            "Oral Pathology 1":                    {"base": 6, "hard": True},
            "Operative Dentistry 3":               {"base": 6, "hard": True},
            "Removable Prosthodontics 3":          {"base": 6, "hard": True},
            "Fixed Prosthodontics 3":              {"base": 6, "hard": True},
            "Oral Radiology 1":                    {"base": 5, "hard": True},
            "General Medicine & Dermatology 1":    {"base": 4, "hard": False},
            "General Surgery & ENT 1":             {"base": 4, "hard": False},
            "Behaviour & Psychology":              {"base": 3, "hard": False},
        },
        "Semester 6": {
            "Oral Pathology 2":                    {"base": 6, "hard": True},
            "Operative Dentistry 4":               {"base": 6, "hard": True},
            "Removable Prosthodontics 4":          {"base": 6, "hard": True},
            "Fixed Prosthodontics 4":              {"base": 6, "hard": True},
            "Oral Radiology 2":                    {"base": 5, "hard": True},
            "General Medicine & Dermatology 2":    {"base": 4, "hard": False},
            "General Surgery & ENT 2":             {"base": 4, "hard": False},
            "Community Dentistry":                 {"base": 3, "hard": False},
            "Endodontics":                         {"base": 5, "hard": True},
        },
    },
}

ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# ──────────────────────────── Pydantic Schemas ────────────────────────────

class SubjectInput(BaseModel):
    name: str
    level: int = Field(3, ge=1, le=5, description="Student proficiency 1(weak)–5(strong)")
    has_exam: bool = False
    exam_day: Optional[str] = None   # e.g. "Monday"; None or "None" means no exam


class GeneratePlanRequest(BaseModel):
    level: str                        # e.g. "Level 1"
    semester: str                     # e.g. "Semester 1"
    start_time: str = "09:00"         # "HH:MM" 24-hour
    break_minutes: int = Field(30, ge=0, le=120)
    weekly_hours: int = Field(20, ge=5, le=80)
    days_off: List[str] = []          # e.g. ["Friday", "Saturday"]
    subjects: List[SubjectInput]      # only the subjects the student selected


class ScheduleEntry(BaseModel):
    day: str
    subject: str
    hours: float
    from_time: str
    to_time: str


class SubjectSummary(BaseModel):
    subject: str
    weekly_hours: float
    percentage: float
    is_hard: bool


class GeneratePlanResponse(BaseModel):
    schedule: List[ScheduleEntry]
    summary: List[SubjectSummary]
    total_hours: float
    study_days: int
    message: str


# ──────────────────────────── Curriculum Endpoints ────────────────────────────

@router.get("/curriculum")
def get_curriculum():
    """Returns the full curriculum tree (Level → Semester → subjects)."""
    tree = {}
    for level, semesters in CURRICULUM.items():
        tree[level] = {}
        for sem, subjects in semesters.items():
            tree[level][sem] = [
                {"name": sub, "base": info["base"], "hard": info["hard"]}
                for sub, info in subjects.items()
            ]
    return tree


@router.get("/subjects")
def get_subjects(level: str, semester: str):
    """Returns subjects for the given level and semester."""
    if level not in CURRICULUM:
        raise HTTPException(status_code=404, detail=f"Level '{level}' not found.")
    if semester not in CURRICULUM[level]:
        raise HTTPException(status_code=404, detail=f"Semester '{semester}' not found in {level}.")
    subjects = CURRICULUM[level][semester]
    return [
        {"name": sub, "base": info["base"], "hard": info["hard"]}
        for sub, info in subjects.items()
    ]


# ──────────────────────────── Generate Plan Endpoint ────────────────────────────

@router.post("/generate", response_model=GeneratePlanResponse)
def generate_plan(payload: GeneratePlanRequest):
    """
    Runs the smart scheduling algorithm and returns a weekly study schedule.
    Mirrors the logic from smart_study.py.
    """
    # Validate level/semester
    if payload.level not in CURRICULUM:
        raise HTTPException(status_code=400, detail=f"Level '{payload.level}' not found.")
    if payload.semester not in CURRICULUM[payload.level]:
        raise HTTPException(status_code=400, detail=f"Semester '{payload.semester}' not found.")

    curriculum_subjects = CURRICULUM[payload.level][payload.semester]

    # Build a lookup for the selected subjects
    selected = {s.name: s for s in payload.subjects}

    # Validate all selected subjects exist in the curriculum
    for sub_name in selected:
        if sub_name not in curriculum_subjects:
            raise HTTPException(status_code=400, detail=f"Subject '{sub_name}' not in {payload.level} / {payload.semester}.")

    if not selected:
        raise HTTPException(status_code=400, detail="No subjects selected.")

    # ── 1. Compute weights ──────────────────────────────────────────
    weights: Dict[str, float] = {}
    total_weight = 0.0

    for sub_name, sub_input in selected.items():
        info = curriculum_subjects[sub_name]
        personal_factor = 1 + (5 - sub_input.level) * 0.3   # weaker → more time
        hard_factor     = 1.4 if info["hard"] else 1.0
        exam_factor     = 2.0 if sub_input.has_exam else 1.0
        w = info["base"] * personal_factor * hard_factor * exam_factor
        weights[sub_name] = w
        total_weight += w

    # ── 2. Allocate weekly hours (cap individual subject at 8 h/week) ──
    allocated_hours: Dict[str, float] = {
        sub: min((w / total_weight) * payload.weekly_hours, 8.0)
        for sub, w in weights.items()
    }

    # ── 3. Determine active study days ──────────────────────────────
    days_off_set = set(payload.days_off)
    active_days = [d for d in ALL_DAYS if d not in days_off_set]

    if not active_days:
        raise HTTPException(status_code=400, detail="All days are marked as days off. Please select at least one study day.")

    weekend_days = {"Friday", "Saturday", "Sunday"}
    max_per_day = {day: (3 if day in weekend_days else 2) for day in active_days}

    # ── 4. Distribute hours across days (fair round-robin) ──────────
    import heapq

    schedule: Dict[str, Dict[str, float]] = {day: {} for day in active_days}
    slot_used: Dict[str, int] = {day: 0 for day in active_days}

    # ── 4a. Exam subjects: place them in the 1-2 days before the exam ─
    exam_subs: Dict[str, str] = {}
    regular_subs: List[str] = []

    for sub_name, sub_input in selected.items():
        ed = sub_input.exam_day if sub_input.has_exam and sub_input.exam_day and sub_input.exam_day != "None" else None
        if sub_input.has_exam and ed and ed in active_days:
            exam_subs[sub_name] = ed
        else:
            regular_subs.append(sub_name)

    for sub_name, exam_day in exam_subs.items():
        exam_idx = active_days.index(exam_day)
        days_before = [d for d in active_days[max(0, exam_idx - 2): exam_idx]
                       if slot_used[d] < max_per_day[d]]
        if not days_before:
            days_before = [active_days[max(0, exam_idx - 1)]]
        split_hours = allocated_hours[sub_name] / len(days_before)
        for d in days_before:
            schedule[d][sub_name] = schedule[d].get(sub_name, 0) + split_hours
            slot_used[d] += 1

    # ── 4b. Build the remaining free slots after exam subjects ────────
    free_slots: List[str] = []
    for day in active_days:
        remaining = max_per_day[day] - slot_used[day]
        for _ in range(max(0, remaining)):
            free_slots.append(day)

    n_regular = len(regular_subs)
    n_free    = len(free_slots)

    if n_regular > 0 and n_free > 0:
        # Every subject gets at least 1 session; distribute remaining slots
        # proportionally by weight using a max-heap for fairness.
        sessions_per_sub: Dict[str, int] = {s: 1 for s in regular_subs}

        extra_budget = n_free - n_regular
        if extra_budget > 0:
            reg_total_w = sum(weights[s] for s in regular_subs)
            for s in sorted(regular_subs, key=lambda x: weights[x], reverse=True):
                extra = round((weights[s] / reg_total_w) * extra_budget)
                sessions_per_sub[s] += extra

            # Clamp total to n_free (rounding may overshoot)
            while sum(sessions_per_sub.values()) > n_free:
                heaviest = max(regular_subs, key=lambda x: sessions_per_sub[x])
                if sessions_per_sub[heaviest] > 1:
                    sessions_per_sub[heaviest] -= 1
                else:
                    break

        # Build a round-robin assignment list using a max-heap
        # (-remaining_sessions, subject) → subjects with the most sessions left
        # are always picked first, spreading them evenly across days.
        heap = [(-sessions_per_sub[s], s) for s in regular_subs]
        heapq.heapify(heap)

        assignment: List[str] = []
        while heap:
            neg_count, sub = heapq.heappop(heap)
            assignment.append(sub)
            if -neg_count > 1:
                heapq.heappush(heap, (neg_count + 1, sub))

        # Trim to the number of available slots
        assignment = assignment[:n_free]

        # Count final sessions per subject in the assignment
        final_sessions: Dict[str, int] = {}
        for s in assignment:
            final_sessions[s] = final_sessions.get(s, 0) + 1

        # Assign each subject to its day slot
        for i, sub_name in enumerate(assignment):
            day = free_slots[i]
            total_sess = final_sessions[sub_name]
            hrs_per_session = allocated_hours[sub_name] / total_sess
            schedule[day][sub_name] = schedule[day].get(sub_name, 0) + hrs_per_session

    # ── 5. Convert to time-slot rows ────────────────────────────────
    try:
        h, m = map(int, payload.start_time.split(":"))
        base_start = dtime(h, m)
    except Exception:
        base_start = dtime(9, 0)

    rows: List[ScheduleEntry] = []
    for day, subs in schedule.items():
        start_dt = datetime.combine(datetime.today(), base_start)
        for sub_name, hrs in subs.items():
            end_dt = start_dt + timedelta(hours=hrs)
            rows.append(ScheduleEntry(
                day=day,
                subject=sub_name,
                hours=round(hrs, 2),
                from_time=start_dt.strftime("%I:%M %p"),
                to_time=end_dt.strftime("%I:%M %p"),
            ))
            start_dt = end_dt + timedelta(minutes=payload.break_minutes)

    # Sort: day order first, then subject name
    day_order = {d: i for i, d in enumerate(ALL_DAYS)}
    rows.sort(key=lambda r: (day_order.get(r.day, 99), r.from_time))

    # ── 6. Build summary ────────────────────────────────────────────
    total_hours = sum(allocated_hours.values())
    summary_list: List[SubjectSummary] = []
    for sub_name, hrs in allocated_hours.items():
        pct = round((hrs / total_hours) * 100, 1) if total_hours > 0 else 0
        summary_list.append(SubjectSummary(
            subject=sub_name,
            weekly_hours=round(hrs, 2),
            percentage=pct,
            is_hard=curriculum_subjects[sub_name]["hard"],
        ))
    summary_list.sort(key=lambda s: s.weekly_hours, reverse=True)

    study_days = sum(1 for day_subs in schedule.values() if day_subs)

    return GeneratePlanResponse(
        schedule=rows,
        summary=summary_list,
        total_hours=round(total_hours, 2),
        study_days=study_days,
        message="✅ Timetable generated with smart logic! Weak subjects, exam priority, and max 8 hrs/week considered.",
    )


# ──────────────────────────── Persistence Schemas ────────────────────────────

class SaveEntryIn(BaseModel):
    """A single schedule row sent by the frontend for storage."""
    day: str
    subject: str
    hours: float
    from_time: str
    to_time: str
    is_completed: bool = False


class SavePlanRequest(BaseModel):
    """
    Payload the frontend sends to /save.
    Mirrors GeneratePlanResponse so the JS can pass the same object it received
    from /generate directly to this endpoint.
    """
    level:        str
    semester:     str
    weekly_hours: int
    start_time:   str = "09:00"
    total_hours:  float
    study_days:   int
    schedule:     List[SaveEntryIn]
    summary:      List[SubjectSummary]


class SavedEntryOut(BaseModel):
    id:        int
    day:       str
    subject:   str
    hours:     float
    from_time: str
    to_time:   str
    is_completed: bool

    model_config = {"from_attributes": True}


class SavedPlanOut(BaseModel):
    id:           int
    level:        str
    semester:     str
    weekly_hours: int
    start_time:   str
    total_hours:  float
    study_days:   int
    created_at:   Optional[datetime]
    schedule:     List[SavedEntryOut]
    summary:      List[SubjectSummary]   # rebuilt from entries on read
    message:      str = "✅ Saved plan loaded successfully."

    model_config = {"from_attributes": True}


# ──────────────────────────── Persistence Endpoints ──────────────────────────

@router.post("/save", response_model=SavedPlanOut, status_code=201)
def save_plan(
    payload: SavePlanRequest,
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upsert the user's study plan.
    If the user already has a plan it is deleted (cascade removes entries)
    before the new one is inserted.
    """
    # Delete any existing plan for this user
    existing = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.flush()   # ensure delete completes before insert

    # Create new StudyPlan header
    plan = StudyPlan(
        user_id      = current_user.id,
        level        = payload.level,
        semester     = payload.semester,
        weekly_hours = payload.weekly_hours,
        start_time   = payload.start_time,
        total_hours  = int(round(payload.total_hours)),
        study_days   = payload.study_days,
    )
    db.add(plan)
    db.flush()   # assigns plan.id before adding children

    # Bulk-insert schedule entries
    for entry in payload.schedule:
        db.add(StudyPlanEntry(
            plan_id      = plan.id,
            day_of_week  = entry.day,
            subject_name = entry.subject,
            hours        = int(round(entry.hours * 100)),   # store as centihours for precision
            from_time    = entry.from_time,
            to_time      = entry.to_time,
            is_completed = entry.is_completed,
        ))

    db.commit()
    db.refresh(plan)

    return _plan_to_out(plan, payload.summary)


@router.get("/saved", response_model=SavedPlanOut)
def get_saved_plan(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Returns the authenticated user's most recently saved study plan, or 404
    if they have not generated one yet.
    """
    plan = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="No saved study plan found.")

    # Rebuild summary from the stored entries
    subject_hours: Dict[str, float] = {}
    for e in plan.entries:
        hrs = e.hours / 100.0   # convert centihours back
        subject_hours[e.subject_name] = subject_hours.get(e.subject_name, 0.0) + hrs

    total = sum(subject_hours.values()) or 1.0
    summary = [
        SubjectSummary(
            subject      = sub,
            weekly_hours = round(hrs, 2),
            percentage   = round((hrs / total) * 100, 1),
            is_hard      = False,   # original hard flag not stored; frontend uses colour palette only
        )
        for sub, hrs in sorted(subject_hours.items(), key=lambda x: x[1], reverse=True)
    ]

    return _plan_to_out(plan, summary)


# ──────────────────────────── Internal helper ─────────────────────────────────

@router.put("/entry/{entry_id}/toggle")
def toggle_entry_completion(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggles the completion status of a specific study plan entry."""
    entry = db.query(StudyPlanEntry).join(StudyPlan).filter(
        StudyPlanEntry.id == entry_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found or access denied.")
        
    entry.is_completed = not entry.is_completed
    db.commit()
    
    return {"message": "Toggled successfully", "is_completed": entry.is_completed}

def _plan_to_out(plan: StudyPlan, summary: List[SubjectSummary]) -> SavedPlanOut:
    """Convert a StudyPlan ORM object + summary list into SavedPlanOut."""
    schedule_out = [
        SavedEntryOut(
            id        = e.id,
            day       = e.day_of_week,
            subject   = e.subject_name,
            hours     = round(e.hours / 100.0, 2),
            from_time = e.from_time,
            to_time   = e.to_time,
            is_completed = e.is_completed,
        )
        for e in plan.entries
    ]
    return SavedPlanOut(
        id           = plan.id,
        level        = plan.level,
        semester     = plan.semester,
        weekly_hours = plan.weekly_hours,
        start_time   = plan.start_time,
        total_hours  = plan.total_hours,
        study_days   = plan.study_days,
        created_at   = plan.created_at,
        schedule     = schedule_out,
        summary      = summary,
    )
