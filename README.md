# ALLERGYALERT: Intelligent Food Allergy Detection using AI and Ingredient Analysis

## Project Overview
**ALLERGYALERT** is an AI-powered web application designed to help users detect potential allergens in packaged food items by analyzing their ingredient labels.  
By uploading an image of the food’s ingredient list, the system uses **Artificial Intelligence (AI)** and **Natural Language Processing (NLP)** to detect whether any ingredient could trigger an allergic reaction for a particular user.  

This system is especially useful for people suffering from food allergies such as **nut allergy**, **lactose intolerance**, **gluten sensitivity**, and **shellfish allergy**.

---

## Problem Definition
Food allergies are a serious global health concern — even small traces of allergens can lead to severe reactions or life-threatening anaphylaxis.  
Many packaged food items list ingredients in small or unclear text, and users might not recognize all chemical or alternative names of allergens (e.g., *casein = milk protein*, *albumin = egg-based compound*).

### Thus, people with allergies face major difficulties:
- Manually reading every food label  
- Not identifying hidden or alternative allergen names  
- Lack of personalized digital tools for allergy checking  

---

## Existing Methods & Their Issues

| **Existing Solution** | **Description** | **Limitations** |
|------------------------|----------------|-----------------|
| Manual label reading | Users read ingredients manually | Time-consuming, error-prone |
| Generic food scanner apps | OCR or barcode scanning for nutrition | Do not focus on allergens or personalization |
| Allergy databases | Contain lists of allergens | Not integrated with real-time image detection |
| Ingredient translators | Translate food labels | Don’t alert based on personal allergy data |

Hence, an **AI-based system** is needed that can understand ingredients intelligently and alert users based on their personal allergy profile.

---

## Proposed Methodology

1. **User Login / Registration**  
   Users create an account and set up their allergy profile (e.g., peanuts, dairy, gluten).

2. **Ingredient Image Upload**  
   Users upload an image of a food package ingredient label.

3. **AI & OCR Processing**  
   The system extracts text from the image using Optical Character Recognition (OCR).

4. **Ingredient Analysis**  
   The extracted ingredients are analyzed using AI/NLP models to identify allergens, including hidden or related chemical names.

5. **Alert Generation**  
   If any allergen matches the user’s allergy profile, an alert is displayed notifying potential risk.

6. **Dashboard & Reports**  
   Displays safe/unsafe food items history for the user.

---

## Tech Stack Used

### Frontend
- HTML5, CSS3, JavaScript  
- React.js / Express.js for interactive UI  
- Bootstrap / TailwindCSS for responsive design  

### Backend
- Python (Flask / FastAPI) or Node.js (Express) for server logic  
- AI/ML Model for ingredient classification and allergy detection  

### AI/ML & NLP Tools
- **Tesseract OCR** – for text extraction from food images  
- **spaCy / NLTK / Transformers (BERT)** – for ingredient name understanding and allergen matching  
- **Custom trained model** for allergen classification  

### Database
- **MongoDB** – for storing user profiles, allergy preferences, and history  

### Deployment
- **Render / Vercel / AWS / Heroku** (for frontend & backend)  
- **MongoDB Atlas** (for cloud database)

---

## System Architecture
```
[ User ] 
   ↓
[ Upload Ingredient Image ]
   ↓
[ OCR Text Extraction (Tesseract) ]
   ↓
[ AI/NLP Allergen Detection Model ]
   ↓
[ Database Lookup - User Allergens ]
   ↓
[ Generate Alert / Safe Confirmation ]
   ↓
[ Display Results on Dashboard ]
```

---

## Project Structure
```
ALLERGYALERT/
├── backend/
│   ├── app.py
│   ├── model/
│   │   ├── allergen_model.pkl
│   ├── routes/
│   │   ├── user.js
│   │   ├── detection.js
│   ├── database/
│       ├── mongo_connection.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   ├── public/
│       ├── img/
│       ├── index.html
│
├── README.md
└── requirements.txt
```

---

## How It Works

**1. Clone the repository**
```bash
git clone https://github.com/Dhanush1004/ALLERGYALERT.git
cd ALLERGYALERT
```

**2. Install dependencies**
```bash
npm install           # For frontend
pip install -r requirements.txt   # For backend
```

**3. Start backend**
```bash
python app.py
```

**4. Start frontend**
```bash
npm start
```

**5. Visit**
 [http://127.0.0.1:3000](http://127.0.0.1:3000)

---

## Expected Impact

- Reduces the risk of accidental allergen consumption  
- Saves time and ensures confidence in food choices  
- Provides accessibility for visually challenged users *(future goal: voice alerts)*  
- Encourages safer and smarter food consumption habits  

---

## Future Enhancements

- Barcode-based allergen scanning  
- Multi-language label recognition  
- Mobile app integration  
- Real-time cloud allergy database updates  
- AI chatbot for dietary suggestions  

---

## Developed By

**Dhanush A**  
*Final Year Student | Full Stack & AI Enthusiast*  
*Chennai, India*
