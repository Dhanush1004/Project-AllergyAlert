from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any

from datetime import datetime, timezone, timedelta
from pathlib import Path
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.responses import JSONResponse

import os
import uuid
import asyncio
import logging
import base64
import re
from datetime import datetime

from PIL import Image
from io import BytesIO
import google.generativeai as genai

# -------------------------------------------------------
# LOAD ENV
# -------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "secret")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

if not MONGO_URL or not DB_NAME:
    raise RuntimeError("MONGO_URL or DB_NAME not set in .env")

# -------------------------------------------------------
# DATABASE
# -------------------------------------------------------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# -------------------------------------------------------
# SECURITY
# -------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
security = HTTPBearer()


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict):
    expiry = datetime.now(timezone.utc) + timedelta(days=7)
    data = data.copy()
    data.update({"exp": expiry})
    return jwt.encode(data, JWT_SECRET, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# -------------------------------------------------------
# MODELS
# -------------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AllergyProfile(BaseModel):
    user_id: str
    allergens: List[str] = []
    custom_allergens: List[str] = []
    severity_levels: Dict[str, str] = {}
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AllergyProfileUpdate(BaseModel):
    allergens: List[str]
    custom_allergens: Optional[List[str]] = []
    severity_levels: Optional[Dict[str, str]] = {}


class ScannedProduct(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_name: str
    ingredients: List[str]
    allergens_detected: List[str]
    severity: str
    safe: bool
    scan_type: str  # "image" | "manual"
    notes: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ManualScanRequest(BaseModel):
    product_name: str
    ingredients: str


class FoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    food: str
    severity: str = "none"  # "none" | "mild" | "high"
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# NEW: Health diary to support smart analysis
class HealthDiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symptoms: str
    severity: str = "none"  # "none" | "mild" | "high"
    notes: str = ""
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# daily log
class MealLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    meal: str
    allergy_level: str
    date: str
    time: str

# -------------------------------------------------------
# ALLERGEN DATABASE
# -------------------------------------------------------
COMMON_ALLERGENS = {
    "peanuts": {"keywords": ["peanut", "groundnut"], "severity": "high"},
    "tree_nuts": {"keywords": ["almond", "cashew", "walnut"], "severity": "high"},
    "dairy": {"keywords": ["milk", "cheese", "butter", "ghee"], "severity": "medium"},
    "eggs": {"keywords": ["egg", "albumin"], "severity": "medium"},
    "soy": {"keywords": ["soy", "soya"], "severity": "medium"},
    "wheat": {"keywords": ["wheat", "gluten", "maida"], "severity": "medium"},
    "fish": {"keywords": ["fish", "salmon"], "severity": "high"},
    "shellfish": {"keywords": ["shrimp", "prawn", "crab"], "severity": "high"},
    "sesame": {"keywords": ["sesame", "tahini", "til"], "severity": "medium"},
}

# -------------------------------------------------------
# HELPERS
# -------------------------------------------------------
def parse_ingredients(text: str) -> List[str]:
    if not text:
        return []
    items = re.split(r"[,\n;:]+", text)
    return [i.strip() for i in items if i.strip()]


def detect_allergens(ingredients: List[str], allergens: List[str], custom_allergens: List[str]):
    detected = []
    severity_map: Dict[str, str] = {}

    # Standard allergens
    for allergen in allergens:
        if allergen in COMMON_ALLERGENS:
            keywords = COMMON_ALLERGENS[allergen]["keywords"]
            for ingredient in ingredients:
                ing_lower = ingredient.lower()
                if any(k in ing_lower for k in keywords):
                    if allergen not in detected:
                        detected.append(allergen)
                    severity_map[allergen] = COMMON_ALLERGENS[allergen]["severity"]

    # Custom allergens
    for custom in custom_allergens or []:
        for ing in ingredients:
            if custom.lower() in ing.lower():
                if custom not in detected:
                    detected.append(custom)
                severity_map[custom] = "medium"

    if not detected:
        return {"detected": [], "severity": "safe", "safe": True, "details": {}}

    severities = list(severity_map.values())
    level = (
        "severe"
        if "high" in severities
        else "moderate"
        if "medium" in severities
        else "mild"
    )

    return {"detected": detected, "severity": level, "safe": False, "details": severity_map}


async def analyze_with_gemini(img_base64: str) -> str:
    if not GEMINI_KEY:
        logging.warning("GEMINI_API_KEY not set, skipping image analysis")
        return ""

    try:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash-exp")

        result = model.generate_content(
            [
                "Extract product name and ingredient list from this image. "
                "Reply ONLY with product name and ingredients, comma-separated:",
                {"mime_type": "image/png", "data": base64.b64decode(img_base64)},
            ]
        )
        return result.text or ""
    except Exception as e:
        logging.error(f"Gemini error: {e}")
        return ""


# ------------- "ML-style" Risk & Recommendation Helpers -------------
def predict_allergy_risk(trends: Dict[str, Dict[str, int]], recent_diary: List[dict]) -> Dict[str, Any]:
    """
    Simple rule-based risk score (0-100) that behaves like a small ML model.
    You can replace this logic later with a real trained model.
    """
    score = 0

    # Factor 1: count of foods with high reactions
    for food, levels in trends.items():
        high = levels.get("high", 0)
        mild = levels.get("mild", 0)
        score += high * 15
        score += mild * 5

    # Factor 2: recent diary high/mild symptoms
    for d in recent_diary:
        sev = d.get("severity", "none")
        if sev == "high":
            score += 10
        elif sev == "mild":
            score += 4

    # Cap score
    score = min(score, 100)

    # Risk level
    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"

    return {"overall_risk_score": score, "risk_level": level}


def generate_meal_recommendations(profile: Dict[str, Any], risky_foods: List[str]) -> List[Dict[str, Any]]:
    """
    Very simple meal recommendation engine:
    - Avoids user allergens + risky foods
    - Suggests some 'generic' safe meals
    """
    user_allergens = (profile or {}).get("allergens", []) + (profile or {}).get(
        "custom_allergens", []
    )

    avoid_set = set([a.lower() for a in user_allergens + risky_foods])

    # A few hard-coded sample meals (you will customize later)
    base_meals = [
        {
            "name": "Grilled chicken with rice & veggies",
            "ingredients": ["chicken", "rice", "carrot", "beans"],
        },
        {
            "name": "Veggie bowl (no nuts, no dairy)",
            "ingredients": ["rice", "chickpeas", "cucumber", "tomato"],
        },
        {
            "name": "Idli with chutney (no peanut chutney)",
            "ingredients": ["rice", "urad dal", "coconut"],
        },
        {
            "name": "Plain dosa with sambar",
            "ingredients": ["rice", "urad dal", "vegetables"],
        },
    ]

    safe_meals = []
    for meal in base_meals:
        meal_str = " ".join(meal["ingredients"]).lower()
        if not any(a in meal_str for a in avoid_set):
            safe_meals.append(
                {
                    "name": meal["name"],
                    "ingredients": meal["ingredients"],
                    "estimated_allergy_level": "low",
                }
            )

    return safe_meals


# -------------------------------------------------------
# ROUTER SETUP
# -------------------------------------------------------
api = APIRouter(prefix="/api")

# ------------------ ALLERGENS: COMMON LIST ------------------
@api.get("/allergens/common")
async def get_common_allergens():
    return {
        "allergens": list(COMMON_ALLERGENS.keys()),
        "details": COMMON_ALLERGENS,
    }

# ------------------ AUTH ------------------
@api.post("/auth/register")
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    new_user = User(
        email=user.email,
        name=user.name
    ).model_dump()

    # Hash password
    new_user["password"] = hash_password(user.password)

    # Insert
    await db.users.insert_one(new_user)

    # Remove sensitive fields before returning
    new_user.pop("password", None)
    new_user.pop("_id", None)

    token = create_access_token({"sub": new_user["id"]})

    return {
        "success": True,
        "token": token,
        "user": new_user
    }

# ------------------ AUTH ------------------
@api.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": user["id"]})

    # Remove MongoDB internal fields
    user.pop("_id", None)
    user.pop("password", None)

    return {"success": True, "token": token, "user": user}


# daily log
from fastapi.responses import JSONResponse

@api.post("/meals/log")
async def add_meal_log(req: dict, user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)

    # CLEAN STRUCTURE TO RETURN
    safe_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "meal": req.get("meal", "").strip(),
        "allergy_level": req.get("allergy_level", "none"),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M"),
        "created_at": now.isoformat()
    }

    # IMPORTANT: Clone before inserting
    db_entry = safe_entry.copy()

    # THIS dict will get mutated — safe_entry will NOT
    await db.meal_logs.insert_one(db_entry)

    # Return only clean JSON (without _id)
    return JSONResponse({
        "message": "Meal logged",
        "entry": safe_entry
    })


# daily log
@api.get("/meals/logs")
async def get_meals(user_id: str = Depends(get_current_user)):
    records = await db.meal_logs.find({"user_id": user_id}).to_list(200)

    for r in records:
        r["_id"] = str(r["_id"])  # CONVERT instead of pop

    return JSONResponse({"logs": records})


# ------------------ PROFILE ------------------
@api.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    profile = await db.allergy_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        new = AllergyProfile(user_id=user_id)
        await db.allergy_profiles.insert_one(new.model_dump())
        return new
    return profile


@api.put("/profile")
async def update_profile(data: AllergyProfileUpdate, user_id: str = Depends(get_current_user)):
    update = data.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.allergy_profiles.update_one(
        {"user_id": user_id},
        {"$set": update},
        upsert=True,
    )

    return {"message": "Profile updated", "profile": update}


# ------------------ SCAN: IMAGE ------------------
@api.post("/scan/image")
async def scan_image(image: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    content = await image.read()
    img = Image.open(BytesIO(content))

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()

    profile = await db.allergy_profiles.find_one({"user_id": user_id})
    analysis = await analyze_with_gemini(img_base64)

    ingredients = parse_ingredients(analysis)
    result = detect_allergens(ingredients, profile["allergens"], profile["custom_allergens"])

    scan = ScannedProduct(
        user_id=user_id,
        product_name="Unknown",  # You can parse product name later from Gemini text
        ingredients=ingredients,
        allergens_detected=result["detected"],
        severity=result["severity"],
        safe=result["safe"],
        scan_type="image",
        notes=analysis,
    )

    data = scan.model_dump()
    data["timestamp"] = data["timestamp"].isoformat()
    await db.scanned_products.insert_one(data)

    return data


# ------------------ SCAN: MANUAL ------------------
@api.post("/scan/manual")
async def scan_manual(req: ManualScanRequest, user_id: str = Depends(get_current_user)):
    profile = await db.allergy_profiles.find_one({"user_id": user_id})
    ingredients = parse_ingredients(req.ingredients)
    result = detect_allergens(ingredients, profile["allergens"], profile["custom_allergens"])

    scan = ScannedProduct(
        user_id=user_id,
        product_name=req.product_name,
        ingredients=ingredients,
        allergens_detected=result["detected"],
        severity=result["severity"],
        safe=result["safe"],
        scan_type="manual",
    )

    data = scan.model_dump()
    data["timestamp"] = data["timestamp"].isoformat()
    await db.scanned_products.insert_one(data)

    return data


# ------------------ HISTORY ------------------
@api.get("/history")
async def history(user_id: str = Depends(get_current_user)):
    items = (
        await db.scanned_products.find({"user_id": user_id}, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(100)
    )
    return {"history": items}


# ------------------ FOOD TRACKER ------------------
@api.post("/foodtracker")
async def add_food(req: dict, user_id: str = Depends(get_current_user)):
    food = req.get("food", "").strip()
    severity = req.get("severity", "none").lower()

    if not food:
        raise HTTPException(400, "Food cannot be empty")

    if severity not in ["none", "mild", "high"]:
        raise HTTPException(400, "Invalid severity")

    entry = FoodEntry(user_id=user_id, food=food, severity=severity)
    data = entry.model_dump()
    data["date"] = data["date"].isoformat()

    await db.food_tracker.insert_one(data)

    # Keep only last 2 days (you can tune this)
    cutoff = datetime.now(timezone.utc) - timedelta(days=2)
    await db.food_tracker.delete_many(
        {"user_id": user_id, "date": {"$lt": cutoff.isoformat()}}
    )

    return {"message": "Added", "food": data}


@api.get("/foodtracker/trends")
async def get_trends(user_id: str = Depends(get_current_user)):
    records = await db.food_tracker.find({"user_id": user_id}).to_list(200)

    if not records:
        return {"trends": {}, "risky_foods": []}

    trends: Dict[str, Dict[str, int]] = {}

    for r in records:
        food = r["food"].lower()
        level = r.get("severity", "none")

        if food not in trends:
            trends[food] = {"none": 0, "mild": 0, "high": 0}

        if level not in trends[food]:
            trends[food][level] = 0

        trends[food][level] += 1

    risky = [food for food, s in trends.items() if s.get("high", 0) > 0 or s.get("mild", 0) > 2]

    return {"trends": trends, "risky_foods": risky}


@api.put("/foodtracker/update")
async def update_food(req: dict, user_id: str = Depends(get_current_user)):
    food = req.get("food", "").strip()
    level = req.get("allergyLevel", "").lower()

    if not food:
        raise HTTPException(400, "Food is required")

    if level not in ["none", "mild", "high"]:
        raise HTTPException(400, "Invalid level")

    res = await db.food_tracker.update_one(
        {"user_id": user_id, "food": food},
        {"$set": {"severity": level, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    if res.modified_count == 0:
        raise HTTPException(404, "Food not found")

    return {"message": "Updated"}


# ------------------ HEALTH DIARY (NEW) ------------------
@api.post("/diary")
async def add_diary_entry(req: dict, user_id: str = Depends(get_current_user)):
    symptoms = req.get("symptoms", "").strip()
    severity = req.get("severity", "none").lower()
    notes = req.get("notes", "").strip()

    if not symptoms:
        raise HTTPException(400, "Symptoms cannot be empty")

    if severity not in ["none", "mild", "high"]:
        raise HTTPException(400, "Invalid severity")

    entry = HealthDiaryEntry(user_id=user_id, symptoms=symptoms, severity=severity, notes=notes)
    data = entry.model_dump()
    data["date"] = data["date"].isoformat()

    await db.health_diary.insert_one(data)
    return {"message": "Diary added", "entry": data}


@api.get("/diary/recent")
async def get_recent_diary(user_id: str = Depends(get_current_user)):
    entries = (
        await db.health_diary.find({"user_id": user_id}, {"_id": 0})
        .sort("date", -1)
        .to_list(30)
    )
    return {"entries": entries}


# ------------------ SMART RECOMMENDATIONS (NEW) ------------------
@api.get("/smart/recommendations")
async def smart_recommendations(user_id: str = Depends(get_current_user)):
    profile = await db.allergy_profiles.find_one({"user_id": user_id}, {"_id": 0})
    # Trends & risky foods
    records = await db.food_tracker.find({"user_id": user_id}).to_list(200)

    trends: Dict[str, Dict[str, int]] = {}
    for r in records:
        food = r["food"].lower()
        level = r.get("severity", "none")

        if food not in trends:
            trends[food] = {"none": 0, "mild": 0, "high": 0}
        if level not in trends[food]:
            trends[food][level] = 0
        trends[food][level] += 1

    risky_foods = [f for f, s in trends.items() if s.get("high", 0) > 0 or s.get("mild", 0) > 2]

    # recent diary
    recent_diary = (
        await db.health_diary.find({"user_id": user_id}, {"_id": 0})
        .sort("date", -1)
        .to_list(10)
    )

    risk_info = predict_allergy_risk(trends, recent_diary)
    meals = generate_meal_recommendations(profile, risky_foods)

    tips = []
    if risk_info["risk_level"] == "high":
        tips.append("Avoid all risky foods and consult your doctor if symptoms appear.")
        tips.append("Carry your emergency medication or epipen if prescribed.")
    elif risk_info["risk_level"] == "medium":
        tips.append("Be cautious with foods that previously caused mild reactions.")
        tips.append("Track symptoms in diary after trying new foods.")
    else:
        tips.append("Keep tracking your meals and symptoms to maintain low risk.")
        tips.append("Introduce new foods slowly and monitor any reactions.")

    return {
        "overall_risk_score": risk_info["overall_risk_score"],
        "risk_level": risk_info["risk_level"],
        "risky_foods": risky_foods,
        "recommended_meals": meals,
        "recent_diary": recent_diary,
        "tips": tips,
    }


# ------------------ DASHBOARD / GRAPH DATA (NEW) ------------------
@api.get("/dashboard/overview")
async def dashboard_overview(user_id: str = Depends(get_current_user)):
    """
    This endpoint returns all data needed for a front-end dashboard:
    - daily counts by severity (for line/bar chart)
    - top risky foods
    - scan history summary
    """
    # Food tracker last 30 days
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    records = await db.food_tracker.find(
        {"user_id": user_id, "date": {"$gte": cutoff.isoformat()}}
    ).to_list(500)

    # Group by date + severity
    daily_stats: Dict[str, Dict[str, int]] = {}
    for r in records:
        date_str = r["date"][:10]  # YYYY-MM-DD
        sev = r.get("severity", "none")
        if date_str not in daily_stats:
            daily_stats[date_str] = {"none": 0, "mild": 0, "high": 0}
        if sev not in daily_stats[date_str]:
            daily_stats[date_str][sev] = 0
        daily_stats[date_str][sev] += 1

    # Reuse trends logic to compute risky foods
    trends: Dict[str, Dict[str, int]] = {}
    for r in records:
        food = r["food"].lower()
        level = r.get("severity", "none")
        if food not in trends:
            trends[food] = {"none": 0, "mild": 0, "high": 0}
        if level not in trends[food]:
            trends[food][level] = 0
        trends[food][level] += 1

    risky_foods = [
        {"food": f, "counts": s}
        for f, s in trends.items()
        if s.get("high", 0) > 0 or s.get("mild", 0) > 2
    ]

    # Last 10 scans for recent activity widget
    scans = (
        await db.scanned_products.find({"user_id": user_id}, {"_id": 0})
        .sort("timestamp", -1)
        .to_list(10)
    )

    return {
        "daily_stats": daily_stats,
        "risky_foods": risky_foods,
        "recent_scans": scans,
    }


# -------------------------------------------------------
# APP INSTANCE
# -------------------------------------------------------
app = FastAPI(title="AllergyAlert API", version="2.0")

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def home():
    return {"status": "running", "docs": "/docs"}


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


logging.basicConfig(level=logging.INFO)
