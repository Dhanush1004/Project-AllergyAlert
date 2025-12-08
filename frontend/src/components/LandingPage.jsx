import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import FloatingLines from "./FloatingLines";
import "./FloatingLines.css";
import mockup from "@/assets/mockup.png";
import TextType from './TextType';
import panda from "@/assets/panda.png";
import logo from "@/assets/logo.png";


export default function LandingPage({ onAuth }) {
  const navigate = useNavigate();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  /* INTRO ANIMATION */
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  /* SCROLL FADE FOR BACKGROUND */
  const [fadeBG, setFadeBG] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setFadeBG(window.scrollY > 250); 
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* REGISTER */
  const handleRegister = async () => {
    if (!email || !password || !name) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/register`, {
        email,
        password,
        name,
      });

      toast.success("Welcome to AllergyAlert!");
      onAuth(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* LOGIN */
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      if (res.data.success) {
        toast.success("Welcome back!");
        onAuth(res.data.token, res.data.user);
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Login failed");
    }
  };

  /* ========== AUTH SCREEN ========== */
  if (showAuth) {
    return (
      <div className="w-screen h-screen relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 -z-10">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={[10, 15, 20]}
            lineDistance={[8, 6, 4]}
            interactive
            parallax
            bendRadius={5.0}
            bendStrength={-0.5}
            mixBlendMode="normal"
            linesGradient={["#7B2FF7", "#F107A3", "#00E5FF"]}
          />
        </div>

        <button
          onClick={() => setShowAuth(false)}
          className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 transition"
        >
          ← Back
        </button>

        <Card className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-center font-bold">
              AllergyAlert
            </CardTitle>
            <CardDescription className="text-center">
              Your personal food safety companion
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={authMode} onValueChange={setAuthMode}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="space-y-4">
                  <Input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleLogin}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <div className="space-y-4">
                  <Input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleRegister}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ========== INTRO ANIMATION ========== */
  if (!showAuth && showIntro) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <img src={logo} className="w-40 animate-introLogo" />
      </div>
    );
  }

  /* ========== MAIN LANDING PAGE ========== */
  return (
    <div className="w-screen min-h-screen relative overflow-hidden">


      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#111] text-white px-8 py-4 flex items-center justify-between border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-md"></div>
          <span className="text-lg font-semibold tracking-wide">My Intelligent</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-5 py-2 rounded-full text-sm bg-[#1f1f1f] border border-[#333] hover:bg-[#2a2a2a] transition">
            About Us
          </button>

          <button
            className="px-5 py-2 rounded-full text-sm bg-white text-black font-medium hover:bg-gray-200 transition"
            onClick={() => {
              setAuthMode("register");
              setShowAuth(true);
            }}
          >
            Register
          </button>

          <button
            className="px-5 py-2 rounded-full text-sm bg-[#d9ff67] text-black font-semibold"
            onClick={() => {
              setAuthMode("login");
              setShowAuth(true);
            }}
          >
            Login
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
<section className="relative container mx-auto px-6 pt-40 pb-32 z-20">

  {/* FloatingLines inside only the hero */}
  <div 
    className={`
      absolute inset-0 -z-10 
      transition-opacity duration-700
      ${fadeBG ? "opacity-0" : "opacity-100"}
    `}
  >
    <FloatingLines
      enabledWaves={["top", "middle", "bottom"]}
      lineCount={[10, 15, 20]}
      lineDistance={[8, 6, 4]}
      interactive
      parallax
      bendRadius={5.0}
      bendStrength={-0.5}
      mixBlendMode="normal"
      linesGradient={["#498d97ff", "#837063ff", "#0b1fffff"]}
      brightness={0.5}
    />
  </div>

  {/* GRID CONTENT */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

    <div>
      <h1 className="text-white font-extrabold text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight">
        <div className="min-h-[220px] md:min-h-[280px] lg:min-h-[330px]">
          <TextType
            text={`Know What’s\nInside Before\nIt’s Too Late.`}
            typingSpeed={65}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
            loop={false}
          />
        </div>
      </h1>

      <p className="text-white/80 text-xl mt-8 max-w-lg">
        Empowering Safe Eating Through AI.<br />
        Instant allergen detection with one effortless scan.
      </p>

      <div className="mt-10 flex items-center gap-4">
        <button className="px-8 py-4 bg-white text-black text-lg rounded-full font-semibold shadow-md hover:shadow-lg transition">
          Explore
        </button>

        <button className="px-8 py-4 border border-white/50 text-white text-lg rounded-full font-medium hover:bg-white/10 transition">
          Learn More
        </button>
      </div>
    </div>

    <div className="flex justify-center lg:justify-end">
      <img
        src={panda}
        className="w-[350px] lg:w-[420px] animate-floating"
      />
    </div>

  </div>

</section>


{/* PAGE 2 — NEON FUTURE STYLE */}
<section
  className={`  
    w-full min-h-screen 
    transition-all duration-700 
    ${fadeBG ? "bg-gradient-to-b from-[#0b1fffff]/90 to-[#498d97ff]/90" : "bg-transparent"}
    rounded-t-[60px]
    pt-32 pb-32
  `}
>
  <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

    {/* TEXT BLOCK */}
    <div className="opacity-0 animate-fadeUpSlow">
      <h2 className="text-white font-extrabold text-5xl md:text-6xl leading-tight drop-shadow-lg">
        Smart Allergy Detection
      </h2>

      <p className="text-white/80 text-xl mt-6 max-w-xl leading-relaxed">
        Scan any product and instantly detect food allergens using
        real-time AI severity ratings and ingredient analysis.
      </p>

      <button className="mt-10 px-10 py-4 bg-white text-black rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover:bg-gray-100 transition">
        Learn More →
      </button>
    </div>

    {/* RIGHT IMAGE */}
    <div className="flex justify-center lg:justify-end opacity-0 animate-fadeUpSlowDelay">
      <img
        src={mockup}
        className="w-[300px] md:w-[360px] drop-shadow-[0_0_30px_rgba(0,200,255,0.6)]"
        alt="Allergy Detection Mockup"
      />
    </div>

  </div>
</section>

    </div>
  );
}
