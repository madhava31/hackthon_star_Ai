import os
import json
from typing import List
import re
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import (
    HuggingFaceEmbeddings,
    HuggingFaceEndpoint,
)
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage

# =====================================================
# ENVIRONMENT
# =====================================================
load_dotenv()
api_key = os.getenv("HUGGINGFACE_TOKEN_API")
if not api_key:
    raise ValueError("HUGGINGFACE_TOKEN_API missing")

# =====================================================
# GLOBAL STATE (DEMO / SINGLE USER)
# =====================================================
conversation_history = []
retriever = None
chain = None
quiz_cache: List[dict] = []
doc_text: List[str] = []

# =====================================================
# RAG SETUP
# =====================================================
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

chat_prompt = PromptTemplate(
    template="""
Answer ONLY using the context below.
If the answer is not present, say "I don't know."

Context:
{context}

Conversation History:
{history}

Question:
{question}
""",
    input_variables=["context", "history", "question"],
)

llm = HuggingFaceEndpoint(
    repo_id="google/gemma-2-2b-it",
    task="text-generation",
    huggingfacehub_api_token=api_key,
    temperature=0.3,
    max_new_tokens=512,
)

parser = StrOutputParser()

# =====================================================
# PDF LOADING
# =====================================================
def load_pdf(file_path: str):
    """
    Load PDF, build FAISS index, reset state
    """
    global retriever, chain, conversation_history, quiz_cache, doc_text

    conversation_history = []
    quiz_cache = []
    doc_text = []

    docs = PyPDFLoader(file_path).load()
    chunks = splitter.split_documents(docs)

    # Store plain text for fallback quiz generation
    doc_text = [c.page_content for c in chunks]

    vectorstore = FAISS.from_documents(chunks, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 6})

    def format_history():
        return "\n".join(
            f"Q: {h['q']} | A: {h['a']}"
            for h in conversation_history
        )

    def retrieve_context(question: str):
        docs = retriever.invoke(question)
        return "\n\n".join(d.page_content for d in docs)

    def run_chain(question: str):
        prompt_text = chat_prompt.format(
            context=retrieve_context(question),
            history=format_history(),
            question=question,
        )
        return parser.invoke(llm.invoke(prompt_text))

    chain = run_chain
    return "PDF loaded successfully"

# =====================================================
# CHAT
# =====================================================
def _fallback_answer(question: str):
    """
    Fallback Q&A using document retrieval without LLM.
    Finds relevant passages from the document.
    """
    global retriever, doc_text
    
    if retriever is None or not doc_text:
        return "No document loaded. Please upload a PDF first."
    
    try:
        # Retrieve relevant chunks
        docs = retriever.invoke(question)
        
        if not docs:
            return "I couldn't find relevant information in the document to answer your question."
        
        # Combine top chunks as answer
        answer_parts = []
        for i, doc in enumerate(docs[:3]):  # Use top 3 chunks
            content = doc.page_content.strip()
            if content:
                answer_parts.append(content)
        
        if answer_parts:
            answer = "\n\n".join(answer_parts)
            # Limit answer length
            if len(answer) > 500:
                answer = answer[:500] + "..."
            return answer
        else:
            return "I found relevant passages but they appear to be empty. Please try another question."
    
    except Exception as e:
        return f"Error retrieving document: {str(e)}"

def ask_question(question: str):
    global conversation_history
    
    if chain is None and retriever is None:
        return "Upload PDF first"
    
    try:
        # Try using the LLM chain first
        if chain is not None:
            answer = chain(question)
        else:
            # Fallback to document retrieval
            answer = _fallback_answer(question)
    except Exception as e:
        import traceback
        print("[ASK ERROR]" , repr(e))
        traceback.print_exc()
        # Use fallback when LLM fails
        print("[USING FALLBACK]Attempting fallback answer...")
        answer = _fallback_answer(question)

    conversation_history.append({"q": question, "a": answer})
    return answer

# =====================================================
# QUIZ GENERATION (10 QUESTIONS, RETRY SAFE)
# =====================================================
def _clean_json(text: str) -> str:
    """
    Remove markdown fences and other noise, extract JSON array
    """
    text = text.strip()
    # Remove markdown fences
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "")
    
    # Find JSON array start and end
    start = text.find('[')
    end = text.rfind(']')
    
    if start != -1 and end != -1:
        text = text[start:end+1]
    
    return text.strip()

def _fallback_quiz_from_text(num_questions: int = 10):
    """Generate realistic MCQ from document with actual options (not True/False)."""
    global quiz_cache, doc_text
    import random

    if not doc_text:
        return []

    # Join all text
    text_blob = " ".join(doc_text)
    
    # Split into sentences
    raw_sentences = re.split(r"(?<=[.!?])\s+", text_blob)
    sentences = []
    for s in raw_sentences:
        s_clean = s.strip()
        if len(s_clean) < 40:  # Need longer sentences to extract good questions
            continue
        sentences.append(s_clean)

    if len(sentences) < num_questions:
        return []

    topics = ["Definitions", "Facts", "Concepts", "Data", "Examples", "Methods", "General", "Theory", "Application", "Summary"]
    quiz = []
    
    for idx in range(num_questions):
        if idx >= len(sentences):
            break
            
        sentence = sentences[idx]
        topic = topics[idx % len(topics)]
        
        # Extract key phrase from sentence for question
        words = sentence.split()
        if len(words) > 15:
            # Take first part as question context
            question_start = " ".join(words[:10])
            question = f"According to the document, which statement best completes: \"{question_start}...\"?"
        else:
            question = f"Which of the following is TRUE based on this statement from the document?\n\n\"{sentence}\""
        
        # Generate realistic options - variations of actual content
        option_words = sentence.split()
        
        # Option 1: Extract key noun/phrase (this will be the correct answer)
        if len(option_words) >= 5:
            # Try to extract meaningful phrase
            correct_option = " ".join(option_words[3:8]) if len(option_words) >= 8 else sentence[:50]
        else:
            correct_option = sentence[:50]
        
        correct_option = correct_option.strip(". ,")[:60]
        
        # Generate 3 plausible wrong answers based on similar patterns
        wrong_options = []
        
        # Wrong option 1: Related but different concept from other sentences
        if idx + 1 < len(sentences):
            alt_words = sentences[idx + 1].split()
            if len(alt_words) >= 5:
                wrong_opt = " ".join(alt_words[2:7]) if len(alt_words) >= 7 else sentences[idx + 1][:50]
                wrong_options.append(wrong_opt.strip(". ,")[:60])
        
        # Wrong option 2: Another variation
        if idx + 2 < len(sentences):
            alt_words = sentences[idx + 2].split()
            if len(alt_words) >= 5:
                wrong_opt = " ".join(alt_words[1:6]) if len(alt_words) >= 6 else sentences[idx + 2][:50]
                wrong_options.append(wrong_opt.strip(". ,")[:60])
        
        # Wrong option 3: Generic wrong answer
        generics = [
            "None of the above",
            "The opposite of the statement",
            "Not mentioned in the document",
            "Unable to determine",
            "All of the above"
        ]
        wrong_options.append(generics[idx % len(generics)])
        
        # Pad if needed
        while len(wrong_options) < 3:
            wrong_options.append(f"Alternative concept {len(wrong_options)}")
        
        # Combine all options and shuffle with correct answer in random position
        all_options = [correct_option] + wrong_options[:3]
        correct_idx = 0  # Correct answer is at index 0 initially
        
        # Shuffle options and track correct answer position
        shuffled = list(enumerate(all_options))
        random.shuffle(shuffled)
        correct_idx = next(i for i, (orig_idx, _) in enumerate(shuffled) if orig_idx == 0)
        all_options = [opt for _, opt in shuffled]
        
        quiz.append({
            "question": question,
            "options": all_options,
            "answer": correct_idx,
            "topic": topic,
            "explanation": f"The correct answer is '{correct_option}' because it directly relates to the key concept discussed in the document: '{sentence[:80]}...'"
        })

    quiz_cache = quiz[:num_questions]
    print(f"\n[FALLBACK QUIZ] Generated {len(quiz_cache)} questions")
    for i, q in enumerate(quiz_cache):
        print(f"  Q{i+1}: answer={q['answer']}, options={len(q['options'])}")
    
    return quiz_cache


def generate_quiz_from_pdf(num_questions: int = 10):
    """
    Generate EXACTLY 10 MCQs from PDF content only with topics.
    Retries multiple times if LLM output is invalid.
    """
    global quiz_cache

    if retriever is None:
        return []

    # 🔑 Get more diverse content for quiz generation
    docs = retriever.invoke(
        "key concepts definitions facts data examples important information"
    )
    
    # Get more chunks if available
    if len(docs) < 10 and retriever:
        extra_docs = retriever.invoke("summary main ideas topics")
        docs = docs + extra_docs
    
    context = "\n\n".join(d.page_content for d in docs[:15])

    quiz_prompt = f"""Generate exactly {num_questions} multiple-choice quiz questions from this document.

IMPORTANT RULES:
- Create {num_questions} REAL multiple-choice questions (NOT True/False, NOT Yes/No)
- Each question must have exactly 4 distinct options with meaningful content
- Options should be concept-based, not True/False statements
- NEVER use options like "True", "False", "Yes", "No", "Not sure", "Skip"
- Mark the correct answer with its index (0, 1, 2, or 3)
- Assign each question to a topic/subject area
- PROVIDE A BRIEF EXPLANATION for why the answer is correct
- Return ONLY a JSON array, nothing else
- Do NOT use markdown, code blocks, or any formatting
- Questions should test real understanding of the document content
- Topics can be: Concepts, Definitions, Facts, Data, Examples, Methods, Algorithms, Properties, etc.

QUESTION STYLE EXAMPLES:
❌ WRONG: "Is machine learning used in AI?" Options: ["True", "False"]
✅ RIGHT: "What is the primary goal of feature scaling?" Options: ["Normalize data range", "Increase model speed", "Reduce dataset size", "Remove outliers"]

❌ WRONG: "Are neural networks powerful?" Options: ["Yes", "No", "Maybe", "Unknown"]
✅ RIGHT: "Which algorithm is most sensitive to feature scaling?" Options: ["Decision Tree", "Random Forest", "K-Nearest Neighbors", "Naive Bayes"]

JSON Format:
[{{"question": "Which algorithm is best for...?", "options": ["Option A concept", "Option B concept", "Option C concept", "Option D concept"], "answer": 0, "topic": "Algorithms", "explanation": "This option is correct because..."}}]

Document Content:
{context}

Generate {num_questions} realistic MCQ questions (NOT True/False) with 4 meaningful options each and explanations:"""

    # 🔁 Retry up to 5 times if JSON parsing fails
    for attempt in range(5):
        try:
            response = llm.invoke(quiz_prompt)
            text = _clean_json(response)

            # Parse JSON
            quiz = json.loads(text)

            # Validate structure
            if not isinstance(quiz, list):
                continue
            
            if len(quiz) < num_questions:
                continue

            # Validate each question
            valid_quiz = []
            for q in quiz[:num_questions]:
                if not isinstance(q, dict):
                    continue
                if "question" not in q or "options" not in q or "answer" not in q:
                    continue
                if not isinstance(q["options"], list) or len(q["options"]) != 4:
                    continue
                
                # Convert answer to int if it's a string
                try:
                    answer = int(q["answer"])
                    if answer not in [0, 1, 2, 3]:
                        continue
                except (ValueError, TypeError):
                    continue
                
                # Create clean question
                clean_q = {
                    "question": str(q["question"]),
                    "options": [str(opt) for opt in q["options"]],
                    "answer": answer,
                    "topic": str(q.get("topic", "General")),
                    "explanation": str(q.get("explanation", ""))
                }
                
                valid_quiz.append(clean_q)
            
            if len(valid_quiz) == num_questions:
                quiz_cache = valid_quiz
                return quiz_cache
        
        except json.JSONDecodeError:
            continue
        except Exception:
            continue

    # ❌ Failed after all retries - return deterministic fallback
    return _fallback_quiz_from_text(num_questions)
