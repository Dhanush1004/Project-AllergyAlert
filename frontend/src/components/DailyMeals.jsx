import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DailyMeals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskLevel, setRiskLevel] = useState("low");

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/smart/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMeals(res.data.recommended_meals);
      setRiskLevel(res.data.risk_level);
    } catch (err) {
      toast.error("Failed to load meal recommendations");
    } finally {
      setLoading(false);
    }
  };

  const addToDiary = async (mealName) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/diary`,
        {
          symptoms: "Meal consumed",
          severity: "none",
          notes: `Ate recommended safe meal: ${mealName}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Added to diary");
    } catch (err) {
      toast.error("Failed to add to diary");
    }
  };

  const getRiskColor = () => {
    if (riskLevel === "high") return "text-red-600";
    if (riskLevel === "medium") return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      
      {/* Risk Level Header */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Today's Meal Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-bold ${getRiskColor()}`}>
            Overall Allergy Risk Today: {riskLevel.toUpperCase()}
          </p>
          <p className="text-gray-600">
            Based on your symptoms and food history.
          </p>
        </CardContent>
      </Card>

      {/* Meals List */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Safe Meals for You Today
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : meals.length === 0 ? (
            <p className="text-gray-600">No safe meals detected today.</p>
          ) : (
            <div className="space-y-6">
              {meals.map((meal, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-white shadow-sm"
                >
                  <h3 className="text-lg font-bold">{meal.name}</h3>

                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Ingredients:</strong>{" "}
                    {meal.ingredients.join(", ")}
                  </p>

                  <p className="text-sm mt-2">
                    Allergy Risk Level:{" "}
                    <span
                      className={
                        meal.estimated_allergy_level === "low"
                          ? "text-green-600 font-semibold"
                          : meal.estimated_allergy_level === "medium"
                          ? "text-yellow-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {meal.estimated_allergy_level}
                    </span>
                  </p>

                  <Button
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={() => addToDiary(meal.name)}
                  >
                    Add to Diary
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
