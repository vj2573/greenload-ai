import pandas as pd

# Load enriched data
df = pd.read_csv("data/enriched_energy_data.csv")

# Get anomalies
anomalies = df[df["is_anomaly"] == 1].copy()

# Select the most significant anomaly
anomaly = anomalies.sort_values(
    "difference_percent",
    ascending=False
).iloc[0]

# Create AI context
context = f"""
GreenLoad AI Energy Anomaly

Date: {anomaly['date']}
Time: {int(anomaly['hour']):02d}:00
Day: {anomaly['day_of_week']}

Observed electricity consumption:
{anomaly['global_active_power']:.2f} kW

Typical consumption for this hour:
{anomaly['typical_hourly_power']:.2f} kW

Difference from typical consumption:
{anomaly['difference_percent']:.1f}%

The machine-learning model classified this observation as an anomaly.

Important:
The anomaly indicates unusual consumption, but the cause is unknown.
Do not assume a specific appliance or behavior caused it.
"""

print(context)

# Save context for later AI integration
with open("data/sample_ai_context.txt", "w", encoding="utf-8") as file:
    file.write(context)

print("\nAI context saved to data/sample_ai_context.txt")