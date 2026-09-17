import pandas as pd

# ── Load data ────────────────────────────────────────────────────────────────
df = pd.read_csv("data/enriched_energy_data.csv")
shap_df = pd.read_csv("data/anomaly_shap.csv")

# ── Select anomaly with largest absolute difference_percent ──────────────────
anomalies = df[df["is_anomaly"] == 1].copy()
anomaly = anomalies.loc[anomalies["difference_percent"].abs().idxmax()]

# ── Match SHAP row by datetime ───────────────────────────────────────────────
shap_row = shap_df[shap_df["datetime"] == anomaly["datetime"]]
if shap_row.empty:
    raise ValueError(f"No SHAP row found for datetime: {anomaly['datetime']}")
shap_row = shap_row.iloc[0]

# ── Identify top SHAP contributors by absolute magnitude ────────────────────
shap_features = [
    "global_active_power",
    "global_reactive_power",
    "voltage",
    "global_intensity",
    "sub_metering_1",
    "sub_metering_2",
    "sub_metering_3",
]
shap_vals = {f: shap_row[f"shap_{f}"] for f in shap_features}
sorted_shap = sorted(shap_vals.items(), key=lambda x: abs(x[1]), reverse=True)
top_contributors = ", ".join(
    f"{feat} ({val:+.4f})" for feat, val in sorted_shap[:3]
)

# ── Build context string ─────────────────────────────────────────────────────
context = f"""=== GreenLoad AI — Energy Anomaly Context ===

── 1. TIME CONTEXT ──────────────────────────────────────────────────────────
Date:         {anomaly['date']}
Time:         {int(anomaly['hour']):02d}:00
Day of week:  {anomaly['day_of_week']}
Month:        {anomaly['month_name']} ({int(anomaly['month'])})
Season:       {anomaly['season']}

── 2. OBSERVED CONSUMPTION ──────────────────────────────────────────────────
Global active power:    {anomaly['global_active_power']:.4f} kW
Global reactive power:  {anomaly['global_reactive_power']:.4f} kVAR
Voltage:                {anomaly['voltage']:.4f} V
Global intensity:       {anomaly['global_intensity']:.4f} A
Sub-metering 1:         {anomaly['sub_metering_1']:.4f} Wh  (kitchen-related circuit group)
Sub-metering 2:         {anomaly['sub_metering_2']:.4f} Wh  (laundry-related circuit group)
Sub-metering 3:         {anomaly['sub_metering_3']:.4f} Wh  (HVAC / water-heater-related circuit group)
Sub-metering remainder: {anomaly['sub_metering_remainder']:.4f} Wh  (unmetered circuits)

── 3. NORMAL BASELINE (typical for this hour of day) ────────────────────────
Typical active power:         {anomaly['typical_hourly_power']:.4f} kW
Difference from typical:      {anomaly['difference_percent']:+.2f}%
Typical sub-metering 1:       {anomaly['typical_sub_metering_1']:.4f} Wh
Typical sub-metering 2:       {anomaly['typical_sub_metering_2']:.4f} Wh
Typical sub-metering 3:       {anomaly['typical_sub_metering_3']:.4f} Wh
Typical global reactive power:{anomaly['typical_global_reactive_power']:.4f} kVAR
Typical voltage:              {anomaly['typical_voltage']:.4f} V
Typical global intensity:     {anomaly['typical_global_intensity']:.4f} A

── 4. NEIGHBORING HOURS ─────────────────────────────────────────────────────
Previous hour power:      {anomaly['previous_hour_power']:.4f} kW  ({anomaly['previous_hour_difference_percent']:+.2f}% vs typical)
Next hour power:          {anomaly['next_hour_power']:.4f} kW  ({anomaly['next_hour_difference_percent']:+.2f}% vs typical)

── 5. ANOMALY MODEL ─────────────────────────────────────────────────────────
Anomaly score (decision_function): {anomaly['anomaly_score']:.6f}
  (Negative values indicate anomalies; more negative = more isolated)
Classification: The Isolation Forest model classified this observation as an
  ANOMALY (label = -1). It was identified as statistically unusual relative
  to the 34,168-hour dataset with contamination=0.02.

── 6. SHAP EXPLANATION ──────────────────────────────────────────────────────
SHAP values below decompose the Isolation Forest's RAW TREE OUTPUT (not the
decision_function). Each value represents a feature's additive contribution
to the model's raw score for this observation. The sign and magnitude indicate
how much each feature shifted the score away from the model's expected value;
they do NOT directly map to "more anomalous" or "less anomalous" without
knowing the direction of the model's output scale.

  shap_global_active_power:    {shap_vals['global_active_power']:+.6f}
  shap_global_reactive_power:  {shap_vals['global_reactive_power']:+.6f}
  shap_voltage:                {shap_vals['voltage']:+.6f}
  shap_global_intensity:       {shap_vals['global_intensity']:+.6f}
  shap_sub_metering_1:         {shap_vals['sub_metering_1']:+.6f}
  shap_sub_metering_2:         {shap_vals['sub_metering_2']:+.6f}
  shap_sub_metering_3:         {shap_vals['sub_metering_3']:+.6f}

Top 3 features by absolute SHAP contribution: {top_contributors}

── 7. AI INSTRUCTIONS ───────────────────────────────────────────────────────
You are an energy analyst assistant. Using ONLY the evidence provided above:

1. EXPLAIN why this observation is unusual. Ground your explanation in the
   specific numbers: observed vs. typical values, difference_percent,
   neighboring-hour context, and the SHAP contributions.

2. DISTINGUISH clearly between what the data directly shows (observed
   evidence) and what might be a possible cause or interpretation.

3. DO NOT claim a specific appliance caused this anomaly unless the
   sub-metering data provides direct numerical support for that claim.
   Sub-metering channels cover limited circuits; unmetered remainder
   ({anomaly['sub_metering_remainder']:.2f} Wh) may represent the dominant load.

4. PROVIDE 2–3 practical, household-realistic electricity-saving
   recommendations relevant to the time, season, and consumption pattern
   shown. Base them on the evidence; do not invent scenarios.

5. DO NOT invent or assume any information not present in this context.
   If the data is ambiguous, say so.
=============================================================================
"""

# ── Print and save ───────────────────────────────────────────────────────────
print(context)

with open("data/sample_ai_context.txt", "w", encoding="utf-8") as f:
    f.write(context)

print("AI context saved to data/sample_ai_context.txt")
