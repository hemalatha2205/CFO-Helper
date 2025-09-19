import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [hires, setHires] = useState(0);
  const [extraSpend, setExtraSpend] = useState(0);
  const [priceDelta, setPriceDelta] = useState(0);
  const [forecast, setForecast] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [usage, setUsage] = useState({ scenarios: 0, reports: 0 });

  const simulate = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/simulate", {
        hires,
        extra_spend: extraSpend,
        price_delta: priceDelta
      });
      setForecast(res.data.forecast);

      // Chart data
      setChartData({
        labels: ["Jan","Feb","Mar","Apr","May","Jun"],
        datasets: [
          { label: "Revenue (₹)", data: Array(6).fill(res.data.forecast.revenue), backgroundColor: "rgba(0,216,255,0.7)" },
          { label: "Expenses (₹)", data: Array(6).fill(res.data.forecast.expenses), backgroundColor: "rgba(255,99,132,0.7)" }
        ]
      });

      setUsage(res.data.usage);
    } catch (err) {
      alert("Backend not running! Make sure Flask is active at port 5000.");
    }
  };

  const exportReport = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/export-report", { responseType: 'blob' });
      setUsage(prev => ({ ...prev, reports: prev.reports + 1 }));

      // Download PDF
      const blob = await axios.post("http://127.0.0.1:5000/export-report", {}, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([blob.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.pdf");
      document.body.appendChild(link);
      link.click();

    } catch (err) {
      alert("Backend not running! Make sure Flask is active at port 5000.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>CFO Helper Pro</h1>

      <div>
        <label>Hires: {hires}</label>
        <input type="range" min="0" max="10" value={hires} onChange={(e) => setHires(+e.target.value)} />
      </div>

      <div>
        <label>Extra Spend: ₹{extraSpend}</label>
        <input type="range" min="0" max="200000" step="1000" value={extraSpend} onChange={(e) => setExtraSpend(+e.target.value)} />
      </div>

      <div>
        <label>Price Increase %: {priceDelta}%</label>
        <input type="range" min="0" max="50" value={priceDelta} onChange={(e) => setPriceDelta(+e.target.value)} />
      </div>

      <button onClick={simulate}>Simulate</button>
      <button onClick={exportReport}>Export Report</button>

      {forecast && (
        <div>
          <h2>Forecast</h2>
          <p>Revenue: ₹{forecast.revenue}</p>
          <p>Expenses: ₹{forecast.expenses}</p>
          <p>Profit: ₹{forecast.profit}</p>
          <p>Runway: {forecast.runway} months</p>

          {chartData && <Bar data={chartData} />}
        </div>
      )}

      <p>Usage - Scenarios: {usage.scenarios}, Reports: {usage.reports}</p>
    </div>
  );
}

export default App;
