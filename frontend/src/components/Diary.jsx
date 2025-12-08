import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function Diary() {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("none");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiary();
  }, []);

  const loadDiary = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/diary/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEntries(res.data.entries);
    } catch (err) {
      toast.error("Failed to load diary");
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!symptoms.trim()) {
      toast.error("Please enter symptoms");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/diary`,
        { symptoms, severity, notes },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Diary entry added");
      setSymptoms("");
      setNotes("");
      setSeverity("none");
      loadDiary();
    } catch (err) {
      toast.error("Failed to submit diary entry");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Add Entry */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Add Daily Symptom Entry</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Symptoms</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2"
              placeholder="Example: skin rash, sneezing, stomach pain..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Severity</label>
            <select
              className="w-full border rounded-lg p-2"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              className="w-full border rounded-lg p-2"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you ate, how long symptoms lasted, etc."
            ></textarea>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700" onClick={addEntry}>
            Save Entry
          </Button>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Diary Entries</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-600">No recent entries.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border">
                  <p><strong>Symptoms:</strong> {entry.symptoms}</p>
                  <p>
                    <strong>Severity:</strong>{" "}
                    <span className={
                      entry.severity === "high"
                        ? "text-red-600"
                        : entry.severity === "mild"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }>
                      {entry.severity}
                    </span>
                  </p>

                  {entry.notes && (
                    <p><strong>Notes:</strong> {entry.notes}</p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {entry.date.slice(0, 10)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
