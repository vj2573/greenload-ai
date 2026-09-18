import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  Clock3,
  Gauge,
  Leaf,
  Menu,
  Zap,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [anomaly, setAnomaly] = useState(null);
  const [energyData, setEnergyData] = useState([]);

  const [anomalies, setAnomalies] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);

  const [loading, setLoading] = useState(true);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [error, setError] = useState(null);

  const [exploreMetric, setExploreMetric] = useState("global_active_power");
  const [exploreRange, setExploreRange] = useState("24h");
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [exploreStartDate, setExploreStartDate] = useState("2006-12-16");

 useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const [anomalyResponse, energyResponse, anomaliesResponse] =
      await Promise.all([
        fetch("http://localhost:5000/api/anomaly"),
        fetch("http://localhost:5000/api/energy"),
        fetch("http://localhost:5000/api/anomalies"),
  ]);

      if (!anomalyResponse.ok) {
        throw new Error("Failed to load anomaly explanation");
      }

      if (!energyResponse.ok) {
        throw new Error("Failed to load energy data");
      }

      if (!anomaliesResponse.ok) {
         throw new Error("Failed to load anomaly data");
      }

      const anomalyData = await anomalyResponse.json();
      const energyData = await energyResponse.json();
      const anomaliesData = await anomaliesResponse.json();

      setAnomaly(anomalyData);
      setEnergyData(energyData);
      setAnomalies(anomaliesData.anomalies);
      setSelectedAnomaly(anomaliesData.anomalies[0]);
      setLoading(false);
      setEnergyLoading(false);

      console.log("Energy records loaded:", energyData.length);
    } catch (err) {
      console.error(err);
      setError("Could not connect to the GreenLoad AI backend.");
      setLoading(false);
      setEnergyLoading(false);
    }
  };

  fetchDashboardData();
}, []);

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader"></div>
        <p>Loading GreenLoad AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app loading-screen">
        <AlertTriangle size={32} />
        <p>{error}</p>
        <span>Make sure the backend is running on port 5000.</span>
      </div>
    );
  }

  const evidence = anomaly?.evidence || {};
const observed = evidence.observed_vs_typical || {};
const temporal = evidence.temporal_context || {};
const model = evidence.anomaly_model || {};
const shap = anomaly?.shap_explanation || {};

// Use the anomaly selected from Explore.
// Fall back to the original BOB anomaly until the user selects one.
const currentAnomaly = selectedAnomaly;
console.log("Selected anomaly:", selectedAnomaly);

const currentObservedPower = currentAnomaly
  ? currentAnomaly.global_active_power
  : observed.global_active_power_kW?.observed;

const currentTypicalPower = currentAnomaly
  ? currentAnomaly.typical_hourly_power
  : observed.global_active_power_kW?.typical;

const currentDifference = currentAnomaly
  ? currentAnomaly.difference_percent
  : Number(
      observed.global_active_power_kW?.pct_above_typical?.replace("%", "")
    );

const currentScore = currentAnomaly
  ? currentAnomaly.anomaly_score
  : model.decision_function_score;

const currentPreviousPower = currentAnomaly
  ? currentAnomaly.previous_hour_power
  : temporal.previous_hour_kW;

const currentNextPower = currentAnomaly
  ? currentAnomaly.next_hour_power
  : temporal.next_hour_kW;

const currentPreviousDifference = currentAnomaly
  ? currentAnomaly.previous_hour_difference_percent
  : temporal.previous_hour_difference_percent;

const currentNextDifference = currentAnomaly
  ? currentAnomaly.next_hour_difference_percent
  : temporal.next_hour_difference_percent;

const currentShapContributors = currentAnomaly
  ? Object.entries(currentAnomaly.shap || {})
      .map(([feature, shap_value]) => ({
        feature,
        shap_value
      }))
      .sort(
        (a, b) =>
          Math.abs(b.shap_value) - Math.abs(a.shap_value)
      )
  : shap.top_contributors_by_absolute_value || [];

const currentDateTime = currentAnomaly
  ? currentAnomaly.datetime
  : "19 October 2008 01:00:00";
  
const exploreData = (() => {
  if (!energyData.length) return [];

  let data = [...energyData];

  const startIndex = data.findIndex((item) =>
    item.datetime.startsWith(exploreStartDate)
  );

  if (startIndex === -1) {
    return [];
  }

  const rangeSize = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  }[exploreRange];

  data = data.slice(startIndex, startIndex + rangeSize);

  if (showAnomaliesOnly) {
    data = data.filter((item) => item.is_anomaly === "1");
  }

  return data.map((item) => ({
    datetime: item.datetime,
    displayTime: item.datetime.slice(5, 16),
    value: Number(item[exploreMetric]),
    isAnomaly: item.is_anomaly === "1",
  }));
})();

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Leaf size={20} />
          </div>

          <div>
            <h1>GreenLoad</h1>
            <span>AI Energy Intelligence</span>
          </div>
        </div>

        <nav className="navigation">
          <button
            className={activeTab === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={19} />
            Overview
          </button>

          <button
            className={activeTab === "explain" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("explain")}
          >
            <Brain size={19} />
            Explain
          </button>

          <button
            className={activeTab === "explore" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveTab("explore")}
          >
            <BarChart3 size={19} />
            Explore
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot"></div>
          <div>
            <strong>Analysis ready</strong>
            <span>Historical dataset</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ENERGY INTELLIGENCE</p>
            <h2>
              {activeTab === "overview" && "Consumption Overview"}
              {activeTab === "explain" && "Why was this flagged?"}
              {activeTab === "explore" && "Explore the Data"}
            </h2>
          </div>

<div className="dataset-info-wrapper">
  <button
    className="historical-badge"
    onClick={() => setShowDatasetInfo((prev) => !prev)}
  >
    <Clock3 size={15} />
    Historical Dataset
    <ChevronRight
      size={14}
      className={showDatasetInfo ? "dataset-chevron open" : "dataset-chevron"}
    />
  </button>

  {showDatasetInfo && (
    <div className="dataset-popover">
      <div className="dataset-popover-header">
        <div className="dataset-popover-icon">
          <Clock3 size={17} />
        </div>

        <div>
          <strong>Historical Dataset</strong>
          <span>Energy consumption analysis</span>
        </div>
      </div>

      <div className="dataset-details">
        <div>
          <span>Source</span>
          <strong>UCI Household Power</strong>
        </div>

        <div>
          <span>Period</span>
          <strong>Dec 2006 – Nov 2010</strong>
        </div>

        <div>
          <span>Resolution</span>
          <strong>Hourly</strong>
        </div>

        <div>
          <span>Records</span>
          <strong>{energyData.length.toLocaleString()}</strong>
        </div>

        <div>
          <span>Anomalies</span>
          <strong>{anomalies.length}</strong>
        </div>

        <div>
          <span>Detection</span>
          <strong>Isolation Forest</strong>
        </div>
      </div>

      <div className="dataset-note">
        This dashboard analyzes historical electricity
        consumption data. It is not a live monitoring system.
      </div>
    </div>
  )}
</div>
        </header>

        {activeTab === "overview" && (
          <>
            <section className="hero-grid">
              <div className="anomaly-card">
                <div className="card-top">
                  <div>
                    <span className="card-label">ANOMALY DETECTED</span>
                    <h3>Unusual energy consumption</h3>
                  </div>

                  <div className="warning-icon">
                    <AlertTriangle size={21} />
                  </div>
                </div>

                <div className="hero-number">
                  {currentObservedPower?.toFixed(2)}
                  <span> kW</span>
                </div>

                <p className="hero-description">
                  Historical consumption was{" "}
                  <strong>
                    {currentDifference?.toFixed(2)}%
                  </strong>{" "}
                  above the typical value for this hour.
                </p>

                <div className="timestamp">
                   <Clock3 size={15} />
                   {new Date(currentDateTime).toLocaleString("en-GB", {
                   day: "2-digit",
                   month: "long",
                   year: "numeric",
                   hour: "2-digit",
                   minute: "2-digit",
                   hour12: false,
                  })}
                </div>
              </div>

              <div className="insight-card">
                <div className="section-heading">
                  <div className="heading-icon">
                    <Brain size={18} />
                  </div>
                  <div>
                    <span className="card-label">BOB AI INSIGHT</span>
                    <h3>What stands out?</h3>
                  </div>
                </div>

<p>
  {currentAnomaly
    ? `The selected anomaly occurred on ${new Date(
        currentDateTime
      ).toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}. Global active power was ${currentObservedPower?.toFixed(
        2
      )} kW, approximately ${currentDifference?.toFixed(
        2
      )}% above the typical value of ${currentTypicalPower?.toFixed(
        2
      )} kW for this hour.`
    : anomaly.summary?.split(". ")[0] + "."}
</p>

                <button
                  className="text-button"
                  onClick={() => setActiveTab("explain")}
                >
                  See full explanation
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <section className="metrics-grid">
              <MetricCard
                icon={<Zap size={19} />}
                label="Observed Power"
                value={`${currentObservedPower?.toFixed(2)} kW`}
                detail={`Typical: ${currentTypicalPower?.toFixed(2)} kW`}
              />

              <MetricCard
                icon={<Gauge size={19} />}
                label="Deviation"
                value={`${currentDifference?.toFixed(2)}%`}
                detail="Compared with hourly baseline"
              />

              <MetricCard
                icon={<Activity size={19} />}
                label="Model Score"
                value={currentScore?.toFixed(4)}
                detail="Isolation Forest"
              />

              <MetricCard
                icon={<BarChart3 size={19} />}
                label="Classification"
                value="Anomaly"
                detail="Isolation Forest label −1"
                warning
              />
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="card-label">TEMPORAL CONTEXT</span>
                    <h3>Consumption around the anomaly</h3>
                  </div>
                </div>

                <div className="timeline">
                 <TimelineItem
  label="Previous hour"
  value={currentPreviousPower}
  deviation={`${currentPreviousDifference?.toFixed(2)}%`}
/>

<TimelineItem
  label="Anomaly hour"
  value={currentObservedPower}
  deviation={`${currentDifference?.toFixed(2)}%`}
  active
/>

<TimelineItem
  label="Next hour"
  value={currentNextPower}
  deviation={`${currentNextDifference?.toFixed(2)}%`}
/>
                </div>

<div className="timeline-note">
  <Activity size={16} />
  {currentPreviousDifference > 0 && currentNextDifference > 0
    ? "Elevated consumption spans multiple consecutive hours."
    : "Consumption returned closer to the hourly baseline around the anomaly."}
</div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="card-label">TOP CONTRIBUTORS</span>
                    <h3>What influenced the model?</h3>
                  </div>
                </div>

                <div className="feature-list">
                 {currentShapContributors
                   ?.slice(0, 3)
                   .map((feature) => (
                      <div className="feature-row" key={feature.feature}>
                        <div className="feature-info">
                          <span>
  {feature.feature
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())}
</span>
                          <strong>{feature.shap_value.toFixed(4)}</strong>
                        </div>

                        <div className="feature-bar">
                          <div
                            className="feature-fill"
                            style={{
                              width: `${Math.min(
                                Math.abs(feature.shap_value) * 45,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>

                <button
                  className="text-button"
                  onClick={() => setActiveTab("explain")}
                >
                  Understand these contributors
                  <ChevronRight size={16} />
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "explain" && (
          <section className="explain-page">
            <div className="explain-intro">
              <span className="card-label">EXPLAINABLE AI</span>
              <h3>Why did GreenLoad AI flag this?</h3>
              <p>
                The model identified this historical hour as unusual compared
                with patterns in the dataset. Here's the evidence behind that
                decision.
              </p>
            </div>

            <div className="explain-flow">
  <ExplainStep
    number="01"
    title="Consumption was unusual"
    description={
      currentAnomaly
        ? `Observed power was ${currentObservedPower?.toFixed(
            2
          )} kW compared with a typical ${currentTypicalPower?.toFixed(
            2
          )} kW.`
        : "No anomaly selected."
    }
  />

  <ExplainStep
    number="02"
    title="The pattern continued"
    description={
      currentAnomaly
        ? `The previous hour was ${currentPreviousPower?.toFixed(
            2
          )} kW, compared with ${currentPreviousDifference?.toFixed(
            2
          )}% above its typical value.`
        : "No anomaly selected."
    }
  />

  <ExplainStep
    number="03"
    title="The model identified key contributors"
    description={
      currentShapContributors
        ?.slice(0, 3)
        .map((item) => item.feature)
        .join(", ") || "Multiple energy features"
    }
  />

  <ExplainStep
    number="04"
    title="AI interpreted the evidence"
    description={
      currentAnomaly
        ? `At ${new Date(currentDateTime).toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })} on ${new Date(currentDateTime).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}, global active power was ${currentObservedPower?.toFixed(
            2
          )} kW, approximately ${currentDifference?.toFixed(
            2
          )}% above the typical value of ${currentTypicalPower?.toFixed(
            2
          )} kW for this hour. The Isolation Forest model classified this observation as an anomaly with a score of ${currentScore?.toFixed(
            4
          )}.`
        : anomaly.summary
    }
  />
</div>

<div className="recommendations-panel">
  <div className="panel-header">
    <div>
      <span className="card-label">SUSTAINABILITY ACTIONS</span>
      <h3>What can be investigated?</h3>
      <p className="panel-subtitle">
        Practical actions based on the selected anomaly.
      </p>
    </div>
  </div>

  <div className="recommendation-list">
    <div className="recommendation">
      <div className="recommendation-number">01</div>

      <div>
        <strong>Review the unusually high consumption</strong>
        <p>
          Global active power reached{" "}
          {currentObservedPower?.toFixed(2)} kW, compared with a typical{" "}
          {currentTypicalPower?.toFixed(2)} kW for this hour. Reviewing
          activity during this period can help identify the source of the
          elevated load.
        </p>
      </div>
    </div>

    <div className="recommendation">
      <div className="recommendation-number">02</div>

      <div>
        <strong>Investigate the circuits influencing the anomaly</strong>
        <p>
          The model's strongest contributors were{" "}
          {currentShapContributors
            ?.slice(0, 3)
            .map((item) => item.feature)
            .join(", ")}.
          Reviewing these measurements can provide more visibility into
          what contributed to the unusual pattern.
        </p>
      </div>
    </div>

    <div className="recommendation">
      <div className="recommendation-number">03</div>

      <div>
        <strong>Monitor whether the pattern recurs</strong>
        <p>
          Comparing the surrounding hours and future observations can help
          distinguish recurring high-consumption patterns from isolated
          anomalies.
        </p>
      </div>
    </div>
  </div>
</div>
          </section>
        )}

        {activeTab === "explore" && (
  <section className="explore-page">
    <div className="explore-header">
      <div>
        <span className="card-label">DATA EXPLORER</span>
        <h3>Explore historical energy patterns</h3>
        <p>
          Explore hourly electricity consumption and identify unusual
          periods detected by the Isolation Forest model.
        </p>
      </div>

      <div className="explore-record-count">
        <strong>{energyData.length.toLocaleString()}</strong>
        <span>hourly records</span>
      </div>
    </div>

<div className="explore-controls">

  <div className="control-group">
    <label>Start date</label>

    <input
      type="date"
      value={exploreStartDate}
      min="2006-12-16"
      max="2010-11-25"
      onChange={(e) => setExploreStartDate(e.target.value)}
    />
  </div>

  <div className="control-group">
    <label>Metric</label>

    <select
      value={exploreMetric}
      onChange={(e) => setExploreMetric(e.target.value)}
    >
      <option value="global_active_power">
        Active Power
      </option>

      <option value="global_reactive_power">
        Reactive Power
      </option>

      <option value="voltage">
        Voltage
      </option>

      <option value="global_intensity">
        Global Intensity
      </option>
    </select>
  </div>

  <div className="control-group">
    <label>Time range</label>

    <select
      value={exploreRange}
      onChange={(e) => setExploreRange(e.target.value)}
    >
      <option value="24h">24 hours</option>
      <option value="7d">7 days</option>
      <option value="30d">30 days</option>
    </select>
  </div>

      <label className="anomaly-toggle">
        <input
          type="checkbox"
          checked={showAnomaliesOnly}
          onChange={(e) => setShowAnomaliesOnly(e.target.checked)}
        />

        <span>Show anomalies only</span>
      </label>
    </div>

    <div className="explore-chart-card">
      <div className="panel-header">
        <div>
          <span className="card-label">
            {showAnomaliesOnly
              ? "ANOMALOUS PERIODS"
              : "ENERGY CONSUMPTION"}
          </span>

          <h3>
            {exploreMetric === "global_active_power" &&
              "Active power over time"}

            {exploreMetric === "global_reactive_power" &&
              "Reactive power over time"}

            {exploreMetric === "voltage" &&
              "Voltage over time"}

            {exploreMetric === "global_intensity" &&
              "Global intensity over time"}
          </h3>
        </div>
      </div>

      {energyLoading ? (
        <div className="explore-loading">
          Loading historical data...
        </div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={exploreData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
              />

              <XAxis
                dataKey="displayTime"
                stroke="#718078"
                tick={{ fill: "#8d9b94", fontSize: 11 }}
                minTickGap={35}
              />

              <YAxis
                stroke="#718078"
                tick={{ fill: "#8d9b94", fontSize: 11 }}
              />

              <Tooltip
                contentStyle={{
                  background: "#101714",
                  border: "1px solid rgba(57, 255, 136, 0.2)",
                  borderRadius: "10px",
                  color: "#e8f2ed",
                }}
                labelStyle={{
                  color: "#39ff88",
                }}
              />

<Line
  type="monotone"
  dataKey="value"
  stroke="#39ff88"
  strokeWidth={2}
  dot={(props) => {
    const { cx, cy, payload } = props;

    if (!payload.isAnomaly) {
      return null;
    }

    return (
      <g
        style={{ cursor: "pointer" }}
        onClick={() => {
          const clickedAnomaly = energyData.find(
            (item) => item.datetime === payload.datetime
          );

          if (clickedAnomaly) {
            const fullAnomaly = anomalies.find(
              (item) => item.datetime === clickedAnomaly.datetime
            );

            setSelectedAnomaly(
              fullAnomaly || {
                ...clickedAnomaly,
                global_active_power: Number(
                  clickedAnomaly.global_active_power
                ),
                global_reactive_power: Number(
                  clickedAnomaly.global_reactive_power
                ),
                voltage: Number(clickedAnomaly.voltage),
                global_intensity: Number(
                  clickedAnomaly.global_intensity
                ),
                anomaly_score: Number(
                  clickedAnomaly.anomaly_score
                ),
                difference_percent: 0,
                typical_hourly_power: 0,
                previous_hour_power: 0,
                next_hour_power: 0,
                previous_hour_difference_percent: 0,
                next_hour_difference_percent: 0,
                shap: {},
              }
            );

            setActiveTab("overview");
          }
        }}
      >
        {/* Invisible larger click area */}
        <circle
          cx={cx}
          cy={cy}
          r={18}
          fill="transparent"
          stroke="transparent"
          strokeWidth={8}
        />

        {/* Visible orange anomaly dot */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ffb84d"
          stroke="#101714"
          strokeWidth={2}
        />
      </g>
    );
  }}
/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    <div className="explore-summary">
      <div>
        <span>Displayed records</span>
        <strong>{exploreData.length.toLocaleString()}</strong>
      </div>

      <div>
        <span>Detected anomalies</span>
        <strong>
          {
            exploreData.filter((item) => item.isAnomaly).length
          }
        </strong>
      </div>

      <div>
        <span>Selected metric</span>
        <strong>
          {exploreMetric === "global_active_power"
            ? "Active Power"
            : exploreMetric === "global_reactive_power"
            ? "Reactive Power"
            : exploreMetric === "voltage"
            ? "Voltage"
            : "Global Intensity"}
        </strong>
      </div>
    </div>
  </section>
)}
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, warning = false }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className={warning ? "warning-text" : ""}>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function TimelineItem({ label, value, deviation, active = false }) {
  return (
    <div className={active ? "timeline-item active" : "timeline-item"}>
      <span>{label}</span>
      <strong>{value?.toFixed(2)} kW</strong>
      <small>{deviation}</small>
    </div>
  );
}

function ExplainStep({ number, title, description }) {
  return (
    <div className="explain-step">
      <div className="step-number">{number}</div>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default App;