import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import AllergyProfileSetup from "@/components/AllergyProfileSetup";
import ScanProduct from "@/components/ScanProduct";
import History from "@/components/History";
import { Toaster } from "@/components/ui/sonner";
import DailyMeals from "./components/DailyMeals";
import SmartRecommendations from "@/components/SmartRecommendations";
import Diary from "@/components/Diary";
import MealLogger from "@/components/MealLogger";


// Backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = process.env.REACT_APP_API_URL;

axios.defaults.baseURL = BACKEND_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
  if (token) {
    const userData = localStorage.getItem("user");
    try {
      if (userData && userData !== "undefined") {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUser(null);
      localStorage.removeItem("user"); // clear bad data
    }
  }
}, [token]);


  // Handle login/authentication
  const handleAuth = (authToken, userData) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Landing Page or Dashboard based on auth */}
          <Route
            path="/"
            element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage onAuth={handleAuth} />
              )
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              token ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Allergy Profile Setup */}
          <Route
            path="/profile-setup"
            element={
              token ? (
                <AllergyProfileSetup user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Scan Product */}
          <Route
            path="/scan"
            element={
              token ? (
                <ScanProduct user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* smart */}
          <Route
  path="/smart"
  element={
    token ? (
      <SmartRecommendations user={user} onLogout={handleLogout} />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>
{/* meals */}
<Route
  path="/meals"
  element={
    token ? (
      <DailyMeals user={user} onLogout={handleLogout} />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>
<Route
  path="/diary"
  element={
    token ? (
      <Diary user={user} onLogout={handleLogout} />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>
{/* daily log */}
<Route
  path="/meal-logger"
  element={token ? <MealLogger /> : <Navigate to="/" />}
/>



          {/* History */}
          <Route
            path="/history"
            element={
              token ? (
                <History user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/meals" element={<DailyMeals />} />

        </Routes>
      </BrowserRouter>

      {/* Toaster for notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
