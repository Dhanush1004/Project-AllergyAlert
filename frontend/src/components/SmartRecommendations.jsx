import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/App";

export default function SmartRecommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API}/smart/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setData(res.data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <p style={{ textAlign: "center", padding: 20 }}>Loading...</p>;
  if (!data) return <p style={{ textAlign: "center", padding: 20 }}>No data.</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        Smart Allergy Recommendations
      </h1>

      <div className="card">
        <h2>Overall Allergy Risk Score</h2>
        <p style={{ fontSize: "30px", fontWeight: "bold" }}>{data.overall_risk_score}</p>
        <p>
          Risk Level:{" "}
          <strong
            style={{
              color:
                data.risk_level === "high"
                  ? "red"
                  : data.risk_level === "medium"
                  ? "orange"
                  : "green",
            }}
          >
            {data.risk_level.toUpperCase()}
          </strong>
        </p>
      </div>

      <div className="card">
        <h2>Risky Foods</h2>
        {data?.risky_foods?.length === 0 ? (
          <p>No risky foods detected</p>
        ) : (
          <ul>
            {data.risky_foods.map((food, index) => (
              <li key={index} style={{ color: "red", fontWeight: "bold" }}>
                {food}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Recommended Meals</h2>
        {data?.recommended_meals?.map((meal, i) => (
          <div key={i} className="meal-card">
            <h3>{meal.name}</h3>
            <p>Ingredients: {meal.ingredients.join(", ")}</p>
            <p>
              Estimated Allergy Level:{" "}
              <strong>{meal.estimated_allergy_level}</strong>
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Recent Diary</h2>
        {data?.recent_diary?.length === 0 ? (
          <p>No diary entries.</p>
        ) : (
          data.recent_diary.map((d) => (
            <div key={d.id} className="diary-card">
              <p><strong>Symptoms:</strong> {d.symptoms}</p>
              <p><strong>Severity:</strong> {d.severity}</p>
              <p style={{ fontSize: "12px", opacity: 0.6 }}>{d.date.slice(0, 10)}</p>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Health Tips</h2>
        <ul>
          {data?.tips?.map((tip, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
