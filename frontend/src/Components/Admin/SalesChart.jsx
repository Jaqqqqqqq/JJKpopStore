import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API } from "../../api";

function dateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export default function SalesChart() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 29);
  const [startDate, setStartDate] = useState(dateInputValue(monthAgo));
  const [endDate, setEndDate] = useState(dateInputValue(today));
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function getSales() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ startDate, endDate });
        const { data } = await axios.get(`${API}/admin/sales-chart?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!cancelled) setSales(data.sales || []);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load sales data.");
          setSales([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    getSales();
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  const totalSales = useMemo(
    () => sales.reduce((total, day) => total + Number(day.total || 0), 0),
    [sales]
  );

  return (
    <section className="sales-chart-card" aria-labelledby="sales-chart-title">
      <div className="sales-chart-heading">
        <div>
          <p className="eyebrow">STORE PERFORMANCE</p>
          <h2 id="sales-chart-title">Completed Order Sales</h2>
          <p>Daily revenue from completed transactions during the selected dates.</p>
        </div>
        <strong>PHP {totalSales.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
      <div className="sales-chart-filters">
        <label>From <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>To <input type="date" value={endDate} min={startDate} max={dateInputValue(today)} onChange={(event) => setEndDate(event.target.value)} /></label>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {loading ? <p>Loading sales chart...</p> : sales.length === 0 ? (
        <p className="sales-chart-empty">No completed order sales in this date range.</p>
      ) : (
        <div className="sales-chart-plot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sales} margin={{ top: 12, right: 18, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#f1dfe7" strokeDasharray="4 4" />
              <XAxis dataKey="date" tick={{ fill: "#74636c", fontSize: 12 }} />
              <YAxis tick={{ fill: "#74636c", fontSize: 12 }} tickFormatter={(value) => `₱${Number(value).toLocaleString("en-PH")}`} />
              <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, "Sales"]} />
              <Bar dataKey="total" name="Sales" fill="#ed5791" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
