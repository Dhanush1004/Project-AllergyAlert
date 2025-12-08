import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

export default function AllergyProfileSetup({ user, onLogout }) {
  const navigate = useNavigate();
  const [commonAllergens, setCommonAllergens] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [customAllergens, setCustomAllergens] = useState([]);
  const [severityLevels, setSeverityLevels] = useState({});
  const [newCustom, setNewCustom] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [allergensRes, profileRes] = await Promise.all([
        axios.get(`${API}/allergens/common`),
        axios.get(`${API}/profile`, { headers }),
      ]);

      setCommonAllergens(allergensRes.data.allergens);
      if (profileRes.data) {
        setSelectedAllergens(profileRes.data.allergens || []);
        setCustomAllergens(profileRes.data.custom_allergens || []);
        setSeverityLevels(profileRes.data.severity_levels || {});
      }
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  const handleToggleAllergen = (allergen) => {
    if (selectedAllergens.includes(allergen)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== allergen));
      const newSeverity = { ...severityLevels };
      delete newSeverity[allergen];
      setSeverityLevels(newSeverity);
    } else {
      setSelectedAllergens([...selectedAllergens, allergen]);
    }
  };

  const handleAddCustom = () => {
    if (newCustom.trim() && !customAllergens.includes(newCustom.trim())) {
      setCustomAllergens([...customAllergens, newCustom.trim()]);
      setNewCustom("");
    }
  };

  const handleRemoveCustom = (allergen) => {
    setCustomAllergens(customAllergens.filter((a) => a !== allergen));
    const newSeverity = { ...severityLevels };
    delete newSeverity[allergen];
    setSeverityLevels(newSeverity);
  };

  const handleSeverityChange = (allergen, severity) => {
    setSeverityLevels({ ...severityLevels, [allergen]: severity });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/profile`,
        {
          allergens: selectedAllergens,
          custom_allergens: customAllergens,
          severity_levels: severityLevels,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Manrope, sans-serif", color: "#667eea" }}
          >
            AllergyAlert
          </h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Allergy Profile Setup
        </h2>

        {/* Common Allergens */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle style={{ fontFamily: "Manrope, sans-serif" }}>
              Common Allergens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonAllergens.map((allergen) => (
                <div key={allergen} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={allergen}
                      checked={selectedAllergens.includes(allergen)}
                      onCheckedChange={() => handleToggleAllergen(allergen)}
                    />
                    <label
                      htmlFor={allergen}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {allergen.replace("_", " ")}
                    </label>
                  </div>
                  {selectedAllergens.includes(allergen) && (
                    <Select
                      value={severityLevels[allergen] || "medium"}
                      onValueChange={(value) =>
                        handleSeverityChange(allergen, value)
                      }
                    >
                      <SelectTrigger className="ml-6">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Allergens */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle style={{ fontFamily: "Manrope, sans-serif" }}>
              Custom Allergens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="Add custom allergen..."
                value={newCustom}
                onChange={(e) => setNewCustom(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCustom()}
              />
              <Button onClick={handleAddCustom}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {customAllergens.map((allergen) => (
                <div
                  key={allergen}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{allergen}</span>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={severityLevels[allergen] || "medium"}
                      onValueChange={(value) =>
                        handleSeverityChange(allergen, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustom(allergen)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save/Cancel */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
