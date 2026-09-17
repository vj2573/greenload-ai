import pandas as pd

# Load anomaly results
df = pd.read_csv("data/energy_with_anomalies.csv")

# Convert datetime
df["datetime"] = pd.to_datetime(df["datetime"])

# Add useful time information
df["hour"] = df["datetime"].dt.hour
df["day_of_week"] = df["datetime"].dt.day_name()
df["date"] = df["datetime"].dt.date
df["month"] = df["datetime"].dt.month
df["month_name"] = df["datetime"].dt.month_name()

SEASON_MAP = {
    12: "Winter", 1: "Winter", 2: "Winter",
    3: "Spring", 4: "Spring", 5: "Spring",
    6: "Summer", 7: "Summer", 8: "Summer",
    9: "Autumn", 10: "Autumn", 11: "Autumn",
}
df["season"] = df["month"].map(SEASON_MAP)

# Calculate average consumption for each hour using normal observations only
# (excluding anomalies so the baseline is not skewed by unusual events)
normal = df[df["is_anomaly"] == 0]

hourly_average = (
    normal.groupby("hour")["global_active_power"]
    .mean()
    .rename("typical_hourly_power")
)

# Calculate per-feature baselines using normal observations only
FEATURE_BASELINES = {
    "sub_metering_1":         "typical_sub_metering_1",
    "sub_metering_2":         "typical_sub_metering_2",
    "sub_metering_3":         "typical_sub_metering_3",
    "global_reactive_power":  "typical_global_reactive_power",
    "voltage":                "typical_voltage",
    "global_intensity":       "typical_global_intensity",
}

feature_baselines = pd.concat(
    [
        normal.groupby("hour")[col].mean().rename(name)
        for col, name in FEATURE_BASELINES.items()
    ],
    axis=1,
)

# Add typical consumption back to each record
df = df.merge(
    hourly_average,
    on="hour",
    how="left"
)

# Add per-feature baselines back to each record
df = df.merge(
    feature_baselines,
    on="hour",
    how="left"
)

# Calculate unmetered remainder (total consumption minus the three sub-metered circuits)
df["sub_metering_remainder"] = (
    df["global_active_power"] * 1000 / 60
    - df["sub_metering_1"]
    - df["sub_metering_2"]
    - df["sub_metering_3"]
)

# Calculate percentage difference from typical consumption
df["difference_percent"] = (
    (df["global_active_power"] - df["typical_hourly_power"])
    / df["typical_hourly_power"]
) * 100

# Add neighboring-hour context (sort chronologically first to ensure correct shift)
df = df.sort_values("datetime").reset_index(drop=True)

df["previous_hour_power"]              = df["global_active_power"].shift(1)
df["next_hour_power"]                  = df["global_active_power"].shift(-1)
df["previous_hour_difference_percent"] = df["difference_percent"].shift(1)
df["next_hour_difference_percent"]     = df["difference_percent"].shift(-1)

# Save enriched dataset
df.to_csv("data/enriched_energy_data.csv", index=False)

# Show anomaly examples
anomalies = df[df["is_anomaly"] == 1]

print("Enrichment completed!")
print("\nColumns added:")
print("- hour")
print("- day_of_week")
print("- date")
print("- typical_hourly_power")
print("- difference_percent")
print("- typical_sub_metering_1")
print("- typical_sub_metering_2")
print("- typical_sub_metering_3")
print("- typical_global_reactive_power")
print("- typical_voltage")
print("- typical_global_intensity")
print("- sub_metering_remainder")
print("- previous_hour_power")
print("- next_hour_power")
print("- previous_hour_difference_percent")
print("- next_hour_difference_percent")
print("- month")
print("- month_name")
print("- season")

print("\nSample enriched anomalies:")

print(
    anomalies[
        [
            "datetime",
            "global_active_power",
            "day_of_week",
            "hour",
            "typical_hourly_power",
            "difference_percent"
        ]
    ]
    .sort_values("global_active_power", ascending=False)
    .head(10)
    .to_string(index=False)
)