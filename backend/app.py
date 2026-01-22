import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import (
    load_pdf,
    ask_question,
    generate_quiz_from_pdf,
    quiz_cache,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins to avoid dev host/IP mismatches
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# MODELS
# ===============================
class Question(BaseModel):
    question: str

class QuizSubmit(BaseModel):
    answers: list[int]

# ===============================
# ROUTES
# ===============================
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        pdf_path = tmp.name

    load_pdf(pdf_path)
    return {"status": "PDF uploaded and indexed"}

@app.post("/ask")
async def ask(data: Question):
    return {"answer": ask_question(data.question)}

@app.get("/generate-quiz")
def generate_quiz():
    """
    Generate quiz with error handling
    """
    try:
        quiz = generate_quiz_from_pdf()
        if not quiz or len(quiz) == 0:
            return {
                "quiz": [],
                "error": "Could not generate quiz from PDF. The document may be too short or complex."
            }
        return {"quiz": quiz}
    except Exception as e:
        return {
            "quiz": [],
            "error": f"Quiz generation failed: {str(e)}"
        }

@app.post("/submit-quiz")
def submit_quiz(data: QuizSubmit):
    """
    Evaluate quiz answers and return score
    """
    import rag
    current_quiz = rag.quiz_cache
    
    print(f"\n{'='*50}")
    print(f"QUIZ SUBMISSION")
    print(f"{'='*50}")
    print(f"Quiz cache size: {len(current_quiz)}")
    print(f"User answers count: {len(data.answers)}")
    print(f"User answers: {data.answers}")
    
    if len(current_quiz) == 0:
        print("ERROR: Quiz cache is empty! Generate quiz after backend reload.")
        return {
            "score": 0,
            "total": 0,
            "quiz": [],
            "error": "Quiz cache is empty. Please generate a new quiz and submit again (backend was reloaded)."
        }
    
    score = 0

    for i, q in enumerate(current_quiz):
        if i < len(data.answers):
            user_answer = data.answers[i]
            correct_answer = q.get("answer", -1)
            is_correct = user_answer == correct_answer
            
            if is_correct:
                score += 1
                status = "✓ CORRECT"
            else:
                status = "✗ WRONG"
            
            print(f"Q{i+1}: {status} | User={user_answer} | Correct={correct_answer} | Question: {q.get('question', 'N/A')[:50]}")

    print(f"\nFinal Score: {score}/{len(current_quiz)} ({round(score/len(current_quiz)*100) if len(current_quiz) > 0 else 0}%)")
    print(f"{'='*50}\n")

    return {
        "score": score,
        "total": len(current_quiz),
        "quiz": current_quiz,
    }
