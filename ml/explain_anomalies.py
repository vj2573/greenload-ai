# ml/explain_anomalies.py
import pandas as pd
import shap
from sklearn.ensemble import IsolationForest

# ── 1. Load data ────────────────────────────────────────────────────────────
df = pd.read_csv("data/hourly_energy.csv")

# ── 2. Exact same 7 features and order as anomaly_detection.py ──────────────
FEATURES = [
    "global_active_power",
    "global_reactive_power",
    "voltage",
    "global_intensity",
    "sub_metering_1",
    "sub_metering_2",
    "sub_metering_3",
]

# ── 3. Drop rows with missing values in these features (same as detection) ──
X_all = df[FEATURES].dropna()
valid_index = X_all.index

# ── 4. Re-fit same Isolation Forest ─────────────────────────────────────────
model = IsolationForest(contamination=0.02, random_state=42)
predictions = model.fit_predict(X_all)

# ── 5. Identify anomaly rows (prediction == -1) ──────────────────────────────
anomaly_mask = predictions == -1
X_anomalies = X_all[anomaly_mask]
anomaly_datetimes = df.loc[X_anomalies.index, "datetime"].values

# ── 6 & 7. TreeExplainer + SHAP values for anomaly rows only ────────────────
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_anomalies)   # ndarray shape: (n_anomalies, 7)

# ── 8 & 9 & 10. Build output DataFrame with datetime + 7 SHAP columns ───────
shap_df = pd.DataFrame(shap_values, columns=[f"shap_{f}" for f in FEATURES])
shap_df.insert(0, "datetime", anomaly_datetimes)

# ── Save ─────────────────────────────────────────────────────────────────────
shap_df.to_csv("data/anomaly_shap.csv", index=False)

# ── 11. Print summary ────────────────────────────────────────────────────────
print(f"Total anomalies:  {len(shap_df)}")
print(f"SHAP output shape: {shap_values.shape}")
print("\n5-row sample:")
print(shap_df.head(5).to_string(index=False))
