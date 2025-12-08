import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function MealLogger() {
  const [meal, setMeal] = useState("");
  const [allergyLevel, setAllergyLevel] = useState("none");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & sorting
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState("");
  const [sortMode, setSortMode] = useState("newest"); // newest | oldest | severity

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/meals/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load meal logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const saveMeal = async () => {
    if (!meal.trim()) {
      toast.error("Enter meal name");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/meals/log`,
        {
          meal,
          allergy_level: allergyLevel,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Meal saved automatically with date & time!");
      setMeal("");
      setAllergyLevel("none");
      loadLogs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save meal");
    }
  };

  // Map severity to number for charts
  const severityToNum = (s) => {
    if (s === "high") return 3;
    if (s === "mild") return 2;
    return 1; // none
  };

  const numToSeverityLabel = (n) => {
    if (n === 3) return "High";
    if (n === 2) return "Mild";
    return "None";
  };

  // ----- Filter + Sort -----
  const filteredLogs = useMemo(() => {
    let data = [...logs];

    // Date filter
    if (startDate) {
      data = data.filter((l) => l.date >= startDate);
    }
    if (endDate) {
      data = data.filter((l) => l.date <= endDate);
    }

    // Sorting
    data.sort((a, b) => {
      const da = new Date(`${a.date}T${a.time || "00:00"}`);
      const db = new Date(`${b.date}T${b.time || "00:00"}`);

      if (sortMode === "newest") return db - da;
      if (sortMode === "oldest") return da - db;
      if (sortMode === "severity") {
        // high > mild > none
        return severityToNum(b.allergy_level) - severityToNum(a.allergy_level);
      }
      return 0;
    });

    return data;
  }, [logs, startDate, endDate, sortMode]);

  // ----- Chart Data -----
  const lineChartData = filteredLogs.map((l) => ({
    dateTime: `${l.date} ${l.time}`,
    level: severityToNum(l.allergy_level),
  }));

  // Pie chart – distribution of severity
  const pieData = useMemo(() => {
    const counts = { none: 0, mild: 0, high: 0 };
    filteredLogs.forEach((l) => {
      const sev = (l.allergy_level || "none").toLowerCase();
      if (counts[sev] !== undefined) counts[sev] += 1;
    });
    return [
      { name: "None", value: counts.none },
      { name: "Mild", value: counts.mild },
      { name: "High", value: counts.high },
    ].filter((item) => item.value > 0);
  }, [filteredLogs]);

  const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"]; // green, yellow, red

  // Weekly bar chart (last 7 days)
  const weeklyBarData = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // include today

    // Group by date
    const byDate = {};

    logs.forEach((l) => {
      const d = new Date(`${l.date}T00:00:00`);
      if (d < sevenDaysAgo || d > now) return;

      if (!byDate[l.date]) {
        byDate[l.date] = { total: 0, sumLevel: 0 };
      }
      byDate[l.date].total += 1;
      byDate[l.date].sumLevel += severityToNum(l.allergy_level);
    });

    // Build array sorted by date
    const dates = Object.keys(byDate).sort();
    return dates.map((date) => ({
      date,
      avgLevel: byDate[date].sumLevel / byDate[date].total,
    }));
  }, [logs]);

  // Simple weekly summary
  const weeklySummary = useMemo(() => {
    if (weeklyBarData.length === 0) {
      return { avg: 0, max: 0 };
    }
    let total = 0;
    let max = 0;
    weeklyBarData.forEach((d) => {
      total += d.avgLevel;
      if (d.avgLevel > max) max = d.avgLevel;
    });
    return {
      avg: total / weeklyBarData.length,
      max,
    };
  }, [weeklyBarData]);

  // Export to CSV
  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Meal", "Allergy Level", "Date", "Time"];
    const rows = filteredLogs.map((l) => [
      `"${l.meal.replace(/"/g, '""')}"`,
      l.allergy_level,
      l.date,
      l.time,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "meal_logs.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Meal & Allergy Logger</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* INPUT FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Log Your Meals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Meal name
            </label>
            <input
              className="w-full border p-2 rounded"
              placeholder="Example: Idli with sambar"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Allergy level after eating
            </label>
            <select
              className="w-full border p-2 rounded"
              value={allergyLevel}
              onChange={(e) => setAllergyLevel(e.target.value)}
            >
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="high">High</option>
            </select>
          </div>

          <Button className="bg-blue-600" onClick={saveMeal}>
            Save Meal (date & time auto)
          </Button>
        </CardContent>
      </Card>

      {/* FILTERS + SUMMARY */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Filters */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Start date
              </label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End date
              </label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Sort by
              </label>
              <select
                className="w-full border p-2 rounded"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="severity">Severity (High → Low)</option>
              </select>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="mt-4 text-sm text-gray-700">
            <p>
              <strong>Last 7 days:</strong>{" "}
              {weeklyBarData.length === 0
                ? "No meals logged."
                : `Average level: ${weeklySummary.avg.toFixed(
                    2
                  )} (${numToSeverityLabel(
                    Math.round(weeklySummary.avg)
                  )}), Highest daily avg: ${weeklySummary.max.toFixed(2)} (${numToSeverityLabel(
                    Math.round(weeklySummary.max)
                  )})`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Allergy Level Over Time</CardTitle>
          </CardHeader>
          <CardContent style={{ height: "300px" }}>
            {loading ? (
              <p>Loading...</p>
            ) : lineChartData.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No logs to display. Log a meal to see the trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateTime" tick={{ fontSize: 10 }} />
                  <YAxis
                    ticks={[1, 2, 3]}
                    tickFormatter={(v) => numToSeverityLabel(v)}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "level"
                        ? numToSeverityLabel(value)
                        : value
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="level"
                    stroke="#4f46e5"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart + Weekly Bar */}
        <div className="space-y-8">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Severity Distribution (Filtered)</CardTitle>
            </CardHeader>
            <CardContent style={{ height: "220px" }}>
              {pieData.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No data to show severity distribution.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={3}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Weekly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Average Daily Allergy Level (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent style={{ height: "220px" }}>
              {weeklyBarData.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No meals logged in the last 7 days.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      ticks={[1, 2, 3]}
                      tickFormatter={(v) => numToSeverityLabel(v)}
                    />
                    <Tooltip
                      formatter={(value) => numToSeverityLabel(Math.round(value))}
                    />
                    <Bar dataKey="avgLevel" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LOG TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Logged Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-gray-600 text-sm">No meals logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Time</th>
                    <th className="text-left py-2 px-2">Meal</th>
                    <th className="text-left py-2 px-2">Allergy Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 px-2">{l.date}</td>
                      <td className="py-2 px-2">{l.time}</td>
                      <td className="py-2 px-2">{l.meal}</td>
                      <td className="py-2 px-2 capitalize">
                        {l.allergy_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
