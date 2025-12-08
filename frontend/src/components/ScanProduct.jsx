import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Camera, Upload, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

export default function ScanProduct({ user, onLogout }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  
  // Image scan state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Manual scan state
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleImageScan = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setScanning(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", selectedImage);

      const res = await axios.post(`${API}/scan/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setResult(res.data);
      toast.success("Scan complete!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleManualScan = async () => {
    if (!productName.trim() || !ingredients.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setScanning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/scan/manual`,
        { product_name: productName, ingredients },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      toast.success("Scan complete!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const getSeverityStyle = () => {
    if (!result) return {};
    switch (result.severity) {
      case "severe":
        return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600" };
      case "moderate":
        return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-600" };
      case "mild":
        return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "text-yellow-600" };
      default:
        return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-600" };
    }
  };

  const style = getSeverityStyle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#667eea' }}>AllergyAlert</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>Scan Product</h2>

        <Card className="mb-6" data-testid="scan-card">
          <CardContent className="pt-6">
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="image" data-testid="image-tab">
                  <Camera className="w-4 h-4 mr-2" /> Image Scan
                </TabsTrigger>
                <TabsTrigger value="manual" data-testid="manual-tab">
                  <FileText className="w-4 h-4 mr-2" /> Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" data-testid="image-scan-content">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded" data-testid="image-preview" />
                        <Button variant="outline" onClick={() => fileInputRef.current.click()} data-testid="change-image-button">
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-16 h-16 mx-auto text-gray-400" />
                        <p className="text-gray-600">Upload a photo of the food label</p>
                        <Button onClick={() => fileInputRef.current.click()} data-testid="upload-image-button">
                          Select Image
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      data-testid="image-file-input"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleImageScan}
                    disabled={!selectedImage || scanning}
                    data-testid="scan-image-button"
                  >
                    {scanning ? "Scanning..." : "Scan Image"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual" data-testid="manual-scan-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Name</label>
                    <Input
                      placeholder="e.g., Chocolate Bar"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      data-testid="product-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ingredients</label>
                    <Textarea
                      placeholder="Enter ingredients separated by commas or line breaks..."
                      rows={6}
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      data-testid="ingredients-input"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleManualScan}
                    disabled={scanning}
                    data-testid="scan-manual-button"
                  >
                    {scanning ? "Scanning..." : "Analyze Ingredients"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {result && (
          <Card className={`${style.border} border-2 ${style.bg}`} data-testid="scan-result-card">
            <CardHeader>
              <CardTitle className="flex items-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {result.safe ? (
                  <CheckCircle className={`w-6 h-6 mr-2 ${style.icon}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 mr-2 ${style.icon}`} />
                )}
                <span className={style.text}>
                  {result.safe ? "Safe to Consume" : `⚠ ${result.severity.toUpperCase()} Alert`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Product: {result.product_name}</h3>
                </div>

                {result.allergens_detected.length > 0 && (
                  <div className="p-4 bg-white rounded-lg" data-testid="allergens-detected">
                    <h4 className="font-semibold mb-2 text-red-700">⚠ Allergens Detected:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.allergens_detected.map((allergen, idx) => (
                        <li key={idx} className="text-red-600 capitalize" data-testid={`detected-allergen-${idx}`}>
                          {allergen.replace("_", " ")}
                          {result.details && result.details[allergen] && (
                            <span className="ml-2 text-sm">({result.details[allergen]} risk)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-semibold mb-2">Ingredients:</h4>
                  <p className="text-sm text-gray-700">{result.ingredients.join(", ")}</p>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={() => navigate("/history")} variant="outline" className="flex-1" data-testid="view-history-button">
                    View History
                  </Button>
                  <Button
                    onClick={() => {
                      setResult(null);
                      setSelectedImage(null);
                      setImagePreview(null);
                      setProductName("");
                      setIngredients("");
                    }}
                    className="flex-1"
                    data-testid="scan-another-button"
                  >
                    Scan Another
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}