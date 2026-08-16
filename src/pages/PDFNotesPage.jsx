import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileQuestion,
  FileText,
  Layers3,
  Loader2,
  Printer,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { commerceSubjects } from "../data/commerceSyllabus";
import { extractPdfText } from "../services/pdfText";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/api/v1";
const tools = [
  {
    id: "summary",
    label: "Smart summary",
    copy: "A structured overview, key ideas and quick revision points.",
    icon: FileText,
    tone: "teal",
  },
  {
    id: "quiz",
    label: "PDF quiz",
    copy: "Chapter-locked MCQs created only from your uploaded document.",
    icon: FileQuestion,
    tone: "coral",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    copy: "Minimal concept cards for fast, clear revision.",
    icon: Layers3,
    tone: "blue",
  },
  {
    id: "very-short",
    label: "Very short answers",
    copy: "One-line recall questions with concise model answers.",
    icon: Sparkles,
    tone: "amber",
  },
  {
    id: "short",
    label: "Short answers",
    copy: "Exam-style questions with focused 3–5 line answers.",
    icon: BookOpen,
    tone: "violet",
  },
  {
    id: "mock-test",
    label: "Mock test",
    copy: "A complete CBSE-style paper with answer key and marking scheme.",
    icon: ClipboardList,
    tone: "rose",
  },
];

export default function PDFNotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [subjectId, setSubjectId] = useState("accountancy"),
    [chapter, setChapter] = useState(""),
    [topic, setTopic] = useState(""),
    [activeTool, setActiveTool] = useState("summary");
  const [difficulty, setDifficulty] = useState("Medium"),
    [quizCount, setQuizCount] = useState(10),
    [timerEnabled, setTimerEnabled] = useState(false),
    [timer, setTimer] = useState(10);
  const [cardCount, setCardCount] = useState(10),
    [answerCount, setAnswerCount] = useState(5),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [output, setOutput] = useState(null);
  const [examType, setExamType] = useState("Unit Test"),
    [examMinutes, setExamMinutes] = useState(90),
    [maxMarks, setMaxMarks] = useState(40),
    [totalQuestions, setTotalQuestions] = useState(20);
  const [mockSource, setMockSource] = useState("pdf"),
    [selectedChapters, setSelectedChapters] = useState([]);
  const [sections, setSections] = useState({
    mcq: 8,
    veryShort: 4,
    short: 4,
    long: 2,
    caseStudy: 2,
  });
  const selectedSubject = useMemo(
    () =>
      commerceSubjects.find((s) => s.id === subjectId) || commerceSubjects[0],
    [subjectId],
  );
  const readyFiles = useMemo(
    () => files.filter((file) => file.selected && file.text),
    [files],
  );

  const updateFile = (id, patch) =>
    setFiles((current) =>
      current.map((file) => (file.id === id ? { ...file, ...patch } : file)),
    );
  const removeFile = (id) => {
    setFiles((current) => current.filter((file) => file.id !== id));
    setOutput(null);
  };
  const upload = async (e) => {
    const picked = [...(e.target.files || [])];
    e.target.value = "";
    if (!picked.length) return;
    const valid = picked.filter(
      (file) =>
        (file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")) &&
        file.size <= 10 * 1024 * 1024,
    );
    if (valid.length !== picked.length)
      setError(
        "Some files were skipped. Upload PDF files smaller than 10 MB each.",
      );
    else setError("");
    const slots = Math.max(0, 5 - files.length);
    const accepted = valid.slice(0, slots);
    if (!accepted.length) {
      setError("You can work with up to 5 PDFs at a time.");
      return;
    }
    const queued = accepted.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      text: "",
      status: "Reading…",
      progress: 0,
      selected: true,
    }));
    setFiles((current) => [...current, ...queued]);
    setOutput(null);
    for (const item of queued) {
      try {
        const extracted = await extractPdfText(item.file, (value) =>
          updateFile(item.id, { progress: value }),
        );
        updateFile(item.id, {
          text: extracted.text,
          status: `${extracted.processedPages} of ${extracted.pages} pages ready`,
          progress: 100,
        });
      } catch (err) {
        updateFile(item.id, {
          status: err.message || "Could not read this PDF.",
          progress: 0,
          selected: false,
        });
      }
    }
  };
  const rebalance = (total) => {
    setTotalQuestions(total);
    const mcq = Math.round(total * 0.4),
      veryShort = Math.round(total * 0.2),
      short = Math.round(total * 0.2),
      long = Math.max(1, Math.round(total * 0.1));
    setSections({
      mcq,
      veryShort,
      short,
      long,
      caseStudy: total - mcq - veryShort - short - long,
    });
  };
  const sectionTotal = Object.values(sections).reduce(
    (a, b) => a + Number(b || 0),
    0,
  );
  const withoutPdf = activeTool === "mock-test" && mockSource === "syllabus";
  const canGenerate = withoutPdf
    ? selectedChapters.length > 0
    : readyFiles.length > 0;
  const generate = async () => {
    if (!canGenerate) {
      setError(
        withoutPdf
          ? "Select at least one chapter."
          : "Upload and select at least one readable PDF.",
      );
      return;
    }
    if (activeTool === "mock-test" && sectionTotal !== totalQuestions) {
      setError(
        `Section counts must total ${totalQuestions}. Current total is ${sectionTotal}.`,
      );
      return;
    }
    setLoading(true);
    setError("");
    setOutput(null);
    try {
      const count =
        activeTool === "quiz"
          ? quizCount
          : activeTool === "flashcards"
            ? cardCount
            : activeTool === "mock-test"
              ? totalQuestions
              : answerCount;
      const sources = withoutPdf
        ? []
        : readyFiles.map((file) => ({ name: file.name, text: file.text }));
      const chapterScope = withoutPdf
        ? selectedChapters.join("; ")
        : chapter || "Detect from PDFs";
      const response = await fetch(`${API_BASE}/pdf/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources,
          sourceMode: withoutPdf ? "syllabus" : "pdf",
          mode: activeTool,
          subject: selectedSubject.name,
          chapter: chapterScope,
          topic:
            topic.trim() ||
            (withoutPdf ? "Selected chapters" : "Main PDF topic"),
          difficulty,
          count,
          examType,
          examMinutes,
          maxMarks,
          sections,
          session: "2026–27",
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.detail || "Could not generate this learning resource.",
        );
      if (user) {
        const token = await user.getIdToken();
        fetch(`${API_BASE}/learning/resources`, { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({resourceType:activeTool,title:`${selectedTool.label} · ${topic.trim()||chapterScope}`,subject:selectedSubject.name,chapters:chapterScope,content:data}) }).catch(()=>{});
      }
      if (activeTool === "quiz") {
        navigate("/quiz", {
          state: {
            generatedQuiz: {
              title: `${topic || chapter || `${readyFiles.length} PDF sources`} · PDF Quiz`,
              questions: data.questions || [],
            },
            timeLimit: timerEnabled ? timer : null,
          },
        });
        return;
      }
      setOutput(data);
    } catch (err) {
      setError(err.message || "Could not generate this resource.");
    } finally {
      setLoading(false);
    }
  };
  const selectedTool = tools.find((t) => t.id === activeTool);

  return (
    <div className="product-page pdf-lab min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="pdf-lab-head">
          <div>
            <span className="pdf-kicker">CONCEPTA DOCUMENT LAB</span>
            <h1>
              Turn your PDFs into
              <br />
              <em>a complete study session.</em>
            </h1>
            <p>
              Combine up to five documents, choose the sources you need, then
              summarise, revise and test yourself.
            </p>
          </div>
          <div className="pdf-orbit">
            <FileText />
            <span>PDFs</span>
            <i />
            <b>AI</b>
          </div>
        </header>
        <div className="pdf-workspace">
          <section className="pdf-source-panel">
            <div className="panel-title">
              <span>01</span>
              <div>
                <h2>Your sources</h2>
                <p>Up to 5 PDFs · maximum 10 MB each</p>
              </div>
            </div>
            <label
              className={`pdf-drop multi ${files.length ? "compact-drop" : ""}`}
            >
              <input
                multiple
                type="file"
                accept=".pdf,application/pdf"
                onChange={upload}
              />
              <UploadCloud />
              <strong>
                {files.length
                  ? "Add more PDFs"
                  : "Choose one or more study PDFs"}
              </strong>
              <span>Click to browse your device</span>
              <small>
                {files.length}/5 FILES ADDED · UP TO 40 PAGES PER PDF
              </small>
            </label>
            {!!files.length && (
              <div className="pdf-file-list">
                {files.map((item) => (
                  <article
                    key={item.id}
                    className={`${item.selected ? "selected" : ""} ${item.text ? "ready" : ""}`}
                  >
                    <button
                      className="source-check"
                      onClick={() =>
                        updateFile(item.id, { selected: !item.selected })
                      }
                      disabled={!item.text}
                    >
                      {item.selected && item.text ? <Check /> : null}
                    </button>
                    <div className="file-icon">
                      <FileText />
                    </div>
                    <div className="multi-file-copy">
                      <strong>{item.name}</strong>
                      <span>
                        {(item.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                        {item.status}
                      </span>
                      <div className="file-progress">
                        <i style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    <button
                      className="remove-source"
                      onClick={() => removeFile(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))}
              </div>
            )}
            <div
              className={`pdf-context ${!readyFiles.length && !withoutPdf ? "context-disabled" : ""}`}
            >
              <div className="panel-title compact">
                <span>02</span>
                <div>
                  <h2>Learning context</h2>
                  <p>
                    {withoutPdf
                      ? "Choose subject and chapters—no upload needed."
                      : `${readyFiles.length} selected source${readyFiles.length === 1 ? "" : "s"} will be used.`}
                  </p>
                </div>
              </div>
              <label>
                Subject
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setChapter("");
                    setSelectedChapters([]);
                  }}
                >
                  {commerceSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {withoutPdf ? (
                <div className="chapter-picker">
                  <span>Chapters</span>
                  <div>
                    {selectedSubject.chapters.map((c) => (
                      <button
                        type="button"
                        className={selectedChapters.includes(c) ? "active" : ""}
                        onClick={() =>
                          setSelectedChapters((current) =>
                            current.includes(c)
                              ? current.filter((x) => x !== c)
                              : [...current, c],
                          )
                        }
                        key={c}
                      >
                        {selectedChapters.includes(c) ? <Check /> : null}
                        {c}
                      </button>
                    ))}
                  </div>
                  <small>
                    {selectedChapters.length} chapter
                    {selectedChapters.length === 1 ? "" : "s"} selected
                  </small>
                </div>
              ) : (
                <label>
                  Chapter
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                  >
                    <option value="">Detect from PDFs</option>
                    {selectedSubject.chapters.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Topic or focus area
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Types of partnership"
                />
              </label>
            </div>
          </section>
          <main className="pdf-studio">
            <div className="panel-title">
              <span>03</span>
              <div>
                <h2>Choose a study tool</h2>
                <p>
                  Each resource is generated only from your uploaded content.
                </p>
              </div>
            </div>
            <div className="pdf-tool-grid">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    disabled={!readyFiles.length && tool.id !== "mock-test"}
                    onClick={() => {
                      setActiveTool(tool.id);
                      setOutput(null);
                      setError("");
                    }}
                    className={`${tool.tone} ${activeTool === tool.id ? "active" : ""}`}
                  >
                    <Icon />
                    <div>
                      <strong>{tool.label}</strong>
                      <span>{tool.copy}</span>
                    </div>
                    <ChevronRight />
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.section
                key={activeTool}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pdf-config"
              >
                <div className="config-copy">
                  <span>SETTINGS</span>
                  <h3>{selectedTool.label}</h3>
                  <p>{selectedTool.copy}</p>
                </div>
                {activeTool === "quiz" && (
                  <div className="config-controls">
                    <label>
                      Difficulty
                      <div className="pdf-segments">
                        {["Easy", "Medium", "Hard"].map((x) => (
                          <button
                            className={difficulty === x ? "active" : ""}
                            onClick={() => setDifficulty(x)}
                            key={x}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    </label>
                    <label>
                      Questions
                      <div className="pdf-segments counts">
                        {[5, 10, 20].map((x) => (
                          <button
                            className={quizCount === x ? "active" : ""}
                            onClick={() => setQuizCount(x)}
                            key={x}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    </label>
                    <div className="pdf-timer">
                      <div>
                        <Clock3 />
                        <span>
                          <strong>Add timer</strong>
                          <small>Optional</small>
                        </span>
                      </div>
                      <button
                        role="switch"
                        aria-checked={timerEnabled}
                        onClick={() => setTimerEnabled((v) => !v)}
                        className={timerEnabled ? "on" : ""}
                      >
                        <i />
                      </button>
                    </div>
                    {timerEnabled && (
                      <label>
                        Time limit
                        <select
                          value={timer}
                          onChange={(e) => setTimer(Number(e.target.value))}
                        >
                          {[5, 10, 15, 20, 30].map((x) => (
                            <option value={x} key={x}>
                              {x} minutes
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
                {activeTool === "flashcards" && (
                  <div className="config-controls">
                    <label>
                      Number of cards
                      <div className="pdf-segments two">
                        {[5, 10].map((x) => (
                          <button
                            className={cardCount === x ? "active" : ""}
                            onClick={() => setCardCount(x)}
                            key={x}
                          >
                            {x} cards
                          </button>
                        ))}
                      </div>
                    </label>
                    <div className="minimal-note">
                      <Layers3 />
                      <span>
                        <strong>Minimal by design</strong>
                        <small>
                          One concept and one clear explanation per card.
                        </small>
                      </span>
                    </div>
                  </div>
                )}
                {(activeTool === "very-short" || activeTool === "short") && (
                  <div className="config-controls">
                    <label>
                      Number of questions
                      <div className="pdf-segments two">
                        {[5, 10].map((x) => (
                          <button
                            className={answerCount === x ? "active" : ""}
                            onClick={() => setAnswerCount(x)}
                            key={x}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    </label>
                    <div className="minimal-note">
                      <BookOpen />
                      <span>
                        <strong>
                          {activeTool === "very-short"
                            ? "One-line answers"
                            : "3–5 line answers"}
                        </strong>
                        <small>Clear model answers for self-checking.</small>
                      </span>
                    </div>
                  </div>
                )}
                {activeTool === "mock-test" && (
                  <div className="mock-config">
                    <div className="mock-source-switch">
                      <button type="button" className={mockSource === "pdf" ? "active" : ""} onClick={() => setMockSource("pdf")}><FileText />From PDF</button>
                      <button type="button" className={mockSource === "syllabus" ? "active" : ""} onClick={() => setMockSource("syllabus")}><BookOpen />Without PDF</button>
                    </div>
                    <div className="mock-row">
                      <label>
                        Exam type
                        <select
                          value={examType}
                          onChange={(e) => setExamType(e.target.value)}
                        >
                          {[
                            "Unit Test",
                            "Practice Test",
                            "Half-Yearly Examination",
                            "Final Examination",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Time
                        <select
                          value={examMinutes}
                          onChange={(e) =>
                            setExamMinutes(Number(e.target.value))
                          }
                        >
                          {[60, 90, 120, 180].map((x) => (
                            <option key={x} value={x}>
                              {x < 60
                                ? `${x} min`
                                : `${x / 60} hour${x > 60 ? "s" : ""}`}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Maximum marks
                        <select
                          value={maxMarks}
                          onChange={(e) => setMaxMarks(Number(e.target.value))}
                        >
                          {[20, 40, 80].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Total questions
                      <div className="pdf-segments four">
                        {[20, 35, 40, 45].map((x) => (
                          <button
                            className={totalQuestions === x ? "active" : ""}
                            onClick={() => rebalance(x)}
                            key={x}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    </label>
                    <div className="section-mixer">
                      <div>
                        <span>MCQs</span>
                        <input
                          type="number"
                          min="0"
                          value={sections.mcq}
                          onChange={(e) =>
                            setSections({
                              ...sections,
                              mcq: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <span>Very short</span>
                        <input
                          type="number"
                          min="0"
                          value={sections.veryShort}
                          onChange={(e) =>
                            setSections({
                              ...sections,
                              veryShort: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <span>Short</span>
                        <input
                          type="number"
                          min="0"
                          value={sections.short}
                          onChange={(e) =>
                            setSections({
                              ...sections,
                              short: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <span>Long</span>
                        <input
                          type="number"
                          min="0"
                          value={sections.long}
                          onChange={(e) =>
                            setSections({
                              ...sections,
                              long: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <span>Case study</span>
                        <input
                          type="number"
                          min="0"
                          value={sections.caseStudy}
                          onChange={(e) =>
                            setSections({
                              ...sections,
                              caseStudy: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div
                      className={`section-total ${sectionTotal === totalQuestions ? "valid" : "invalid"}`}
                    >
                      <span>Section total</span>
                      <strong>
                        {sectionTotal} / {totalQuestions}
                      </strong>
                    </div>
                  </div>
                )}
                {activeTool === "summary" && (
                  <div className="config-controls">
                    <div className="minimal-note">
                      <Brain />
                      <span>
                        <strong>Smart structured summary</strong>
                        <small>
                          Overview, core concepts, key terms and revision
                          checklist.
                        </small>
                      </span>
                    </div>
                  </div>
                )}
                <button
                  disabled={!canGenerate || loading}
                  onClick={generate}
                  className="pdf-generate"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {withoutPdf ? "Building from selected chapters…" : `Creating from ${readyFiles.length} PDF${readyFiles.length === 1 ? "" : "s"}…`}
                    </>
                  ) : (
                    <>
                      Generate {selectedTool.label}
                      <ArrowRight />
                    </>
                  )}
                </button>
              </motion.section>
            </AnimatePresence>
            {error && (
              <div className="pdf-error">
                <AlertCircle />
                {error}
              </div>
            )}
            {(loading || output) && (
              <section
                className={`pdf-output ${output?.paper ? "mock-paper-output" : ""}`}
              >
                <div className="output-head">
                  <div>
                    <span>GENERATED RESOURCE</span>
                    <h2>{selectedTool.label}</h2>
                  </div>
                  <div className="output-actions">
                    <small>{topic || chapter || selectedSubject.name}</small>
                    {output?.paper && (
                      <button onClick={() => window.print()}>
                        <Printer /> Print paper
                      </button>
                    )}
                  </div>
                </div>
                {loading ? (
                  <div className="output-loading">
                    <Loader2 className="animate-spin" />
                    <strong>
                      {activeTool === "mock-test"
                        ? "Setting sections, questions and marking scheme…"
                        : "Reading concepts and building your resource…"}
                    </strong>
                    <span>
                      {activeTool === "mock-test"
                        ? "A full paper can take one to three minutes."
                        : "This may take a few moments."}
                    </span>
                  </div>
                ) : output?.paper ? (
                  <div className="exam-document">
                    <pre>{output.paper}</pre>
                    <div className="exam-page-break" />
                    <pre>{output.markingScheme}</pre>
                  </div>
                ) : output?.flashcards ? (
                  <div className="flashcard-grid">
                    {output.flashcards.map((card, i) => (
                      <motion.article
                        className={`card-tone-${i % 5}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        key={i}
                      >
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <h3>{card.front}</h3>
                        <p>{card.back}</p>
                      </motion.article>
                    ))}
                  </div>
                ) : output?.questions ? (
                  <div className="written-list">
                    {output.questions.map((q, i) => (
                      <article key={i}>
                        <b>{i + 1}</b>
                        <div>
                          <h3>{q.question}</h3>
                          <p>{q.answer}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="summary-output">
                    {(output?.content || "")
                      .split("\n")
                      .map((line, i) =>
                        line.trim() ? <p key={i}>{line}</p> : <br key={i} />,
                      )}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
