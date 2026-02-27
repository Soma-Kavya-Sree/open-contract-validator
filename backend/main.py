from fastapi import FastAPI, UploadFile, File
from pypdf import PdfReader
import re
from transformers import pipeline

app = FastAPI()

classifier = pipeline("sentiment-analysis")

@app.get("/")
def home():
    return {"message": "AI Backend Running"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    reader = PdfReader(file.file)
    text = ""

    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text() + "\n"

    clauses = re.split(r'\n\s*\d+\.\s', text)
    clauses = [c.strip() for c in clauses if len(c.strip()) > 120]

    analysis_results = []
    high = 0
    medium = 0
    low = 0

    for clause in clauses:
        try:
            result = classifier(clause[:512])[0]
            score = result["score"]

            if score > 0.85:
                risk = "High"
                high += 1
            elif score > 0.65:
                risk = "Medium"
                medium += 1
            else:
                risk = "Low"
                low += 1

            bias = "Employer Favoring" if "shall" in clause.lower() else "Neutral"

            analysis_results.append({
                "clause_preview": clause[:300],
                "risk_level": risk,
                "bias_direction": bias,
                "explanation": f"AI probability score: {round(score,2)}",
                "suggested_rewrite": "Revise this clause to ensure balanced obligations and proportional liability."
            })

        except:
            continue

    total_clauses = len(analysis_results)

    weighted_score = high*20 + medium*10 + low*5
    overall_risk_score_percent = min(
        int((weighted_score / (total_clauses * 20)) * 100),
        100
    ) if total_clauses else 0

    return {
        "total_clauses": total_clauses,
        "high_risk_count": high,
        "medium_risk_count": medium,
        "low_risk_count": low,
        "overall_risk_score_percent": overall_risk_score_percent,
        "analysis_results": analysis_results
    }