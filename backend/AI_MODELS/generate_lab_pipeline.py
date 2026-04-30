"""
generate_lab_pipeline.py
Run this ONCE from the project root to train and save the sklearn lab pipeline:
    python backend/AI_MODELS/generate_lab_pipeline.py

Requires: backend/AI_MODELS/synthetic_realistic_medical_data_full_labels.csv
Output:   backend/AI_MODELS/lab_pipeline.joblib
"""
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.pipeline import Pipeline

# ── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(SCRIPT_DIR, "synthetic_realistic_medical_data_full_labels.csv")
OUT_PATH   = os.path.join(SCRIPT_DIR, "lab_pipeline.joblib")

# ── Feature columns (match lab_test.ipynb exactly) ────────────────────────
numeric_cols = [
    'WBC', 'Hemoglobin', 'Hematocrit', 'Platelets', 'Glucose', 'Calcium',
    'Sodium', 'Potassium', 'Creatinine', 'BUN', 'ALT_AST', 'Albumin',
    'Total_Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'HbA1c', 'TSH'
]
categorical_cols = ['Gender', 'Protein', 'Urine_Glucose', 'Nitrites', 'Leukocyte']
target_cols = [
    'Diabetes', 'Hyperlipidemia', 'Liver_Issue', 'Hypertension',
    'Kidney_Issue', 'Anemia', 'Heart_Disease_Risk', 'Thyroid_Issue', 'Infection_Risk'
]

def main():
    print(f"Loading data from: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(
            f"CSV not found: {CSV_PATH}\n"
            "Download 'synthetic_realistic_medical_data_full_labels.csv' "
            "from your lab_test Kaggle notebook output and place it in backend/AI_MODELS/"
        )

    df = pd.read_csv(CSV_PATH)
    print(f"  Rows: {len(df)}, Columns: {list(df.columns)}")

    # Fill missing values
    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    for col in categorical_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].mode()[0])

    # Only keep cols that exist in the CSV
    avail_num = [c for c in numeric_cols if c in df.columns]
    avail_cat = [c for c in categorical_cols if c in df.columns]
    avail_tgt = [c for c in target_cols if c in df.columns]

    X = df[avail_num + avail_cat]
    y = df[avail_tgt]

    print(f"  Features: {avail_num + avail_cat}")
    print(f"  Targets:  {avail_tgt}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Preprocessor
    preprocessor = ColumnTransformer(transformers=[
        ('num', StandardScaler(), avail_num),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), avail_cat),
    ])

    # Pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', MultiOutputClassifier(
            HistGradientBoostingClassifier(max_iter=200, random_state=42)
        )),
    ])

    print("Training pipeline...")
    pipeline.fit(X_train, y_train)

    score = pipeline.score(X_test, y_test)
    print(f"  Exact-match accuracy on test set: {score:.3f}")

    # Save
    joblib.dump(pipeline, OUT_PATH)
    print(f"\n✅ Pipeline saved to: {OUT_PATH}")
    print("   Place this file in backend/AI_MODELS/ if not already there.")

if __name__ == "__main__":
    main()
