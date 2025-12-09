## Intelligent Food Allergy Detection using AI and Analysis (ALLERGYALERT)

## Project Overview
ALLERGYALERT is an AI-powered web application designed to help users detect potential allergens in packaged food items by analyzing their ingredient labels.  
By uploading an image of the food’s ingredient list, the system uses Artificial Intelligence (AI) and Natural Language Processing (NLP) to detect whether any ingredient could trigger an allergic reaction for a particular user.

This system is especially useful for individuals suffering from food allergies such as nut allergy, lactose intolerance, gluten sensitivity, and shellfish allergy.

---

## Problem Definition
Food allergies are a serious global health concern. Even small traces of allergens can lead to severe reactions or life-threatening anaphylaxis.  
Many packaged food items display ingredients in small or unclear text, and users might not recognize all chemical or alternative names of allergens (for example, casein means milk protein, albumin is egg-based).

People with allergies face major challenges:
- Manually reading and understanding every food label  
- Difficulty recognizing hidden or alternative allergen names  
- Lack of personalized digital tools for allergen detection  

---

## Existing Methods and Limitations

| Existing Solution | Description | Limitations |
|-------------------|-------------|-------------|
| Manual label reading | Users rely on reading text themselves | Error-prone, time-consuming |
| Generic food scanner apps | Scan for calories or nutrients | Do not detect allergens |
| Allergy databases | Lists common allergens | Not linked to personal data or real-time scanning |
| Ingredient translators | Translates text | Does not identify allergy risks |

A personalized, AI-driven allergen analyzer is therefore necessary.

---

## Proposed Methodology

1. **User Login and Allergy Setup**  
   Users create an account and select allergens such as peanuts, gluten, dairy, or eggs.

2. **Ingredient Image Upload**  
   Users upload a picture of a food package ingredient label.

3. **OCR Extraction**  
   The system extracts the text from the uploaded image using Optical Character Recognition (OCR).

4. **AI and NLP Based Ingredient Analysis**  
   Extracted ingredients are analyzed using AI/NLP models to identify allergens, including hidden or alternative names.

5. **Alert Generation**  
   If allergens match the user’s allergy profile, an alert is generated indicating potential risk.

6. **Dashboard and History**  
   Users can view previous scans, meal logs, and smart recommendations.

---

## Tech Stack Used

### Frontend
- React.js  
- TailwindCSS  
- JavaScript  
- Framer Motion  
- Custom Orb hover animation  
- Spotlight Card hover effects  

### Backend
- Python (FastAPI) or Node.js  
- JWT Authentication  
- REST API  

### AI/ML Tools
- Tesseract OCR  
- spaCy, NLTK, or Transformer models  
- Custom allergen classification  

### Database
- MongoDB Atlas  

### Deployment
- Vercel
- - MongoDB Atlas  

---

## System Architecture

```
[ User ]  
   ↓  
[ Upload Ingredient Image ]  
   ↓  
[ OCR Text Extraction (Tesseract) ]  
   ↓  
[ AI/NLP Allergen Detection ]  
   ↓  
[ Compare With User Allergy Profile ]  
   ↓  
[ Generate Safe / Unsafe Alert ]  
   ↓  
[ Dashboard and History ]  
```

---
## Screenshot of the Web

<img width="1919" height="937" alt="Screenshot 2025-12-09 114208" src="https://github.com/user-attachments/assets/7c362311-3278-45f0-9292-8d40d2a9a05d" />

<img width="1919" height="946" alt="Screenshot 2025-12-09 114218" src="https://github.com/user-attachments/assets/e1234659-c77c-46b9-9609-812e2d42543f" />

<img width="1919" height="932" alt="Screenshot 2025-12-08 151843" src="https://github.com/user-attachments/assets/fa00b70f-86b6-4a36-b365-17f7b2f5b1a6" />

<img width="1919" height="934" alt="Screenshot 2025-12-08 151855" src="https://github.com/user-attachments/assets/e12fcf5e-d30e-4ed2-a98e-9bea02683b31" />

<img width="1919" height="932" alt="Screenshot 2025-12-08 151908" src="https://github.com/user-attachments/assets/7d4ca924-9a8c-4109-9f3c-0018221a08ed" />

<img width="1919" height="930" alt="Screenshot 2025-12-08 151919" src="https://github.com/user-attachments/assets/7275153f-2d2b-492a-9fc1-481c0fea83f4" />

<img width="1918" height="927" alt="Screenshot 2025-12-08 151952" src="https://github.com/user-attachments/assets/25ea9d23-7c7d-4c66-a62d-d91b5de33c67" />

<img width="1872" height="931" alt="Screenshot 2025-12-08 151927" src="https://github.com/user-attachments/assets/052cbc1f-4f6f-4c1d-96e2-f2a124ff24a9" />

<img width="1919" height="930" alt="Screenshot 2025-12-08 151937" src="https://github.com/user-attachments/assets/4a367eca-45d3-46e9-9146-6a1e53779ce2" />

<img width="1918" height="934" alt="Screenshot 2025-12-08 151945" src="https://github.com/user-attachments/assets/8096d56f-578e-4346-8059-0771e5aff8cc" />



## Project Structure

```
ALLERGYALERT/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   ├── __pycache__/
│   └── venv/
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   ├── bgMotion.json
│   │   │   ├── logo.png
│   │   │
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScanProduct.jsx
│   │   │   ├── MealLogger.jsx
│   │   │   ├── SmartRecommendations.jsx
│   │   │   ├── History.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── PillNav.jsx
│   │   │   ├── Orb.jsx
│   │   │   ├── Orb.css
│   │   │   ├── SpotlightCard.jsx
│   │   │   ├── SpotlightCard.css
│   │   │
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── hooks/
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── jsconfig.json
│   ├── craco.config.js
│   ├── postcss.config.js
│   └── tailwind.config.js
│
├── README.md
└── .gitignore
```

---

## How to Run

**Before Running do this :**

**1.Update Gemini.Api Key**


### Frontend
```
cd frontend
npm install
npm start
```

### Backend
```
cd backend
pip install -r requirements.txt
python server.py
```

Visit:
```
http://localhost:3000
```

---

## Future Enhancements

- Barcode scanning  
- Mobile application  
- Multi-language label support  
- Voice-based alerts  
- Dietary recommendation engine  

---

## Developed By
Dhanush A  
Full Stack Developer and AI Enthusiast  
Chennai, India  


