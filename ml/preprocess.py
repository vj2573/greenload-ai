import pandas as pd

file_path = "data/household_power_consumption.txt"

df = pd.read_csv(
    file_path,
    sep=";",
    na_values="?",
    low_memory=False
)

# Combine Date and Time into one datetime column
df["datetime"] = pd.to_datetime(
    df["Date"] + " " + df["Time"],
    dayfirst=True
)

# All feature columns to carry through to hourly data
FEATURE_COLS = [
    "Global_active_power",
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3",
]

# Convert all feature columns to numeric
for col in FEATURE_COLS:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Remove rows where the primary feature is missing
df = df.dropna(subset=["datetime", "Global_active_power"])

# Set datetime as index
df = df.set_index("datetime")

# Convert minute-level data into hourly averages for all feature columns
hourly_df = df[FEATURE_COLS].resample("1h").mean()

# Drop hours where the primary feature is missing
hourly_df = hourly_df.dropna(subset=["Global_active_power"])

# Convert back to DataFrame and lowercase column names
hourly_df = hourly_df.reset_index()
hourly_df.columns = [c.lower() for c in hourly_df.columns]

# Save processed dataset
hourly_df.to_csv("data/hourly_energy.csv", index=False)

print("Hourly dataset created successfully!")
print("Shape:", hourly_df.shape)
print("\nFirst 5 rows:")
print(hourly_df.head())