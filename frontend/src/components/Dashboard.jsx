import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Scan, History, LogOut, Utensils, Lightbulb } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { motion } from "framer-motion";
import PillNav from "@/components/PillNav";
import logo from "@/assets/logo.png";
import Orb from "@/components/Orb";
import SpotlightCard from "@/components/SpotlightCard";


export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const cardsRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, historyRes] = await Promise.all([
        axios.get(`${API}/profile`, { headers }),
        axios.get(`${API}/history`, { headers }),
      ]);

      setProfile(profileRes.data);
      setRecentScans(historyRes.data.history.slice(0, 5));
    } catch (error) {
      toast.error("Failed to load dashboard");
    }
  };

  const scrollToCards = () => {
    cardsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-black">

      {/* ============== NAVIGATION ============== */}
      <PillNav
        logo={logo}
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Scan", href: "/scan" },
          { label: "Meals", href: "/meal-logger" },
          { label: "Smart AI", href: "/smart" },
          { label: "History", href: "/history" },
        ]}
        activeHref="/dashboard"
        baseColor="#ffffff"
        pillColor="#060010"
        hoveredPillTextColor="#060010"
        className="relative z-[999]"
      />

      {/* LOGOUT BUTTON */}
      <div className="fixed top-5 right-6 z-[9999]">
        <Button
          variant="outline"
          onClick={onLogout}
          className="bg-white/30 backdrop-blur-xl text-black border-white/40 hover:bg-white/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[100vh] w-full overflow-hidden bg-black">

        {/* ORB */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Orb
            hoverIntensity={0.8}
            rotateOnHover={true}
            hue={0.3}
            forceHoverState={false}
          />
        </div>

        {/* HERO TEXT */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4" 
        style={{ pointerEvents: "none" }} >

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl font-extrabold text-white drop-shadow-lg mb-4"
          >
            Stay Safe with Smart Allergy Tracking
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3 }}
            className="text-xl text-white/80 max-w-2xl mb-8"
          >
            Track allergens, scan food items, and get AI-powered recommendations easily.
          </motion.p>

          <motion.button
            onClick={scrollToCards}
            className="px-10 py-4 text-lg bg-white text-purple-700 rounded-2xl shadow-xl" style={{ pointerEvents: "auto" }} 
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Open Dashboard ↓
          </motion.button>

        </div>

        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-b from-transparent to-[#1a0024]"></div>

      </section>

      {/* ================= DASHBOARD SECTION ================= */}
      <section
        ref={cardsRef}
        className="min-h-screen w-full bg-gradient-to-b 
        from-[#1a0024] via-[#14001c] to-[#0a000f]
        pt-40 pb-24 px-6 transition-all duration-700 ease-out"
      >
        <h2 className="text-4xl font-extrabold text-center text-white mb-16">
          Your Dashboard
        </h2>

        {/* CARD GRID */}
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-6xl mx-auto"
  variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {[
    {
      title: "Allergy Profile",
      icon: <User className="w-12 h-12 text-white drop-shadow" />,
      subtitle: `${profile?.allergens?.length || 0} Allergens`,
      onClick: () => navigate("/profile-setup"),
    },
    {
      title: "Scan Product",
      icon: <Scan className="w-12 h-12 text-white drop-shadow" />,
      subtitle: "Scan items safely",
      onClick: () => navigate("/scan"),
    },
    {
      title: "Scan History",
      icon: <History className="w-12 h-12 text-white drop-shadow" />,
      subtitle: `${recentScans.length} Recent scans`,
      onClick: () => navigate("/history"),
    },
    {
      title: "Log Meals",
      icon: <Utensils className="w-12 h-12 text-white drop-shadow" />,
      subtitle: "Track meals & reactions",
      onClick: () => navigate("/meal-logger"),
    },
    {
      title: "Smart Recommendations",
      icon: <Lightbulb className="w-12 h-12 text-white drop-shadow" />,
      subtitle: "AI food suggestions",
      onClick: () => navigate("/smart"),
    },
  ].map((card, index) => (
    <motion.div
      key={index}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: "0 15px 40px rgba(0,0,0,0.35)",
      }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      className="relative rounded-3xl p-[2px] bg-gradient-to-br from-[#948e99] to-[#2e1437] animate-borderGlow cursor-pointer"
      onClick={card.onClick}
    >
      {/* CLEAN WRAPPER – NO COLOR CHANGE */}
      <SpotlightCard className="rounded-3xl">
        <div className="solidCard rounded-3xl p-8 flex flex-col justify-center items-center text-center">
          <div className="mb-4">{card.icon}</div>
          <h3 className="text-xl font-semibold text-white">{card.title}</h3>
          <p className="text-white/80 text-sm mt-1">{card.subtitle}</p>
        </div>
      </SpotlightCard>
    </motion.div>
  ))}
</motion.div>

      </section>
    </div>
  );
}
