import pandas as pd

df = pd.read_csv("data/energy_with_anomalies.csv")

anomalies = df[df["is_anomaly"] == 1].copy()

print("Total records:", len(df))
print("Total anomalies:", len(anomalies))
print(
    "Anomaly percentage:",
    round(len(anomalies) / len(df) * 100, 2),
    "%"
)

print("\nHighest energy consumption anomalies:")

print(
    anomalies
    .sort_values("global_active_power", ascending=False)
    [["datetime", "global_active_power"]]
    .head(10)
    .to_string(index=False)
)