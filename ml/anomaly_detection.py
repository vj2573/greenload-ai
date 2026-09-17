import pandas as pd
from sklearn.ensemble import IsolationForest

# Load processed hourly data
df = pd.read_csv("data/hourly_energy.csv")

# All candidate features for anomaly detection
CANDIDATE_FEATURES = [
    "global_active_power",
    "global_reactive_power",
    "voltage",
    "global_intensity",
    "sub_metering_1",
    "sub_metering_2",
    "sub_metering_3",
]

# Use whichever candidate features are present in the dataset
features = [col for col in CANDIDATE_FEATURES if col in df.columns]
print("Features used for anomaly detection:", features)

# Build feature matrix; drop rows where any selected feature is NaN
X = df[features].dropna()
valid_index = X.index  # track which rows have complete data

# Create Isolation Forest model
model = IsolationForest(
    contamination=0.02,
    random_state=42
)

# Train the model and predict anomalies on complete rows only
predictions = model.fit_predict(X)

# Compute continuous anomaly score (higher = more normal, lower = more anomalous)
scores = model.decision_function(X)

# Write results back; rows with missing features default to not-anomaly / NaN score
df["anomaly"] = 1  # default: normal
df.loc[valid_index, "anomaly"] = predictions
df["anomaly_score"] = float("nan")
df.loc[valid_index, "anomaly_score"] = scores

# Convert model output:
# 1  = normal
# -1 = anomaly
df["is_anomaly"] = df["anomaly"].apply(
    lambda x: 1 if x == -1 else 0
)

# Save results
df.to_csv("data/energy_with_anomalies.csv", index=False)

# Display results
print("Anomaly detection completed!")
print("\nTotal records:", len(df))
print("Anomalies detected:", df["is_anomaly"].sum())

print("\nSample NORMAL rows (anomaly_score):")
print(
    df[df["is_anomaly"] == 0][["datetime", "global_active_power", "anomaly_score"]]
    .head(5)
    .to_string(index=False)
)

print("\nSample ANOMALOUS rows (anomaly_score):")
print(
    df[df["is_anomaly"] == 1][["datetime", "global_active_power", "anomaly_score"]]
    .head(5)
    .to_string(index=False)
)