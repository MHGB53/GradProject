import streamlit as st
import pandas as pd
from datetime import datetime, timedelta, time

# ---------------- CURRICULUM ---------------- #
CURRICULUM = {
    "Level 1": {
        "Semester 1": {
            "English Language 1": {"base": 2, "hard": False},
            "General Anatomy 1": {"base": 5, "hard": True},
            "General Physiology 1": {"base": 5, "hard": True},
            "Biochemistry 1": {"base": 4, "hard": True},
            "General Microbiology": {"base": 3, "hard": False},
            "Dental Anatomy 1": {"base": 5, "hard": True},
            "General Histology 1": {"base": 3, "hard": False}
        },
        "Semester 2": {
            "English Language 2": {"base": 2, "hard": False},
            "General Anatomy 2": {"base": 6, "hard": True},
            "General Physiology 2": {"base": 5, "hard": True},
            "Biochemistry 2": {"base": 4, "hard": True},
            "General Microbiology 2": {"base": 3, "hard": False},
            "Dental Anatomy 2": {"base": 5, "hard": True},
            "General Histology 2": {"base": 3, "hard": False},
            "Biostatistics": {"base": 4, "hard": True},
            "Critical Thinking": {"base": 2, "hard": False}
        }
    },

    "Level 2": {
        "Semester 3": {
            "English & Medical Terminology": {"base": 2, "hard": False},
            "Operative Dentistry 1": {"base": 5, "hard": True},
            "Removable Prosthodontics 1": {"base": 5, "hard": True},
            "Fixed Prosthodontics 1": {"base": 5, "hard": True},
            "Pharmacology 1": {"base": 4, "hard": True},
            "Dental Biomaterials 1": {"base": 5, "hard": True},
            "Oral Biology 1": {"base": 5, "hard": True},
            "General Pathology 1": {"base": 4, "hard": True}
        },
        "Semester 4": {
            "Operative Dentistry 2": {"base": 5, "hard": True},
            "Removable Prosthodontics 2": {"base": 5, "hard": True},
            "Fixed Prosthodontics 2": {"base": 5, "hard": True},
            "Pharmacology 2": {"base": 4, "hard": True},
            "Dental Biomaterials 2": {"base": 5, "hard": True},
            "Oral Biology 2": {"base": 5, "hard": True},
            "General Pathology 2": {"base": 4, "hard": True},
            "Biophysics": {"base": 4, "hard": False}
        }
    },

    "Level 3": {
        "Semester 5": {
            "Oral Pathology 1": {"base": 6, "hard": True},
            "Operative Dentistry 3": {"base": 6, "hard": True},
            "Removable Prosthodontics 3": {"base": 6, "hard": True},
            "Fixed Prosthodontics 3": {"base": 6, "hard": True},
            "Oral Radiology 1": {"base": 5, "hard": True},
            "General Medicine & Dermatology 1": {"base": 4, "hard": False},
            "General Surgery & ENT 1": {"base": 4, "hard": False},
            "Behaviour & Psychology": {"base": 3, "hard": False}
        },
        "Semester 6": {
            "Oral Pathology 2": {"base": 6, "hard": True},
            "Operative Dentistry 1": {"base": 6, "hard": True},
            "Removable Prosthodontics 1": {"base": 6, "hard": True},
            "Fixed Prosthodontics 1": {"base": 6, "hard": True},
            "Oral Radiology 2": {"base": 5, "hard": True},
            "General Medicine & Dermatology 2": {"base": 4, "hard": False},
            "General Surgery & ENT 2": {"base": 4, "hard": False},
            "Community Dentistry": {"base": 3, "hard": False},
            "Endodontics": {"base": 5, "hard": True}
        }
    }
}

# ---------------- STREAMLIT UI ---------------- #
st.set_page_config(page_title="DENTOR AI Planner", layout="wide")
st.title("🦷 DENTOR AI Study Planner (Smart Logic)")

# --- Inputs ---
st.sidebar.header("Step 1: Setup")
year = st.sidebar.selectbox("Academic Year", list(CURRICULUM.keys()))
sem = st.sidebar.selectbox("Semester", list(CURRICULUM[year].keys()))
weekly_hours = st.sidebar.slider("Weekly Study Hours", 10, 80, 40)
start_time_input = st.sidebar.time_input("Daily Start Time", value=time(9,0))
break_min = st.sidebar.number_input("Break Duration (minutes)", 15, 60, 30)

subjects = CURRICULUM[year][sem]

# --- Personalization ---
st.subheader("Step 2: Personalize Subjects")
student_inputs = {}
days = ["None","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
cols = st.columns(3)
for i, sub in enumerate(subjects):
    with cols[i % 3]:
        key_safe = sub.replace(" ","_").replace(",","").replace(".","").replace("&","")
        with st.expander(sub, expanded=True):
            lvl = st.select_slider("Your Level (1=Weak,5=Strong)", [1,2,3,4,5], value=3, key=f"lvl_{key_safe}")
            exam = st.checkbox("Exam This Week", key=f"ex_{key_safe}")
            exam_day = st.selectbox("Exam Day", days, key=f"day_{key_safe}")
            student_inputs[sub] = {"lvl":lvl,"exam":exam,"exam_day":exam_day}

# --- Generate Timetable ---
if st.button("Generate My Timetable 🚀"):

    # 1️⃣ Compute Weights
    weights = {}
    total_weight = 0
    for sub, info in subjects.items():
        lvl = student_inputs[sub]["lvl"]
        personal_factor = 1 + (5 - lvl)*0.3        # weaker subjects get more time
        hard_factor = 1.4 if info["hard"] else 1
        exam_factor = 2 if student_inputs[sub]["exam"] else 1
        weight = info["base"] * personal_factor * hard_factor * exam_factor
        weights[sub] = weight
        total_weight += weight

    # 2️⃣ Allocate weekly hours (cap at 8)
    allocated_hours = {sub: min((w/total_weight)*weekly_hours,8) for sub,w in weights.items()}

    # 3️⃣ Distribute hours per day
    week_days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    max_per_day = {"normal":2,"weekend":3}
    schedule = {day:{} for day in week_days}
    count_day = {day:0 for day in week_days}

    for sub,hours in allocated_hours.items():
        # split hours for exam subjects before the exam
        # تعديل جزء توزيع ساعات مادة الامتحان
        if student_inputs[sub]["exam"] and student_inputs[sub]["exam_day"] != "None":
            exam_idx = week_days.index(student_inputs[sub]["exam_day"])
            days_before = week_days[max(0, exam_idx - 2):exam_idx]  # 2 أيام قبل الامتحان
            if not days_before:
                # لو فاضية نخلي اليوم السابق للامتحان نفسه أو يوم Monday
                days_before = [week_days[max(0, exam_idx - 1)]]
            split_hours = hours / len(days_before)
            for d in days_before:
                schedule[d][sub] = schedule[d].get(sub, 0) + split_hours
                count_day[d] += 1
            continue
        # regular subjects
        for day in week_days:
            if student_inputs[sub]["exam"] and day == student_inputs[sub]["exam_day"]:
                continue
            limit = max_per_day["weekend"] if day in ["Friday","Saturday"] else max_per_day["normal"]
            if count_day[day]<limit:
                schedule[day][sub] = schedule[day].get(sub,0) + hours/(limit)
                count_day[day]+=1

    # 4️⃣ Convert to dataframe with time slots
    df_rows=[]
    for day, subs in schedule.items():
        start_time = datetime.combine(datetime.today(), start_time_input)
        for sub,h in subs.items():
            end_time = start_time + timedelta(hours=h)
            df_rows.append({
                "Day":day,
                "Subject":sub,
                "Hours":round(h,2),
                "From":start_time.strftime("%I:%M %p"),
                "To":end_time.strftime("%I:%M %p")
            })
            start_time = end_time + timedelta(minutes=break_min)

    df_schedule = pd.DataFrame(df_rows)
    st.subheader("📅 Weekly Study Schedule")
    st.dataframe(df_schedule.sort_values(by=["Day","Subject"]), use_container_width=True)

    # 5️⃣ Summary
    st.subheader("📊 Weekly Hours per Subject")
    summary = pd.DataFrame({"Subject":list(allocated_hours.keys()), "Weekly Hours":list(allocated_hours.values())})
    st.bar_chart(summary.set_index("Subject"))

    st.success("✅ Timetable generated with smart logic! Weak subjects, exam priority, and max 8 hours/week are considered.")