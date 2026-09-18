const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File paths
const explanationPath = path.join(
    __dirname,
    "..",
    "data",
    "bob_explanation.json"
);

const energyPath = path.join(
    __dirname,
    "..",
    "data",
    "energy_with_anomalies.csv"
);

const enrichedPath = path.join(
    __dirname,
    "..",
    "data",
    "enriched_energy_data.csv"
);

const shapPath = path.join(
    __dirname,
    "..",
    "data",
    "anomaly_shap.csv"
);


// --------------------------------------------------
// Helper: Read CSV
// --------------------------------------------------

function readCsv(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const csv = fs.readFileSync(filePath, "utf-8");

    const lines = csv.trim().split(/\r?\n/);

    const headers = lines[0]
        .split(",")
        .map((header) => header.trim());

    return lines.slice(1).map((line) => {
        const values = line
            .split(",")
            .map((value) => value.trim());

        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index];
        });

        return row;
    });
}


// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        message: "GreenLoad AI backend is running"
    });
});


// --------------------------------------------------
// Get BOB explanation
// --------------------------------------------------

app.get("/api/anomaly", (req, res) => {
    try {
        if (!fs.existsSync(explanationPath)) {
            return res.status(404).json({
                error: "Bob explanation file not found"
            });
        }

        const explanation = JSON.parse(
            fs.readFileSync(explanationPath, "utf-8")
        );

        res.json(explanation);

    } catch (error) {
        console.error(
            "Error reading anomaly explanation:",
            error
        );

        res.status(500).json({
            error: "Failed to load anomaly explanation"
        });
    }
});


// --------------------------------------------------
// Get historical energy data
// --------------------------------------------------

app.get("/api/energy", (req, res) => {
    try {
        const data = readCsv(energyPath);

        res.json(data);

    } catch (error) {
        console.error(
            "Error reading energy dataset:",
            error
        );

        res.status(500).json({
            error: "Failed to load energy dataset"
        });
    }
});


// --------------------------------------------------
// Get all detected anomalies
// --------------------------------------------------

app.get("/api/anomalies", (req, res) => {
    try {
        const energyData = readCsv(energyPath);
        const enrichedData = readCsv(enrichedPath);
        const shapData = readCsv(shapPath);

        // Create lookup for enriched data
        const enrichedMap = new Map();

        enrichedData.forEach((row) => {
            enrichedMap.set(row.datetime, row);
        });

        // Create lookup for SHAP data
        const shapMap = new Map();

        shapData.forEach((row) => {
            shapMap.set(row.datetime, row);
        });

        // Keep only detected anomalies
        const anomalies = energyData
            .filter((row) => row.is_anomaly === "1")
            .map((row) => {

                const enriched = enrichedMap.get(
                    row.datetime
                ) || {};

                const shap = shapMap.get(
                    row.datetime
                ) || {};

                return {
                    datetime: row.datetime,

                    global_active_power: Number(
                        row.global_active_power
                    ),

                    global_reactive_power: Number(
                        row.global_reactive_power
                    ),

                    voltage: Number(
                        row.voltage
                    ),

                    global_intensity: Number(
                        row.global_intensity
                    ),

                    sub_metering_1: Number(
                        row.sub_metering_1
                    ),

                    sub_metering_2: Number(
                        row.sub_metering_2
                    ),

                    sub_metering_3: Number(
                        row.sub_metering_3
                    ),

                    anomaly_score: Number(
                        row.anomaly_score
                    ),

                    is_anomaly: true,

                    hour: Number(
                        enriched.hour
                    ),

                    day_of_week:
                        enriched.day_of_week,

                    date:
                        enriched.date,

                    month:
                        enriched.month,

                    month_name:
                        enriched.month_name,

                    season:
                        enriched.season,

                    typical_hourly_power: Number(
                        enriched.typical_hourly_power
                    ),

                    difference_percent: Number(
                        enriched.difference_percent
                    ),

                    previous_hour_power: Number(
                        enriched.previous_hour_power
                    ),

                    next_hour_power: Number(
                        enriched.next_hour_power
                    ),

                    previous_hour_difference_percent:
                        Number(
                            enriched.previous_hour_difference_percent
                        ),

                    next_hour_difference_percent:
                        Number(
                            enriched.next_hour_difference_percent
                        ),

                    shap: {
                        global_active_power: Number(
                            shap.shap_global_active_power
                        ),

                        global_reactive_power: Number(
                            shap.shap_global_reactive_power
                        ),

                        voltage: Number(
                            shap.shap_voltage
                        ),

                        global_intensity: Number(
                            shap.shap_global_intensity
                        ),

                        sub_metering_1: Number(
                            shap.shap_sub_metering_1
                        ),

                        sub_metering_2: Number(
                            shap.shap_sub_metering_2
                        ),

                        sub_metering_3: Number(
                            shap.shap_sub_metering_3
                        )
                    }
                };
            });

        res.json({
            total: anomalies.length,
            anomalies
        });

    } catch (error) {
        console.error(
            "Error building anomaly data:",
            error
        );

        res.status(500).json({
            error: "Failed to build anomaly data"
        });
    }
});


// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
    console.log(
        `GreenLoad AI backend running on http://localhost:${PORT}`
    );
});