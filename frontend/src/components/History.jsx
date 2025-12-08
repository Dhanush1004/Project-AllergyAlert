import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

export default function History({ user, onLogout }) {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = scans.filter(
        (scan) =>
          scan.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          scan.ingredients.some((ing) =>
            ing.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredScans(filtered);
    } else {
      setFilteredScans(scans);
    }
  }, [searchQuery, scans]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScans(res.data.history);
      setFilteredScans(res.data.history);

    } catch (error) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "severe":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
        };
      case "moderate":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
        };
      case "mild":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
        };
      default:
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            data-testid="back-button"
          >
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

      {/* Main Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Scan History
        </h2>

        {/* Search */}
        <Card className="mb-6" data-testid="search-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by product name or ingredients..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* History Display */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <Card data-testid="no-scans-card">
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? "No scans match your search"
                  : "No scan history yet"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => navigate("/scan")}
                  data-testid="start-scanning-button"
                >
                  Start Scanning
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="history-list">
            {filteredScans.map((scan, idx) => {
              const style = getSeverityStyle(scan.severity);
              return (
                <Card
                  key={idx}
                  className={`${style.border} border ${style.bg}`}
                  data-testid={`history-scan-${idx}`}
                >
                  <CardHeader>
                    <CardTitle
                      className="flex items-center justify-between"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      <div className="flex items-center">
                        {scan.safe ? (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        )}
                        <span>{scan.product_name}</span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${style.text}`}
                        data-testid={`scan-severity-${idx}`}
                      >
                        {scan.severity === "safe"
                          ? "✓ Safe"
                          : `⚠ ${scan.severity.toUpperCase()}`}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Scan Type:</strong>{" "}
                          {scan.scan_type === "image" ? "📷 Image" : "✍️ Manual"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Date:</strong>{" "}
                          {new Date(scan.timestamp).toLocaleString()}
                        </p>
                      </div>

                      {scan.allergens_detected &&
                        scan.allergens_detected.length > 0 && (
                          <div
                            className="p-3 bg-white rounded"
                            data-testid={`allergens-detected-${idx}`}
                          >
                            <p className="text-sm font-semibold text-red-700 mb-1">
                              ⚠ Allergens Detected:
                            </p>
                            <p className="text-sm text-red-600">
                              {scan.allergens_detected
                                .map((a) => a.replace("_", " "))
                                .join(", ")}
                            </p>
                          </div>
                        )}

                      <div className="p-3 bg-white rounded">
                        <p className="text-sm font-semibold mb-1">
                          Ingredients:
                        </p>
                        <p className="text-sm text-gray-700">
                          {scan.ingredients.join(", ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
