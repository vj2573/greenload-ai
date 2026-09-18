# GreenLoad AI

### Explainable AI for Energy Consumption Anomaly Detection and Sustainable Action Recommendations

GreenLoad AI is an Explainable AI system that analyzes historical household electricity consumption data, detects unusual energy consumption patterns, explains the factors behind detected anomalies, and provides practical sustainability recommendations.

The project combines **Machine Learning, Explainable AI, and Generative AI** using Isolation Forest, SHAP, and IBM Bob to make energy anomaly detection more understandable and actionable.

---

## Overview

Electricity consumption can vary significantly across different hours and days. Some patterns may be normal, while others may represent unusual consumption that is difficult to identify manually.

Traditional energy monitoring can show **how much electricity was consumed**, but it does not always explain:

* Why a particular observation was considered unusual
* Which energy features influenced the anomaly detection model
* How the consumption compares with typical historical patterns
* What actions could be investigated to improve energy efficiency

GreenLoad AI addresses this by combining anomaly detection with explainable AI and AI-generated recommendations.

---

## Problem Statement

Household electricity consumption datasets contain complex patterns across time, energy usage, voltage, current, and circuit-level measurements.

A system is needed that can:

1. Detect unusual consumption patterns automatically.
2. Compare anomalies with typical historical consumption.
3. Identify the energy features influencing the model.
4. Provide a human-readable explanation of detected anomalies.
5. Suggest practical sustainability actions based on the available evidence.

---

## Proposed Solution

GreenLoad AI follows the pipeline:

```text
Energy Dataset
      ↓
Data Preprocessing
      ↓
Hourly Aggregation
      ↓
Isolation Forest
      ↓
Anomaly Detection
      ↓
Historical + Temporal Context
      ↓
SHAP Explainability
      ↓
Structured AI Context
      ↓
IBM Bob
      ↓
Explanation + Recommendations
      ↓
React Dashboard
```

The system separates **detection** from **explanation**:

* **Isolation Forest** detects unusual observations.
* **SHAP** explains the model's feature-level contributions.
* **IBM Bob** interprets the available evidence and generates human-readable recommendations.
* **React** presents the results through an interactive dashboard.

---

## Key Features

* Historical household electricity consumption analysis
* Hourly energy consumption aggregation
* Multi-feature anomaly detection
* Isolation Forest based anomaly detection
* SHAP-based model explainability
* Comparison with typical hourly consumption
* Previous and next hour context
* Temporal and seasonal context
* AI-generated anomaly explanations
* Evidence-based sustainability recommendations
* Interactive anomaly exploration
* Interactive charts and visualizations
* Dark-themed energy analytics dashboard

---

## Dataset

GreenLoad AI uses the **UCI Individual Household Electric Power Consumption Dataset**.

The dataset contains electricity consumption measurements collected from a single household over several years.

### Original Measurements

The original dataset contains approximately **2 million minute-level observations**.

The available measurements include:

* Date
* Time
* Global Active Power
* Global Reactive Power
* Voltage
* Global Intensity
* Sub-metering 1
* Sub-metering 2
* Sub-metering 3

### Processing

The raw minute-level data is:

1. Loaded using Pandas.
2. Converted into a proper datetime format.
3. Missing measurement values are handled.
4. Aggregated into hourly observations.
5. Used as input for anomaly detection.

The processed dataset contains:

**34,168 hourly records**

The project analyzes historical data from approximately:

**December 2006 – November 2010**

> This project currently analyzes historical electricity data and is not a live or real-time monitoring system.

---

## Machine Learning

### Isolation Forest

GreenLoad AI uses **Isolation Forest** for unsupervised anomaly detection.

Isolation Forest is suitable for this problem because the dataset does not provide predefined labels identifying which observations are anomalous.

The model analyzes multiple energy-related features simultaneously and identifies observations that are isolated from typical patterns in the dataset.

### Model Configuration

```text
Algorithm: Isolation Forest
Contamination: 0.02
Random State: 42
```

The current pipeline identifies:

**684 anomalies**

from the 34,168 hourly observations.

### Features Used

The anomaly detection model uses:

* Global Active Power
* Global Reactive Power
* Voltage
* Global Intensity
* Sub-metering 1
* Sub-metering 2
* Sub-metering 3

The model produces an anomaly score and anomaly classification for each valid observation.

---

## Feature Engineering

Additional contextual information is generated to make detected anomalies easier to interpret.

The enriched dataset contains:

### Temporal Features

* Hour
* Date
* Day of week
* Month
* Month name
* Season

### Historical Baselines

For each hour of the day, the system calculates typical historical values such as:

* Typical hourly power
* Typical sub-metering values
* Typical reactive power
* Typical voltage
* Typical global intensity

### Deviation

The system calculates how far the observed active power differs from its typical hourly value.

For example:

```text
Observed Power: 5.76 kW
Typical Power:  0.53 kW
Deviation:      +984.31%
```

### Neighboring Hours

The system also considers:

* Previous hour consumption
* Next hour consumption
* Previous hour deviation
* Next hour deviation

This helps distinguish a single unusual observation from a pattern that continues across neighboring hours.

---

## Explainable AI

### SHAP

GreenLoad AI uses **SHAP (SHapley Additive exPlanations)** to understand the contribution of individual features to the Isolation Forest model output.

SHAP values are calculated for the seven energy features used by the anomaly detection model:

* Global Active Power
* Global Reactive Power
* Voltage
* Global Intensity
* Sub-metering 1
* Sub-metering 2
* Sub-metering 3

For each anomaly, the system identifies the strongest feature contributors based on the absolute SHAP magnitude.

This provides a more interpretable view of the model instead of showing only an anomaly label.

> SHAP values explain contributions to the Isolation Forest raw tree output. They are not directly equivalent to the anomaly `decision_function` score.

---

## IBM Bob Integration

IBM Bob is used as the **AI explanation and recommendation layer**.

The machine learning pipeline generates a structured context containing:

* Observed energy measurements
* Typical historical values
* Percentage deviation
* Previous and next hour context
* Temporal information
* Seasonal information
* Isolation Forest anomaly score
* SHAP feature contributions
* Model limitations

This context is passed to IBM Bob with instructions to:

* Use only the supplied evidence
* Separate observed facts from possible interpretations
* Avoid claiming unsupported appliance-level causes
* Explain the anomaly using actual numerical values
* Provide practical recommendations
* Clearly communicate limitations

### Example Explanation Flow

```text
Detected Anomaly
      ↓
Observed vs Typical Consumption
      ↓
Temporal Context
      ↓
Model Contributors
      ↓
AI Interpretation
      ↓
Sustainability Actions
```

IBM Bob does not perform the initial anomaly detection. The anomaly is detected by the machine learning pipeline before the AI explanation layer is invoked.

---

## System Architecture

```text
                         ┌──────────────────────┐
                         │   UCI Energy Data    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Data Preprocessing  │
                         │      + Hourly        │
                         │     Aggregation      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Isolation Forest   │
                         │   Anomaly Detection  │
                         └──────────┬───────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
        ┌──────────────────────┐          ┌──────────────────────┐
        │ Historical / Temporal│          │        SHAP          │
        │       Context        │          │   Explainability     │
        └──────────┬───────────┘          └──────────┬───────────┘
                   │                                 │
                   └────────────────┬────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Structured AI       │
                         │      Context         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      IBM Bob         │
                         │ Explanation Layer    │
                         └──────────┬───────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                          ▼                   ▼
                  ┌──────────────┐    ┌──────────────┐
                  │ Explanation  │    │Recommendations│
                  └──────┬───────┘    └──────┬───────┘
                         │                   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │   React Dashboard     │
                         └──────────────────────┘
```

---

## Dashboard

The GreenLoad AI dashboard is organized into three main experiences.

### 1. Overview

The Overview page provides a quick understanding of the selected anomaly.

It displays:

* Observed power
* Typical power
* Percentage deviation
* Isolation Forest anomaly score
* Previous hour consumption
* Next hour consumption
* Top model contributors
* AI-generated insight

The information updates when a different anomaly is selected.
#### Overview Dashboard
<img src="https://raw.githubusercontent.com/vj2573/greenload-ai/main/overview-1.png" alt="GreenLoad AI Overview - Part 1">

<img src="https://raw.githubusercontent.com/vj2573/greenload-ai/main/overview-2.png" alt="GreenLoad AI Overview - Part 2">

---

### 2. Explain

The Explain page presents the anomaly as a progressive explanation:

```text
01 → Consumption was unusual

02 → The surrounding pattern was examined

03 → Key model contributors were identified

04 → AI interpreted the available evidence
```

The page also provides sustainability actions based on the selected anomaly.
#### Explain Dashboard
<img src="https://raw.githubusercontent.com/vj2573/greenload-ai/main/explain-1.png" alt="GreenLoad AI Explain - Part 1">

<img src="https://raw.githubusercontent.com/vj2573/greenload-ai/main/explain-2.png" alt="GreenLoad AI Explain - Part 2">

---

### 3. Explore

The Explore page allows users to inspect the historical dataset interactively.

Users can explore:

* Different energy metrics
* Different date ranges
* Historical hourly consumption
* Detected anomalies
* Anomaly-only observations

The chart provides a visual way to investigate unusual consumption patterns across the historical dataset.
#### Explore Dashboard
!<img src="https://raw.githubusercontent.com/vj2573/greenload-ai/main/explore-1.png" alt="GreenLoad AI Explore - Part 1">

<img src="https://raw.githubusercontent.com/vj2573/greenload-ai/main/explore-2.png" alt="GreenLoad AI Explore - Part 2">

---

## Project Structure

```text
GreenLoad-AI/
│
├── data/
│   ├── energy_with_anomalies.csv
│   ├── enriched_energy_data.csv
│   ├── anomaly_shap.csv
│   ├── sample_ai_context.txt
│   └── bob_explanation.json
│
├── ml/
│   ├── preprocess.py
│   ├── anomaly_detection.py
│   ├── enrich_anomalies.py
│   ├── explain_anomalies.py
│   ├── create_ai_context.py
│   └── test_bob_integration.py
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── docs/
├── .gitignore
└── README.md
```

Large datasets, generated files, environment variables, and local dependencies are excluded from version control where appropriate.
The original UCI raw dataset and intermediate hourly dataset are excluded from version control because of their size. They are generated/downloaded locally during the ML pipeline.

---

## Technology Stack

| Category              | Technology         |
| --------------------- | ------------------ |
| Programming Languages | Python, JavaScript |
| Data Processing       | Pandas, NumPy      |
| Machine Learning      | Scikit-learn       |
| Anomaly Detection     | Isolation Forest   |
| Explainable AI        | SHAP               |
| Generative AI         | IBM Bob            |
| Backend               | Node.js, Express   |
| Frontend              | React              |
| Build Tool            | Vite               |
| Data Visualization    | Recharts           |
| Icons                 | Lucide React       |
| API Communication     | REST API           |
| Version Control       | Git, GitHub        |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/vj2573/greenload-ai.git
cd greenload-ai
```

### 2. Set Up Python Environment

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install pandas numpy scikit-learn shap scipy python-dotenv
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Install Frontend Dependencies

Open another terminal:

```powershell
cd frontend
npm install
```

---

## Running the Project

### Step 1 — Run the ML Pipeline

From the project root:

```powershell
python ml/preprocess.py
```

Then:

```powershell
python ml/anomaly_detection.py
```

Then:

```powershell
python ml/enrich_anomalies.py
```

Then:

```powershell
python ml/explain_anomalies.py
```

Then:

```powershell
python ml/create_ai_context.py
```

These scripts generate the processed datasets and explainability information required by the dashboard.

---

### Step 2 — Generate IBM Bob Explanation

Configure the IBM Bob API key through an environment variable.

Create a `.env` file in the project root:

```text
BOB_API_KEY=your_api_key_here
```

> Never commit your API key to GitHub.

Run:

```powershell
python ml/test_bob_integration.py
```

The generated explanation is saved to:

```text
data/bob_explanation.json
```

---

### Step 3 — Start the Backend

From the `backend` directory:

```powershell
node server.js
```

The backend runs at:

```text
http://localhost:5000
```

Available API endpoints include:

```text
GET /api/anomaly
GET /api/energy
GET /api/anomalies
```

---

### Step 4 — Start the Frontend

From the `frontend` directory:

```powershell
npm run dev
```

Open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

---

## API Overview

### `GET /api/anomaly`

Returns the AI-generated explanation for the featured anomaly.

### `GET /api/energy`

Returns the processed historical energy dataset used by the dashboard.

### `GET /api/anomalies`

Returns detected anomalies together with:

* Energy measurements
* Anomaly score
* Temporal context
* Historical baseline
* Percentage deviation
* Previous/next hour context
* SHAP values

---

## Sustainability & SDGs

GreenLoad AI primarily supports:

### SDG 7 — Affordable and Clean Energy

The project encourages better understanding and more efficient use of electricity by identifying unusual consumption patterns and providing actionable information.

It also relates to:

### SDG 12 — Responsible Consumption and Production

The system promotes awareness of consumption patterns and encourages investigation of potentially unnecessary or unusual energy usage.

---

## Limitations

GreenLoad AI is a prototype and has several limitations.

### Historical Data

The current system uses historical household electricity data and does not provide live smart-meter monitoring.

### Circuit-Level Information

The sub-metering measurements represent circuit groups and do not identify individual appliances.

Therefore, the system cannot directly conclude that a specific appliance caused an anomaly.

### Unmetered Consumption

The system calculates an estimated consumption remainder from total active power and the available sub-metering measurements.

This remainder represents unattributed consumption and is not an independently measured circuit.

### Anomaly Detection

An anomaly classification indicates that the observation differs from patterns learned by the Isolation Forest model.

It does not prove the physical cause of the unusual consumption.

### SHAP Interpretation

SHAP values explain contributions to the Isolation Forest raw tree output. They should not be interpreted as a direct measure of anomaly severity.

### Context Limitations

The current dataset does not provide information such as:

* Household occupancy
* Appliance schedules
* Weather conditions
* Electricity tariffs
* Specific appliance activity

Therefore, the system avoids making unsupported assumptions about these factors.

---

## Future Improvements

Potential future improvements include:

* Integration with additional household energy datasets
* More advanced anomaly detection models
* Anomaly ranking and prioritization
* Appliance-level energy disaggregation
* Expanded sustainability knowledge base
* Retrieval-Augmented Generation (RAG)
* Personalized energy-saving recommendations
* Cloud deployment
* Real-time smart-meter integration
* Historical trend comparison across households

---

## Current Project Status

**Status: Working Prototype**

The current implementation supports the complete pipeline:

```text
Historical Energy Data
        ↓
Data Processing
        ↓
Anomaly Detection
        ↓
Feature Engineering
        ↓
SHAP Explainability
        ↓
IBM Bob Integration
        ↓
AI Explanation
        ↓
Sustainability Recommendations
        ↓
Interactive React Dashboard
```

---

## Author

**Viditi Joshi**

B.Tech Computer Science and Engineering
IIIT Vadodara

---

## Acknowledgements

* UCI Machine Learning Repository — Individual Household Electric Power Consumption Dataset
* Scikit-learn
* SHAP
* IBM Bob
* React
* Vite
* Recharts
* Lucide React

---

## License

This project is developed for educational, research, and portfolio purposes.
