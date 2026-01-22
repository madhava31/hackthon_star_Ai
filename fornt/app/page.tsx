"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const API_BASE = "/api";

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div style={{
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "3px solid rgba(255, 255, 255, 0.3)",
      borderTop: "3px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }} />
  );
}

type Message = {
  role: "user" | "assistant";
  text: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  topic?: string;
  explanation?: string;
};

type WeakTopic = {
  topic: string;
  wrongCount: number;
  totalCount: number;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [quizFullScreen, setQuizFullScreen] = useState(false);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [chatFullScreen, setChatFullScreen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mounted]);

  const scorePct = score === null || quiz.length === 0 ? 0 : Math.round((score / quiz.length) * 100);

  async function uploadPDF() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/upload-pdf`, { method: "POST", body: formData });
      if (res.ok) {
        setPdfUploaded(true);
        setMessages([]);
        setQuiz([]);
        setAnswers([]);
        setScore(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function askQuestion() {
    if (!question.trim() || !pdfUploaded) return;
    const userQuestion = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: userQuestion }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer || "No answer" }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", text: "Backend unreachable." }]);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuiz() {
    if (!pdfUploaded) return;
    setQuizLoading(true);
    setQuizFullScreen(true);
    try {
      const res = await fetch(`${API_BASE}/generate-quiz`);
      const data = await res.json();
      if (!data.quiz || !Array.isArray(data.quiz) || data.quiz.length === 0) {
        setQuiz([]);
        setAnswers([]);
        setScore(null);
        return;
      }
      setQuiz(data.quiz);
      setAnswers(new Array(data.quiz.length).fill(-1));
      setScore(null);
      setWeakTopics([]);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  }

  async function submitQuiz() {
    if (answers.some((a) => a === -1)) return;
    try {
      const res = await fetch(`${API_BASE}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setScore(data.score);
      const quizData = Array.isArray(data.quiz) ? data.quiz : quiz;
      setQuiz(quizData);

      // Calculate weak topics
      const topicStats = new Map<string, { wrong: number; total: number }>();
      quizData.forEach((q: any, i: number) => {
        const topic = q.topic || "General";
        if (!topicStats.has(topic)) {
          topicStats.set(topic, { wrong: 0, total: 0 });
        }
        const stat = topicStats.get(topic)!;
        stat.total += 1;
        if (answers[i] !== q.answer) {
          stat.wrong += 1;
        }
      });

      console.log("Topic Stats:", Object.fromEntries(topicStats));
      console.log("Quiz Data:", quizData);

      // Convert to weak topics list (topics with > 0 wrong answers), sorted by wrong count
      const weak = Array.from(topicStats.entries())
        .map(([topic, stat]) => ({
          topic,
          wrongCount: stat.wrong,
          totalCount: stat.total,
        }))
        .filter((t) => t.wrongCount > 0)
        .sort((a, b) => b.wrongCount - a.wrongCount);

      console.log("Weak Topics:", weak);
      setWeakTopics(weak);
    } catch (err) {
      console.error(err);
    }
  }

  function resetAll() {
    setPdfUploaded(false);
    setMessages([]);
    setQuiz([]);
    setAnswers([]);
    setScore(null);
    setQuestion("");
    setFile(null);
    setQuizFullScreen(false);
    setChatFullScreen(false);
    setWeakTopics([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function scrollToUpload() {
    if (uploadSectionRef.current) {
      uploadSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }
  // Fullscreen Chat Mode
  if (chatFullScreen && pdfUploaded) {
    return (
      <div className={styles.fullscreenChat}>
        <div className={styles.chatHeader}>
          <div>
            <h2>Chat with PDF</h2>
            <p className={styles.chatSubtitle}>Ask questions about your document</p>
          </div>
          <button onClick={() => setChatFullScreen(false)} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.fullscreenChatContainer}>
          <div className={styles.messagesArea}>
            {messages.length === 0 && (
              <div className={styles.emptyChat}>
                <div className={styles.emptyChatIcon}>💬</div>
                <p>Start asking questions about your PDF</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.userBubble : styles.botBubble}>
                {m.text}
              </div>
            ))}
            {loading && <div className={styles.botBubble}>Thinking...</div>}
            <div ref={bottomRef} />
          </div>

          <div className={styles.chatInputArea}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="Ask something about your PDF..."
              disabled={loading}
              className={styles.fullscreenChatInput}
              autoFocus
            />
            <button
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              className={styles.sendButton}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!mounted) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>📑</div>
            <div>
              <h1 className={styles.title}>PDF Insight</h1>
              <p className={styles.subtitle}>Next.js frontend with FastAPI backend</p>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
        </main>
      </div>
    );
  }

  // Fullscreen Quiz Mode
  if (quizFullScreen && quiz.length > 0) {
    return (
      <div className={styles.fullscreenQuiz}>
        <div className={styles.quizHeader}>
          <div>
            <h2>Quiz Mode</h2>
            <p className={styles.quizSubtext}>{score === null ? "Answer all questions" : "Quiz Completed"}</p>
          </div>
          {score !== null && (
            <div className={styles.scorePill}>
              {score}/{quiz.length}
            </div>
          )}
        </div>

        <div className={styles.fullscreenQuizContainer}>
          {quizLoading && <div className={styles.statusText}>Generating quiz...</div>}
          {!quizLoading && quiz.length > 0 && (
            <>
              {score !== null ? (
                <div className={styles.scoreDisplayCard}>
                  <div className={styles.scoreCircle}>
                    <div className={styles.scorePercentage}>{scorePct}%</div>
                  </div>
                  <h3 className={styles.scoreTitle}>Quiz Completed!</h3>
                  <p className={styles.scoreStats}>
                    You got <strong>{score} out of {quiz.length}</strong> questions correct
                  </p>
                  {scorePct >= 80 && <p className={styles.scoreMessage} style={{ color: "#16a34a" }}>🎉 Excellent work!</p>}
                  {scorePct >= 60 && scorePct < 80 && <p className={styles.scoreMessage} style={{ color: "#2563eb" }}>👍 Good effort! Keep practicing.</p>}
                  {scorePct < 60 && <p className={styles.scoreMessage} style={{ color: "#ea580c" }}>📚 Review the topics below to improve!</p>}
                </div>
              ) : null}
              
              {quiz.map((q, i) => (
                <div key={i} className={styles.fullscreenQuizQuestion}>
                  <div className={styles.quizQuestionCounter}>
                    Question {i + 1} of {quiz.length}
                  </div>
                  <p className={styles.quizQuestionText}>{q.question}</p>
                  {q.topic && <p className={styles.quizTopic}>📚 Topic: {q.topic}</p>}
                  <div className={styles.fullscreenOptionsList}>
                    {q.options.map((opt, j) => {
                      const selected = answers[i] === j;
                      const afterSubmit = score !== null;
                      const isCorrect = j === q.answer;
                      const isUser = selected;
                      let className = styles.fullscreenOption;
                      if (afterSubmit && isCorrect) className += ` ${styles.correct}`;
                      if (afterSubmit && isUser && !isCorrect) className += ` ${styles.incorrect}`;
                      if (!afterSubmit && selected) className += ` ${styles.selected}`;

                      return (
                        <button
                          key={j}
                          type="button"
                          className={className}
                          onClick={() => {
                            const next = [...answers];
                            next[i] = j;
                            setAnswers(next);
                          }}
                          disabled={afterSubmit}
                        >
                          <span className={styles.optionLabel}>{String.fromCharCode(65 + j)}</span>
                          <span className={styles.optionText}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {score !== null && weakTopics.length > 0 && (
                <div className={styles.weaknessReport}>
                  <h3>📊 Areas to Improve</h3>
                  <p className={styles.reportDescription}>
                    Based on your answers, here are the topics where you need more practice:
                  </p>
                  <div className={styles.weakTopicsList}>
                    {weakTopics.map((topic, idx) => {
                      const percentage = Math.round((topic.wrongCount / topic.totalCount) * 100);
                      const difficulty = percentage >= 75 ? 'Critical' : percentage >= 50 ? 'High' : 'Medium';
                      const difficultyColor = percentage >= 75 ? '#ef4444' : percentage >= 50 ? '#f97316' : '#eab308';
                      const recommendation = percentage >= 75 ? 'Review this topic thoroughly' : percentage >= 50 ? 'Practice more questions' : 'Additional study recommended';
                      
                      return (
                        <div key={idx} className={styles.weakTopicItem}>
                          <div className={styles.topicHeaderRow}>
                            <div className={styles.topicName}>{topic.topic}</div>
                            <div className={styles.difficultyBadge} style={{ borderColor: difficultyColor, color: difficultyColor }}>
                              {difficulty}
                            </div>
                          </div>
                          <div className={styles.topicStats}>
                            <span className={styles.wrongCount}>
                              {topic.wrongCount} / {topic.totalCount} incorrect
                            </span>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${percentage}%`, backgroundColor: difficultyColor }}
                              ></div>
                            </div>
                            <span className={styles.percentageLabel}>{percentage}%</span>
                          </div>
                          <div className={styles.recommendation}>
                            <span className={styles.lightbulbIcon}>💡</span>
                            <p>{recommendation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {score !== null && (
                <div className={styles.explanationsSection}>
                  <h3>💡 Learn from Mistakes</h3>
                  <p className={styles.explanationDescription}>
                    Here are explanations for the questions you answered incorrectly:
                  </p>
                  <div className={styles.explanationsList}>
                    {quiz.map((q, i) => {
                      const userAnswer = answers[i];
                      const isWrong = userAnswer !== -1 && userAnswer !== q.answer;
                      if (!isWrong) return null;
                      return (
                        <div key={i} className={styles.explanationItem}>
                          <div className={styles.explanationHeader}>
                            <span className={styles.questionNumber}>Question {i + 1}</span>
                            {q.topic && <span className={styles.topicBadge}>{q.topic}</span>}
                          </div>
                          <p className={styles.explanationQuestion}>{q.question}</p>
                          <div className={styles.explanationContent}>
                            <div className={styles.yourAnswer}>
                              <span className={styles.answerLabel}>Your Answer:</span>
                              <span className={styles.wrongAnswer}>{q.options[userAnswer]}</span>
                            </div>
                            <div className={styles.correctAnswer}>
                              <span className={styles.answerLabel}>Correct Answer:</span>
                              <span className={styles.rightAnswer}>{q.options[q.answer]}</span>
                            </div>
                          </div>
                          {q.explanation && (
                            <div className={styles.explanationText}>
                              <span className={styles.explanationLabel}>Explanation:</span>
                              <p className={styles.explanationBody}>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.fullscreenActions}>
                {score === null && (
                  <button
                    onClick={submitQuiz}
                    disabled={answers.some((a) => a === -1)}
                    className={styles.primaryButton}
                  >
                    {answers.some((a) => a === -1)
                      ? `Complete Quiz (${answers.filter((a) => a !== -1).length}/${quiz.length} answered)`
                      : "Submit Quiz"}
                  </button>
                )}
                <button
                  onClick={() => setQuizFullScreen(false)}
                  className={styles.secondaryButton}
                >
                  {score !== null ? "Exit" : "Cancel"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>📑</div>
          <div>
            <h1 className={styles.title}>PDF Insight</h1>
            <p className={styles.subtitle}>Next.js frontend with FastAPI backend</p>
          </div>
        </div>
        {pdfUploaded && (
          <button onClick={resetAll} className={styles.resetButton}>
            Reset
          </button>
        )}
      </header>

      <main className={styles.main}>
        {!pdfUploaded ? (
          <>
            <section className={styles.heroSection}>
              <div className={styles.heroContent}>
                <div className={styles.heroLeft}>
                  <div className={styles.heroBadge}>✨ Industry-Ready RAG Solution</div>
                  <h2 className={styles.heroTitle}>Transform Any PDF into Interactive Learning</h2>
                  <p className={styles.heroSubtitle}>
                    PDF Insight harnesses advanced RAG (Retrieval-Augmented Generation) to turn static documents 
                    into dynamic, interactive experiences. Chat naturally with your PDFs, auto-generate comprehensive quizzes, 
                    and receive AI-powered insights on weak knowledge areas.
                  </p>
                  
                  <div className={styles.heroFeatures}>
                    <div className={styles.featureGroup}>
                      <div className={styles.featureTitle}>Core Features</div>
                      <div className={styles.featureGrid}>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>⚡</span>
                          <span className={styles.featureName}>Auto Quiz Generation</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>💬</span>
                          <span className={styles.featureName}>Natural Conversations</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>📊</span>
                          <span className={styles.featureName}>Knowledge Analytics</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>🎯</span>
                          <span className={styles.featureName}>Weakness Detection</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.heroActions}>
                    <button className={styles.primaryButton} onClick={scrollToUpload}>
                      Start Free Now
                    </button>
                    <button className={styles.secondaryButton} onClick={() => setChatFullScreen(true)}>
                      See Demo
                    </button>
                  </div>
                </div>

                <div className={styles.heroRight}>
                  <div className={styles.metricsSection}>
                    <div className={styles.metricsTitle}>Proven Results</div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>3x</div>
                      <div className={styles.metricLabel}>Faster Document Review</div>
                      <div className={styles.metricDesc}>Cut study time with instant summaries</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>98%</div>
                      <div className={styles.metricLabel}>Question Coverage</div>
                      <div className={styles.metricDesc}>Comprehensive answers from your PDFs</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricValue}>0</div>
                      <div className={styles.metricLabel}>Setup Time</div>
                      <div className={styles.metricDesc}>Start learning in seconds</div>
                    </div>
                    <div className={styles.technologyBadge}>
                      <div className={styles.techTitle}>Powered By</div>
                      <div className={styles.techStack}>FastAPI • LangChain • HuggingFace • FAISS</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section ref={uploadSectionRef} className={styles.uploadSection}>
            <div className={styles.uploadContent}>
              <div className={styles.uploadLead}>
                <div className={styles.leadBadge}>Why PDF Insight?</div>
                <h2>Why Choose PDF Insight?</h2>
                <div className={styles.leadBullets}>
                  <div className={styles.bulletItem}>🚀 Lightning-fast document processing with vector embeddings</div>
                  <div className={styles.bulletItem}>🧠 Context-aware answers powered by LangChain & HuggingFace</div>
                  <div className={styles.bulletItem}>📈 Track your learning progress with detailed analytics</div>
                  <div className={styles.bulletItem}>🎓 Generate unlimited quizzes tailored to your document</div>
                  <div className={styles.bulletItem}>💪 Identify knowledge gaps and get targeted recommendations</div>
                </div>
              </div>

              <div className={`${styles.uploadCard} ${styles.uploadControls}`}>
                <div className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>Choose your PDF</span>
                  <span className={styles.cardHint}>Max 25 MB</span>
                </div>
                
                <div 
                  className={`${styles.fileDropZone} ${file ? styles.fileSelected : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(styles.dragOver);
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove(styles.dragOver);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(styles.dragOver);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      setFile(files[0]);
                    }
                  }}
                >
                  {!file ? (
                    <>
                      <div className={styles.dropIcon}>📄</div>
                      <p className={styles.dropText}>Drop your PDF here or click to browse</p>
                      <p className={styles.dropSubtext}>Supports PDFs up to 25 MB</p>
                    </>
                  ) : (
                    <>
                      <div className={styles.selectedIcon}>✓</div>
                      <p className={styles.selectedText}>{file.name}</p>
                      <p className={styles.selectedSubtext}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className={styles.fileInput}
                  style={{ display: 'none' }}
                />
                
                <button
                  onClick={uploadPDF}
                  disabled={!file || loading}
                  className={styles.primaryButton}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner /> Processing...
                    </>
                  ) : (
                    "Upload & Continue"
                  )}
                </button>
              </div>
            </div>
            </section>
          </>
        ) : (
          <section className={styles.contentGrid}>
            <div className={styles.chatCard} onClick={() => setChatFullScreen(true)}>
              <div className={styles.chatHeader}>
                <div>
                  <div className={styles.chatHeaderIcon}>💬</div>
                  <h2>Chat with PDF</h2>
                </div>
                <span className={styles.badge}>Active</span>
              </div>
              <div className={styles.chatArea}>
                {messages.length === 0 && (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📝</div>
                    <div>Start a conversation about your PDF</div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={m.role === "user" ? styles.userBubble : styles.botBubble}
                  >
                    {m.text}
                  </div>
                ))}
                {loading && <div className={styles.botBubble}>Thinking...</div>}
                <div ref={bottomRef} />
              </div>
              <div className={styles.chatInputRow}>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      askQuestion();
                    }
                  }}
                  placeholder="Ask about your PDF..."
                  disabled={loading}
                  className={styles.chatInput}
                />
                <button
                  onClick={askQuestion}
                  disabled={loading || !question.trim()}
                  className={styles.primaryButton}
                >
                  Send
                </button>
              </div>
            </div>

            <div className={styles.quizCard}>
              <div className={styles.quizHeader}>
                <div>
                  <h2>Quiz</h2>
                  <p className={styles.quizSubtext}>Auto-generated questions from your PDF</p>
                </div>
                {score !== null && quiz.length > 0 && (
                  <div className={styles.scorePill}>
                    {score}/{quiz.length} ({scorePct}%)
                  </div>
                )}
              </div>
              <div className={styles.quizActions}>
                <button onClick={loadQuiz} className={styles.secondaryButton}>
                  {quizLoading ? "Generating..." : "Generate / Refresh"}
                </button>
                <button
                  onClick={submitQuiz}
                  disabled={answers.length === 0 || answers.some((a) => a === -1)}
                  className={styles.primaryButton}
                >
                  Submit
                </button>
              </div>
              <div className={styles.quizArea}>
                {quizLoading && <div className={styles.statusText}>Generating quiz...</div>}
                {!quizLoading && quiz.length === 0 && (
                  <div className={styles.statusText}>No quiz yet. Click “Generate / Refresh”.</div>
                )}
                {!quizLoading &&
                  quiz.length > 0 &&
                  quiz.map((q, i) => (
                    <div key={i} className={styles.quizQuestion}>
                      <div className={styles.quizQuestionHeader}>
                        <span className={styles.quizIndex}>{i + 1}</span>
                        <div>
                          <p className={styles.quizQuestionText}>{q.question}</p>
                          {q.topic && (
                            <p className={styles.quizTopic}>Topic: {q.topic}</p>
                          )}
                        </div>
                      </div>
                      <div className={styles.optionsList}>
                        {q.options.map((opt, j) => {
                          const selected = answers[i] === j;
                          const afterSubmit = score !== null;
                          const isCorrect = j === q.answer;
                          const isUser = selected;
                          let className = styles.option;
                          if (afterSubmit && isCorrect) className += ` ${styles.correct}`;
                          if (afterSubmit && isUser && !isCorrect) className += ` ${styles.incorrect}`;
                          if (!afterSubmit && selected) className += ` ${styles.selected}`;

                          return (
                            <button
                              key={j}
                              type="button"
                              className={className}
                              onClick={() => {
                                const next = [...answers];
                                next[i] = j;
                                setAnswers(next);
                              }}
                            >
                              <span className={styles.optionLabel}>{String.fromCharCode(65 + j)}</span>
                              <span className={styles.optionText}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}


