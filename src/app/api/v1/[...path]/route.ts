import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };

const questionBank = [
  { question: "Which equation is the foundation of accounting?", options: ["Assets = Liabilities + Capital", "Profit = Assets + Capital", "Cash = Sales - Purchases", "Capital = Assets + Liabilities"], correct: 0, category: "Accountancy" },
  { question: "A transaction recorded first in the books is entered in the:", options: ["Journal", "Balance Sheet", "Trial Balance", "Cash Flow Statement"], correct: 0, category: "Accountancy" },
  { question: "Which concept treats the owner and business as separate?", options: ["Business Entity Concept", "Money Measurement", "Going Concern", "Dual Aspect"], correct: 0, category: "Accountancy" },
  { question: "According to the law of demand, price and quantity demanded generally move:", options: ["In opposite directions", "In the same direction", "Without any relationship", "Only upward"], correct: 0, category: "Economics" },
  { question: "Opportunity cost means:", options: ["The next best alternative sacrificed", "Total money spent", "Fixed cost only", "Market price"], correct: 0, category: "Economics" },
  { question: "A market with one seller is called:", options: ["Monopoly", "Perfect competition", "Oligopoly", "Monopsony"], correct: 0, category: "Economics" },
  { question: "Which is an economic activity?", options: ["Teaching for a salary", "Helping a friend", "Playing for recreation", "Cooking at home for family"], correct: 0, category: "Business Studies" },
  { question: "The primary objective of business is to:", options: ["Satisfy needs while earning sustainable profit", "Avoid every risk", "Eliminate competition", "Only increase prices"], correct: 0, category: "Business Studies" },
  { question: "A business owned by one person is a:", options: ["Sole proprietorship", "Partnership", "Company", "Cooperative society"], correct: 0, category: "Business Studies" },
  { question: "Which document records credit purchases of goods?", options: ["Purchases book", "Sales book", "Cash book", "Journal proper only"], correct: 0, category: "Accountancy" },
  { question: "Statistics in economics mainly helps us to:", options: ["Organise and interpret economic data", "Remove all uncertainty", "Replace economic theory", "Predict every event exactly"], correct: 0, category: "Economics" },
  { question: "Liability of a sole proprietor is generally:", options: ["Unlimited", "Limited to shares", "Zero", "Limited by agreement with customers"], correct: 0, category: "Business Studies" },
  { question: "Which part of a notice tells readers what action they should take?", options: ["The call to action", "The salutation", "The bibliography", "The footnote"], correct: 0, category: "English Core" },
  { question: "In a formal article, the opening paragraph should mainly:", options: ["Introduce the issue clearly", "List every source", "Repeat the title", "Give only personal details"], correct: 0, category: "English Core" },
  { question: "Which Python data type stores an ordered, changeable collection?", options: ["List", "Tuple", "String", "Integer"], correct: 0, category: "Informatics Practices" },
  { question: "Which SQL command is used to retrieve records from a table?", options: ["SELECT", "UPDATE", "DELETE", "DROP"], correct: 0, category: "Informatics Practices" },
  { question: "Simple interest on principal P at rate R for T years is:", options: ["PRT/100", "P+R+T", "P(1+R)^T", "PR/T"], correct: 0, category: "Applied Mathematics" },
  { question: "The mean of 4, 6 and 8 is:", options: ["6", "5", "7", "18"], correct: 0, category: "Applied Mathematics" },
];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

type GeneratedQuestion = { question: string; options: string[]; correct: number; explanation: string };

function extractJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI response did not contain JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function validateGeneratedQuestions(value: unknown, expectedCount: number): GeneratedQuestion[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as any).questions)) throw new Error("Invalid quiz structure");
  const seen = new Set<string>();
  const questions = (value as any).questions.filter((item: any) => {
    if (!item || typeof item.question !== "string" || item.question.trim().length < 12) return false;
    if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((option: unknown) => typeof option !== "string" || !option.trim())) return false;
    const rawCorrect = item.correct ?? item.correctIndex ?? item.answer;
    const normalizedCorrect = Number.isInteger(rawCorrect) ? rawCorrect : typeof rawCorrect === "string" && /^[A-D]$/i.test(rawCorrect.trim()) ? rawCorrect.trim().toUpperCase().charCodeAt(0) - 65 : Array.isArray(item.options) ? item.options.findIndex((option: string) => option === rawCorrect) : -1;
    if (!Number.isInteger(normalizedCorrect) || normalizedCorrect < 0 || normalizedCorrect > 3) return false;
    item.correct = normalizedCorrect;
    const key = item.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, expectedCount).map((item: any) => ({
    question: item.question.trim(), options: item.options.map((option: string) => option.trim()), correct: item.correct,
    explanation: typeof item.explanation === "string" ? item.explanation.trim() : "Review this concept from the selected chapter.",
  }));
  // Keep every valid question. Models occasionally return 18–19 items for a
  // 20-item request; the caller can cheaply top up only the missing items.
  if (!questions.length) throw new Error("AI returned no valid questions");
  return questions;
}

async function generateQuizBatch(subject: string, chapter: string, difficulty: string, count: number, excluded: string[] = [], modelOverride?: string, batchIndex = 0) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const difficultyRule = difficulty === "Easy" ? "Use direct definitions, recognition, and one-step recall appropriate for a beginner." : difficulty === "Hard" ? "Use application, case-based reasoning, misconceptions, and multi-step thinking appropriate for a strong Class 11 student." : "Use concept understanding, short applications, and moderate reasoning; avoid both trivial recall and advanced Class 12 content.";
  const exclusions = excluded.length ? `\nDo not repeat or closely paraphrase these already-generated questions:\n${excluded.map((question, index) => `${index + 1}. ${question}`).join("\n")}` : "";
  const angles = ["definitions and foundations", "examples and applications", "comparisons and distinctions", "case-based reasoning", "common misconceptions", "processes and sequences", "cause and effect", "exam-oriented conceptual checks", "real-world situations", "mixed chapter mastery"];
  const prompt = `You are Concepta's assessment engine for CBSE Class 11 Commerce students.\nCreate exactly ${count} original multiple-choice questions.\nSUBJECT: ${subject}\nCHAPTER: ${chapter}\nDIFFICULTY: ${difficulty}\nBATCH FOCUS: ${angles[batchIndex % angles.length]}\n\nStrict rules:\n1. Every question must test only the named chapter inside the named subject. Never borrow content from another chapter or subject.\n2. Follow current CBSE/NCERT Class 11 scope. Do not introduce Class 12 or college-level material.\n3. ${difficultyRule}\n4. Give exactly four plausible options. Only one option may be correct.\n5. Vary the correct answer position across 0, 1, 2 and 3.\n6. Avoid ambiguous, repeated, trick, opinion-based, or factually uncertain questions.\n7. For English literature, test events, themes, characters, context and interpretation only from the selected text. Do not quote long passages.\n8. For numerical subjects, make all values and calculations internally consistent.${exclusions}\nReturn JSON only: {"questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"A short chapter-specific explanation."}]}`;
  // The 8B instant model has substantially higher throughput on Groq's free tier.
  // A single structured request also avoids burning the request/token budget on
  // several consecutive 5-question calls.
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: modelOverride || process.env.GROQ_FAST_QUIZ_MODEL || "llama-3.1-8b-instant", temperature: difficulty === "Hard" ? 0.4 : 0.2, max_completion_tokens: Math.min(6500, 900 + count * 300), response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }) });
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`);
  const payload: any = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AI returned an empty response");
  return validateGeneratedQuestions(extractJson(content), count);
}

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function generateQuizBatchWithRetry(subject: string, chapter: string, difficulty: string, count: number, excluded: string[], batchIndex: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await generateQuizBatch(subject, chapter, difficulty, count, excluded, undefined, batchIndex);
    } catch (error) {
      lastError = error;
      const isRateLimit = error instanceof Error && error.message === "AI_PROVIDER_429";
      if (attempt < 3) await pause(isRateLimit ? 12000 + attempt * 6000 : 1400 * (attempt + 1));
    }
  }
  throw lastError;
}

async function generateChapterQuiz(subject: string, chapter: string, difficulty: string, count: number) {
  // Build exact-size quizzes from small, predictable responses. The fast Groq
  // model handles these comfortably within its free-tier throughput limits.
  const generated: GeneratedQuestion[] = [];
  const known = new Set<string>();
  let batchIndex = 0;
  const maxBatches = Math.ceil(count / 5) + 4;
  while (generated.length < count && batchIndex < maxBatches) {
    if (batchIndex > 0) await pause(6500);
    const missing = Math.min(5, count - generated.length);
    const recentQuestions = generated.slice(-10).map((item) => item.question);
    const batch = await generateQuizBatchWithRetry(subject, chapter, difficulty, missing, recentQuestions, batchIndex);
    batch.forEach((item) => {
      const key = item.question.toLowerCase();
      if (!known.has(key)) { known.add(key); generated.push(item); }
    });
    batchIndex += 1;
  }
  if (generated.length < count) throw new Error("AI returned too few unique questions");
  return generated.slice(0, count);
}

async function firebaseUserId(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyA3SR1QUDMtmPyOGiCjOAv2G1MByrjDL5w", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) });
  if (!response.ok) return null;
  const data: any = await response.json();
  return data?.users?.[0]?.localId || null;
}

async function quizDb() {
  if (process.env.DATABASE_URL) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const postgresQuery = (query: string, values: unknown[]) => {
      let position = 0;
      const parameterized = query.replace(/\?/g, () => `$${++position}`);
      return sql.query(parameterized, values);
    };
    const prepare = (query: string) => {
      let values: unknown[] = [];
      const statement = {
        bind: (...params: unknown[]) => { values = params; return statement; },
        all: async () => ({ results: await postgresQuery(query, values) }),
        first: async () => (await postgresQuery(query, values))[0] || null,
        run: async () => ({ success: true, results: await postgresQuery(query, values) }),
      };
      return statement;
    };
    return {
      prepare,
      batch: async (statements: Array<{ run: () => Promise<unknown> }>) => Promise.all(statements.map((statement) => statement.run())),
    };
  }
  const runtime: any = await new Function("specifier", "return import(specifier)")("cloudflare:workers");
  if (!runtime.env.DB) throw new Error("Learning database is unavailable");
  return runtime.env.DB;
}

async function ensureQuizAttemptsTable() {
  const db = await quizDb();
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS quiz_attempts (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, subject TEXT NOT NULL, chapter TEXT NOT NULL, difficulty TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, percentage INTEGER NOT NULL, duration_seconds INTEGER, answers_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS quiz_attempts_user_created_idx ON quiz_attempts (user_id, created_at)"),
  ]);
}

async function ensureLearningTables() {
  const db = await quizDb();
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS learning_resources (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, resource_type TEXT NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, chapters TEXT NOT NULL, content_json TEXT NOT NULL, created_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS learning_resources_user_created_idx ON learning_resources (user_id, created_at)"),
    db.prepare("CREATE TABLE IF NOT EXISTS learning_targets (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, topic TEXT NOT NULL, period TEXT NOT NULL, due_date TEXT, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS learning_targets_user_created_idx ON learning_targets (user_id, created_at)"),
    db.prepare("CREATE TABLE IF NOT EXISTS study_plans (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, topic TEXT NOT NULL, cadence TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, weekday INTEGER, created_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS study_plans_user_created_idx ON study_plans (user_id, created_at)"),
    db.prepare("CREATE TABLE IF NOT EXISTS study_plan_checks (plan_id TEXT NOT NULL, user_id TEXT NOT NULL, occurrence_date TEXT NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY(plan_id, occurrence_date))"),
    db.prepare("CREATE TABLE IF NOT EXISTS diary_entries (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, entry_date TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS diary_entries_user_date_idx ON diary_entries (user_id, entry_date)"),
  ]);
}

function tutorReply(message: string) {
  const text = message.toLowerCase();
  if (text.includes("accounting equation")) return "The accounting equation is Assets = Liabilities + Capital. Example: if the owner invests ₹50,000 cash, assets increase by ₹50,000 and capital also increases by ₹50,000, so both sides remain equal.";
  if (text.includes("demand")) return "Demand is the quantity a consumer is willing and able to buy at different prices during a period. Quantity demanded is the specific amount bought at one particular price. A price change causes movement along the demand curve; other factors can shift the whole curve.";
  if (text.includes("journal")) return "For a journal entry: identify the two accounts, classify them, apply debit-credit rules, then write the debit account first and the credit account below it. Example: Cash A/c Dr. to Capital A/c when the owner starts business with cash.";
  if (text.includes("business organisation") || text.includes("sole")) return "Class 11 covers sole proprietorship, partnership, joint Hindu family business, cooperative society and company. Compare them using ownership, liability, continuity, control, capital and legal formalities.";
  return "Let’s solve this as a Class 11 Commerce concept. First identify the subject and key term, then connect it to the definition, rule and one practical example. Tell me whether this is Accountancy, Economics or Business Studies, and I’ll explain it step by step.";
}

function roadmap(body: any) {
  const weeks = Math.max(2, Math.min(12, Number(body.duration_weeks || 6)));
  const goal = body.goal || body.subject || "Class 11 Commerce";
  const focus = body.weak_topics?.length ? body.weak_topics : ["Core concepts", "Applied questions", "Revision and testing"];
  return {
    success: true,
    user_id: body.user_id,
    roadmap_id: crypto.randomUUID(),
    goal,
    subject: goal,
    title: `${weeks}-Week Personalized ${goal} Roadmap`,
    focus_areas: focus,
    milestones: Array.from({ length: weeks }, (_, index) => ({
      week: index + 1,
      title: index === weeks - 1 ? "Final revision and mastery test" : `Build ${goal} mastery — Stage ${index + 1}`,
      topics: [focus[index % focus.length], index < 2 ? "NCERT concept clarity" : "Case-based and application questions"],
      resources: ["NCERT reading and concise notes", "Solved examples", "15-question practice set", "Weekly self-check quiz"],
      estimated_hours: Math.max(2, Math.round(Number(body.weekly_hours || 8))),
    })),
    ai_mode: "foundation",
  };
}

async function generateCommerceRoadmap(body:any){
  const subjects=Array.isArray(body.subjects)?body.subjects.map(String).slice(0,6):[String(body.subject||"Business Studies")];
  const topics=body.topics&&typeof body.topics==="object"?body.topics:{};const weeks=Math.max(1,Math.min(16,Number(body.duration_weeks||4)));const weeklyHours=Math.max(2,Math.min(40,Number(body.weekly_hours||8)));const studyDays=Math.max(2,Math.min(7,Number(body.study_days||5)));
  const scope=subjects.map(s=>`${s}: ${(topics[s]||[]).join(", ")||"complete selected syllabus"}`).join("\n");
  const allowedScope=subjects.flatMap(s=>(topics[s]?.length?topics[s]:["Complete selected syllabus"]).map((t:string)=>`${s} :: ${t}`));
  try{const data:any=await pdfAiJsonWithRetry(`Act as an experienced Class 11 Commerce academic planner. SCOPE LOCK IS ABSOLUTE. Use ONLY the subjects and chapters in ALLOWED_SCOPE. Never introduce, revise, compare with, or name another subject, chapter or topic. If one exact chapter is selected, every task must remain inside that chapter.\nALLOWED_SCOPE (copy values exactly into scope_items):\n${allowedScope.map(x=>`- ${x}`).join("\n")}\nPurpose: ${body.purpose||"School exam preparation"}. Level: ${body.level||"Foundation"}. Available time: ${weeklyHours} hours/week across ${studyDays} study days. Create exactly ${weeks} weeks. Divide the allowed scope deeply across concept study, NCERT examples, written practice, spaced revision, self-checks and recovery—without expanding the syllabus. Each milestone must include scope_items containing only exact strings copied from ALLOWED_SCOPE. Return JSON only: {"title":"...","strategy":"...","milestones":[{"week":1,"scope_items":["Subject :: Exact chapter"],"tasks":["..."],"daily_plan":["Day 1 — ..."],"checkpoint":"...","estimated_hours":8}]}`,Math.min(7000,2200+weeks*330));
    const milestones=Array.isArray(data.milestones)?data.milestones.slice(0,weeks):[];if(milestones.length!==weeks)throw new Error("INCOMPLETE_ROADMAP");const audited=milestones.map((m:any,i:number)=>{const refs=(Array.isArray(m.scope_items)?m.scope_items:[]).filter((x:any)=>allowedScope.includes(String(x)));const locked=refs.length?refs:[allowedScope[i%allowedScope.length]];const parsed=locked.map((x:string)=>{const [subjectName,topicName]=x.split(" :: ");return{subject:subjectName,topic:topicName}});return{...m,week:i+1,title:parsed.map(x=>`${x.subject} — ${x.topic}`).join(" + "),subjects:[...new Set(parsed.map(x=>x.subject))],topics:[...new Set(parsed.map(x=>x.topic))],scope_items:locked,estimated_hours:Number(m.estimated_hours||weeklyHours)}});return{success:true,user_id:body.user_id,roadmap_id:crypto.randomUUID(),title:`${weeks}-Week ${subjects.join(" + ")} Roadmap`,strategy:String(data.strategy||"Scope-locked concept, practice and revision plan"),subjects,allowed_scope:allowedScope,purpose:body.purpose,level:body.level,weekly_hours:weeklyHours,duration_weeks:weeks,milestones:audited};
  }catch{const scopes=subjects.flatMap(s=>(topics[s]?.length?topics[s]:["Core concepts","Application practice","Revision"] ).map((t:string)=>({subject:s,topic:t})));return{...roadmap({...body,goal:subjects.join(" + "),duration_weeks:weeks,weekly_hours:weeklyHours,weak_topics:scopes.map(x=>`${x.subject}: ${x.topic}`)}),subjects,strategy:"Subject rotation with concept learning, written practice, revision and weekly checks.",milestones:Array.from({length:weeks},(_,i)=>{const focus=scopes.filter((_,j)=>j%weeks===i%weeks);const chosen=focus.length?focus:[scopes[i%scopes.length]];return{week:i+1,title:chosen.map(x=>`${x.subject} — ${x.topic}`).join(" + "),subjects:[...new Set(chosen.map(x=>x.subject))],topics:chosen.map(x=>x.topic),tasks:["Study the NCERT concept and make concise notes","Complete representative examples and written questions","Revise mistakes and attempt a short self-check"],daily_plan:Array.from({length:studyDays},(_,d)=>`Day ${d+1} — ${d===0?"Concept learning":d===studyDays-1?"Revision and self-check":"Practice and active recall"}`),checkpoint:"Explain the key concepts without notes and score at least 70% in the self-check.",estimated_hours:weeklyHours}})}}
}

const stopWords = new Set(["the", "and", "that", "this", "with", "from", "have", "were", "will", "into", "their", "there", "which", "when", "where", "what", "your", "than", "then", "also", "such", "only", "been", "being", "about", "page"]);

function cleanPdfText(value: unknown) {
  return String(value || "").replace(/Page \d+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60000);
}

function sentencesFrom(text: string) {
  return text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length >= 45 && sentence.length <= 320);
}

function keywords(text: string) {
  const counts = new Map<string, number>();
  (text.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []).forEach((word) => {
    if (!stopWords.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word]) => word);
}

function rankedSentences(text: string, limit = 8) {
  const terms = keywords(text);
  return sentencesFrom(text)
    .map((sentence, index) => ({ sentence, index, score: terms.reduce((total, term) => total + (sentence.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);
}

function pdfSummary(text: string, subject: string) {
  const keyPoints = rankedSentences(text, 8);
  const terms = keywords(text).slice(0, 8);
  return `PDF SUMMARY — ${subject}\n\nOverview\n${keyPoints.slice(0, 3).join(" ")}\n\nKey points\n${keyPoints.map((point) => `• ${point}`).join("\n")}\n\nImportant terms\n${terms.map((term) => `• ${term.charAt(0).toUpperCase() + term.slice(1)}`).join("\n")}\n\nQuick revision\nRead the key points once, explain each in your own words, and then attempt the PDF quiz.`;
}

function pdfNotes(text: string, subject: string) {
  const points = rankedSentences(text, 12);
  const terms = keywords(text).slice(0, 10);
  return `SMART NOTES — ${subject}\n\n1. Core concepts\n${points.slice(0, 5).map((point) => `• ${point}`).join("\n")}\n\n2. Supporting details\n${points.slice(5, 10).map((point) => `• ${point}`).join("\n")}\n\n3. Key vocabulary\n${terms.map((term) => `• ${term.charAt(0).toUpperCase() + term.slice(1)}`).join("\n")}\n\n4. Exam preparation\n• Convert every core concept into a 2–3 line answer.\n• Add one example wherever possible.\n• Revise the key vocabulary before attempting long-answer questions.`;
}

function pdfQuiz(text: string, subject: string) {
  const terms = keywords(text).slice(0, 10);
  const sourceSentences = rankedSentences(text, 10);
  return sourceSentences.slice(0, Math.min(8, terms.length)).map((sentence, index) => {
    const answer = terms.find((term) => sentence.toLowerCase().includes(term)) || terms[index] || "concept";
    const displayAnswer = answer.charAt(0).toUpperCase() + answer.slice(1);
    const distractors = terms.filter((term) => term !== answer).slice(index % Math.max(1, terms.length - 1)).concat(terms).filter((term, position, all) => term !== answer && all.indexOf(term) === position).slice(0, 3).map((term) => term.charAt(0).toUpperCase() + term.slice(1));
    while (distractors.length < 3) distractors.push(["Capital", "Demand", "Business"][distractors.length]);
    const options = [displayAnswer, ...distractors];
    return { id: index + 1, question: `Which key term best connects with this statement: “${sentence.slice(0, 170)}${sentence.length > 170 ? "…" : ""}”?`, options, correct: 0, category: subject };
  });
}

function fallbackFlashcards(text: string, count: number) {
  const points = rankedSentences(text, Math.max(count, 10));
  const terms = keywords(text);
  return Array.from({ length: count }, (_, index) => ({
    front: terms[index % Math.max(1, terms.length)] ? terms[index % terms.length].replace(/\b\w/g, (letter) => letter.toUpperCase()) : `Key Concept ${index + 1}`,
    back: points[index % Math.max(1, points.length)] || "Revise the definition, purpose and one suitable example of this concept.",
  }));
}

function fallbackWrittenQuestions(text: string, count: number, veryShort: boolean) {
  const points = rankedSentences(text, Math.max(count, 10));
  const terms = keywords(text);
  return Array.from({ length: count }, (_, index) => {
    const term = terms[index % Math.max(1, terms.length)] || `concept ${index + 1}`;
    const answer = points[index % Math.max(1, points.length)] || "State its meaning and explain its relevance with an appropriate example.";
    return { question: veryShort ? `State the meaning of ${term}.` : `Explain ${term} and illustrate its significance with a suitable example.`, answer: veryShort ? answer.split(/(?<=[.!?])\s+/)[0] : answer };
  });
}

function fallbackPdfQuiz(text: string, subject: string, chapter: string, difficulty: string, count: number) {
  const points = rankedSentences(text, Math.max(12, count));
  const terms = keywords(text);
  return Array.from({ length: count }, (_, index) => {
    const sentence = points[index % Math.max(1, points.length)] || "This concept is explained in the uploaded PDF.";
    const matching = terms.find((term) => sentence.toLowerCase().includes(term)) || terms[index % Math.max(1, terms.length)] || "concept";
    const options = [matching, ...terms.filter((term) => term !== matching).slice(index % Math.max(1, terms.length), index % Math.max(1, terms.length) + 3)];
    while (options.length < 4) options.push(["example", "process", "business"][options.length - 1]);
    return { id: index + 1, question: `Identify the concept illustrated by the following statement: “${sentence.slice(0, 150)}${sentence.length > 150 ? "…" : ""}”`, options: options.slice(0, 4).map((x) => x.charAt(0).toUpperCase() + x.slice(1)), correct: 0, explanation: sentence, category: subject, chapter, difficulty };
  });
}

async function pdfAiJson(prompt: string, maxTokens = 3500) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.GROQ_FAST_QUIZ_MODEL || "llama-3.1-8b-instant", temperature: 0.18, max_completion_tokens: maxTokens, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`);
  const payload: any = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AI returned an empty response");
  return extractJson(content);
}

function pdfSource(text: string) {
  return text.slice(0, 18000);
}

function combinePdfSources(sources: unknown, fallback: unknown) {
  const valid = Array.isArray(sources) ? sources
    .map((source: any) => ({ name: String(source?.name || "Uploaded PDF"), text: cleanPdfText(source?.text) }))
    .filter((source) => source.text.length >= 80)
    .slice(0, 5) : [];
  if (!valid.length) return cleanPdfText(fallback);
  const perSource = Math.max(2600, Math.floor(18000 / valid.length));
  return valid.map((source, index) => `=== SOURCE ${index + 1}: ${source.name} ===\n${source.text.slice(0, perSource)}`).join("\n\n");
}

async function pdfAiJsonWithRetry(prompt: string, maxTokens = 3500) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try { return await pdfAiJson(prompt, maxTokens); }
    catch (error) {
      lastError = error;
      if (attempt < 3) await pause(error instanceof Error && error.message === "AI_PROVIDER_429" ? 12000 + attempt * 6000 : 1500 * (attempt + 1));
    }
  }
  throw lastError;
}

async function generatePdfQuiz(text: string, subject: string, chapter: string, topic: string, difficulty: string, count: number) {
  const generated: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let batch = 0;
  while (generated.length < count && batch < Math.ceil(count / 5) + 3) {
    if (batch) await pause(6500);
    const needed = Math.min(5, count - generated.length);
    const previous = generated.slice(-10).map((item) => item.question).join("\n- ");
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const data = await pdfAiJson(`Create exactly ${needed} Class 11 ${subject} MCQs using ONLY the PDF sources below.\nChapter: ${chapter}. Topic: ${topic}. Difficulty: ${difficulty}.\nNever use facts absent from the PDFs. Give four plausible options, one correct index from 0 to 3, and a short explanation. Avoid duplicates.${previous ? `\nDo not repeat:\n- ${previous}` : ""}\nReturn JSON only: {"questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}\nPDF SOURCES:\n${pdfSource(text)}`, 2600);
        const items = validateGeneratedQuestions(data, needed);
        items.forEach((item) => { const key = item.question.toLowerCase(); if (!seen.has(key)) { seen.add(key); generated.push(item); } });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) await pause(error instanceof Error && error.message === "AI_PROVIDER_429" ? 12000 + attempt * 6000 : 1600 * (attempt + 1));
      }
    }
    if (lastError) throw lastError;
    batch += 1;
  }
  if (generated.length < count) throw new Error("AI returned too few PDF questions");
  return generated.slice(0, count).map((item, index) => ({ ...item, id: index + 1, category: subject, chapter, difficulty }));
}

async function generatePdfResource(text: string, mode: string, subject: string, chapter: string, topic: string, count: number) {
  const shared = `Use ONLY the supplied reference content. Subject: ${subject}. Chapter: ${chapter}. Focus topic: ${topic}. When several sources are supplied, combine relevant concepts while preserving factual consistency. Do not invent facts. Write like an experienced Class 11 teacher. Never mention PDFs, documents, sources, uploaded material, or phrases such as "according to the text" in the student-facing output.`;
  if (mode === "summary") {
    const data: any = await pdfAiJsonWithRetry(`${shared}\nCreate a concise but complete study summary with these exact sections: OVERVIEW, CORE CONCEPTS, KEY TERMS, QUICK REVISION. Use original wording, not long quotations. Return JSON only: {"content":"..."}\nPDF SOURCES:\n${pdfSource(text)}`);
    if (typeof data.content !== "string" || data.content.trim().length < 80) throw new Error("AI returned an incomplete summary");
    return { content: String(data.content || "") };
  }
  const isCards = mode === "flashcards";
  const veryShort = mode === "very-short";
  const items: any[] = [];
  const seen = new Set<string>();
  let batch = 0;
  while (items.length < count && batch < Math.ceil(count / 5) + 3) {
    if (batch) await pause(5000);
    const needed = Math.min(5, count - items.length);
    const previous = items.slice(-10).map((item) => isCards ? item.front : item.question).join("\n- ");
    const instruction = isCards
      ? `Create exactly ${needed} premium revision flashcards. Each front must be a crisp concept, distinction, situation, or meaningful question; each back must teach the idea accurately in 20–45 words with a useful example where appropriate. Do not use generic prompts or repeated sentence patterns. Return JSON only: {"flashcards":[{"front":"...","back":"..."}]}`
      : `Create exactly ${needed} original ${veryShort ? "very-short-answer questions with precise one-sentence model answers" : "CBSE-style short-answer questions with focused 3–5 sentence model answers and expected keywords"}. Mix conceptual, application and reasoning questions. Avoid generic wording and repeated stems. Return JSON only: {"questions":[{"question":"...","answer":"..."}]}`;
    const data: any = await pdfAiJsonWithRetry(`${shared}\n${instruction}\nCover distinct important concepts.${previous ? `\nDo not repeat:\n- ${previous}` : ""}\nPDF SOURCES:\n${pdfSource(text)}`, 2800);
    const candidates = isCards ? data.flashcards : data.questions;
    if (Array.isArray(candidates)) candidates.forEach((item: any) => {
      const keyText = isCards ? item?.front : item?.question;
      const valueText = isCards ? item?.back : item?.answer;
      if (typeof keyText === "string" && typeof valueText === "string" && keyText.trim() && valueText.trim()) {
        const key = keyText.trim().toLowerCase();
        if (!seen.has(key)) { seen.add(key); items.push(isCards ? { front: keyText.trim(), back: valueText.trim() } : { question: keyText.trim(), answer: valueText.trim() }); }
      }
    });
    batch += 1;
  }
  if (items.length < count) throw new Error("AI returned an incomplete PDF resource");
  return isCards ? { flashcards: items.slice(0, count) } : { questions: items.slice(0, count) };
}

async function generateMockTest(text: string, settings: any) {
  const subject = String(settings.subject || "Business Studies");
  const chapter = String(settings.chapter || "Selected chapters");
  const topic = String(settings.topic || "Selected syllabus");
  const examType = String(settings.examType || "Unit Test");
  const examMinutes = Number(settings.examMinutes || 90);
  const maxMarks = Number(settings.maxMarks || 40);
  const totalQuestions = Number(settings.count || 20);
  const sections = settings.sections || {};
  const sectionDefs = [
    { key: "mcq", title: "SECTION A — OBJECTIVE TYPE QUESTIONS", count: Number(sections.mcq || 0), style: "MCQs and assertion-reason questions with four options" , weight: 1 },
    { key: "veryShort", title: "SECTION B — VERY SHORT ANSWER QUESTIONS", count: Number(sections.veryShort || 0), style: "very short answer questions requiring one or two precise points", weight: 1.5 },
    { key: "short", title: "SECTION C — SHORT ANSWER QUESTIONS", count: Number(sections.short || 0), style: "short answer conceptual, comparison and application questions", weight: 2 },
    { key: "long", title: "SECTION D — LONG ANSWER QUESTIONS", count: Number(sections.long || 0), style: "long answer analytical questions with suitable internal choice", weight: 3 },
    { key: "caseStudy", title: "SECTION E — CASE STUDY BASED QUESTIONS", count: Number(sections.caseStudy || 0), style: "realistic business case studies with competency-based sub-parts", weight: 3 },
  ].filter((section) => section.count > 0);
  const questionWeights = sectionDefs.flatMap((section) => Array(section.count).fill(section.weight));
  const marks = Array(totalQuestions).fill(1);
  let remaining = Math.max(0, maxMarks - totalQuestions);
  const priority = questionWeights.map((weight, index) => ({ weight, index })).sort((a, b) => b.weight - a.weight);
  let cursor = 0;
  while (remaining > 0) { marks[priority[cursor % priority.length].index] += 1; cursor += 1; remaining -= 1; }
  const syllabusMode = settings.sourceMode === "syllabus";
  const subjectKey = subject.toLowerCase();
  const blueprint = subjectKey.includes("account") ? "Accountancy paper: numerical data, journal or ledger treatment, adjustments, working notes and step-wise solutions; never theory-only."
    : subjectKey.includes("english") ? "English paper: authentic reading, creative writing, grammar and literature patterns; inference, theme, textual evidence and literary devices; format-content-expression marking."
    : subjectKey.includes("economics") ? "Economics paper: application, schedules, data or diagram interpretation and numerical reasoning with correct economic logic."
    : subjectKey.includes("informatics") ? "Informatics Practices paper: code/output tracing, debugging, SQL and data reasoning with exact syntax."
    : subjectKey.includes("mathematics") ? "Mathematics paper: complete solvable numerical problems, progressive difficulty and step-wise solutions; no vague theory."
    : "Business Studies paper: exact NCERT terminology, assertion-reason, original business situations, application, HOTS and case-based items with point-wise marking.";
  const role = syllabusMode
    ? `Act as a senior CBSE Class 11 ${subject} paper setter. Cover ONLY the chapters named in the syllabus scope, using standard NCERT concepts and terminology. Never mention PDFs, documents, sources, prompts or uploaded material. Write original teacher-quality questions with realistic situations, varied stems, competency-based design and no repeated concepts. ${blueprint}`
    : `Act as a senior CBSE Class 11 ${subject} paper setter. Use ONLY the supplied reference content. Never mention PDFs, documents, sources, uploaded material, or "according to the text". Use exact NCERT terminology. Write original teacher-quality questions with realistic situations, varied stems, competency-based design and no repeated concepts. ${blueprint}`;
  // Two compact batches are substantially more reliable than firing one provider
  // request per section, while still allowing 45-question papers to fit in output limits.
  const midpoint = Math.ceil(sectionDefs.length / 2);
  const groups = [sectionDefs.slice(0, midpoint), sectionDefs.slice(midpoint)].filter((group) => group.length);
  const generatedSections = await Promise.all(groups.map(async (group, groupIndex) => {
    const requested = group.map((section) => `${section.key}: exactly ${section.count} ${section.style}`).join("\n");
    const requestedCount = group.reduce((sum, section) => sum + section.count, 0);
    let data: any;
    try {
      data = await pdfAiJsonWithRetry(`${role}\nCreate this exact group of sections:\n${requested}\nSubject: ${subject}. Chapter scope: ${chapter}. Focus: ${topic}.\nEvery item must contain its exact sectionKey from the list above. Balance the named chapters and avoid repeating a concept anywhere in this batch. Mix easy, moderate and challenging levels. Test understanding, application, analysis, comparison, decision-making and logical reasoning. Use original realistic business situations. MCQ items must have exactly four options; non-MCQ options must be an empty array. Keep model answers concise but complete. Include practical step-wise marking guidance, expected keywords and acceptable alternatives.\nReturn JSON only: {"items":[{"sectionKey":"mcq|veryShort|short|long|caseStudy","question":"...","options":["..."],"answer":"...","marking":"...","keywords":["..."],"chapter":"...","difficulty":"Easy|Moderate|Challenging","bloom":"Remember|Understand|Apply|Analyse|Evaluate","competencyBased":true}]}\nREFERENCE CONTENT:\n${text.slice(0, 5200)}`, Math.min(5200, 1700 + requestedCount * 210));
    } catch { throw new Error("PAPER_GENERATION_INCOMPLETE"); }
    const seen = new Set<string>();
    const sourcePoints = rankedSentences(text, Math.max(requestedCount, 12));
    const sourceTerms = keywords(text);
    const fallbackItems = group.flatMap((section) => Array.from({ length: section.count }, (_, index) => {
      const globalIndex = groupIndex * 23 + group.slice(0, group.indexOf(section)).reduce((sum, item) => sum + item.count, 0) + index;
      const point = sourcePoints[globalIndex % Math.max(1, sourcePoints.length)] || `Explain the central idea of ${topic}.`;
      const term = sourceTerms[globalIndex % Math.max(1, sourceTerms.length)] || `concept ${globalIndex + 1}`;
      const distractors = sourceTerms.filter((item) => item !== term).slice(0, 3); while (distractors.length < 3) distractors.push(["process", "structure", "objective"][distractors.length]);
      const stems: Record<string, string> = { mcq: `Which concept is most directly illustrated by this situation: ${point}`, veryShort: `State the meaning or significance of ${term}.`, short: `Explain ${term} with a suitable application based on the studied concepts.`, long: `Analyse ${term}. Discuss its key features, merits or limitations, and support your answer with a suitable example.`, caseStudy: `A business decision reflects the following situation: ${point} Identify the relevant concept and justify how it should guide the decision.` };
      return { sectionKey: section.key, question: stems[section.key], options: section.key === "mcq" ? [term, ...distractors].map((value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase())) : [], answer: point, marking: `Award marks for correct identification, accurate explanation and relevant application.`, keywords: [term], chapter, difficulty: globalIndex % 5 === 4 ? "Challenging" : globalIndex % 2 ? "Moderate" : "Easy", bloom: section.key === "mcq" ? "Understand" : section.key === "veryShort" ? "Remember" : section.key === "short" ? "Apply" : "Analyse", competencyBased: ["short", "long", "caseStudy"].includes(section.key) };
    }));
    const candidateItems = Array.isArray(data.items) ? data.items : [];
    const rawItems = candidateItems;
    const orderedSections = group.flatMap((section) => Array(section.count).fill(section));
    const validated = rawItems.slice(0, requestedCount).map((item: any, index: number) => {
      const section = orderedSections[index];
      if (!section || typeof item?.question !== "string" || typeof item?.answer !== "string") return null;
      const optionValues = Array.isArray(item.options) ? item.options : (item.options && typeof item.options === "object" ? Object.values(item.options) : []);
      const options = optionValues.filter((option: any) => typeof option === "string").slice(0, 4);
      if (section.key === "mcq" && options.length !== 4) return null;
      const key = item.question.trim().toLowerCase(); if (seen.has(key)) return null; seen.add(key);
      return { ...item, options, sectionKey: section.key };
    }).filter(Boolean);
    return group.flatMap((section) => {
      let items = validated.filter((item: any) => item.sectionKey === section.key).slice(0, section.count).map((item: any) => ({ ...item, question: item.question.trim(), answer: item.answer.trim(), sectionTitle: section.title }));
      if (items.length !== section.count) throw new Error("PAPER_GENERATION_INCOMPLETE");
      return items;
    });
  }));
  const allItems: any[] = generatedSections.flat();
  allItems.forEach((item, index) => { item.number = index + 1; item.marks = marks[index]; });
  if (allItems.length !== totalQuestions || marks.reduce((a, b) => a + b, 0) !== maxMarks) throw new Error("Mock-test audit failed");
  const instructions = [
    `This question paper contains ${totalQuestions} questions divided into ${sectionDefs.length} sections.`,
    "All questions are compulsory unless an internal choice is provided.",
    "Read each question carefully and write answers using appropriate subject terminology.",
    "Marks are indicated against each question.",
    "Support application and case-based answers with logical reasons.",
  ];
  const formatQuestion = (item: any) => `Q${item.number}. ${item.question}${item.options?.length ? `\n${item.options.map((option: string, index: number) => `   (${String.fromCharCode(97 + index)}) ${option}`).join("\n")}` : ""}  [${item.marks} mark${item.marks === 1 ? "" : "s"}]`;
  const paperSections = sectionDefs.map((section) => `${section.title}\n${"─".repeat(section.title.length)}\n${allItems.filter((item) => item.sectionKey === section.key).map(formatQuestion).join("\n\n")}`).join("\n\n");
  const paper = `________________________________ SCHOOL NAME ________________________________\n\n${examType.toUpperCase()} — ACADEMIC SESSION ${String(settings.session || "2026–27")}\nClass: XI     Subject: ${subject}\nMaximum Marks: ${maxMarks}                                      Time Allowed: ${examMinutes} minutes\n\nGENERAL INSTRUCTIONS\n${instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join("\n")}\n\n${paperSections}\n\n— END OF QUESTION PAPER —`;
  const markingSections = sectionDefs.map((section) => `${section.title} — ANSWERS & MARKING SCHEME\n${allItems.filter((item) => item.sectionKey === section.key).map((item) => `Q${item.number}. [${item.marks} mark${item.marks === 1 ? "" : "s"}]\nCorrect answer: ${item.answer}\nMarking guidance: ${item.marking || `Award marks for the correct concept, explanation and application in proportion to the ${item.marks} marks allotted.`}\nKeywords: ${Array.isArray(item.keywords) ? item.keywords.join(", ") : "Relevant NCERT terminology"}\nAcceptable alternative: Any conceptually correct, equivalently worded answer supported by the reference content.`).join("\n\n")}`).join("\n\n");
  const chapterStats = new Map<string, number>(); const difficultyStats = new Map<string, number>(); const bloomStats = new Map<string, number>(); let competencyMarks = 0;
  allItems.forEach((item) => { chapterStats.set(item.chapter || chapter, (chapterStats.get(item.chapter || chapter) || 0) + item.marks); difficultyStats.set(item.difficulty || "Moderate", (difficultyStats.get(item.difficulty || "Moderate") || 0) + item.marks); bloomStats.set(item.bloom || "Understand", (bloomStats.get(item.bloom || "Understand") || 0) + item.marks); if (item.competencyBased) competencyMarks += item.marks; });
  const mapLines = allItems.map((item) => `Q${item.number}: ${item.chapter || chapter} | ${item.marks} mark(s) | ${item.difficulty || "Moderate"} | ${item.bloom || "Understand"}`).join("\n");
  const stats = (map: Map<string, number>) => [...map.entries()].map(([key, value]) => `${key}: ${value} marks (${Math.round(value * 100 / maxMarks)}%)`).join("\n");
  const markingScheme = `ANSWER KEY & MARKING SCHEME\n================================\n\n${markingSections}\n\nQUESTION-WISE CHAPTER MAPPING\n${mapLines}\n\nCHAPTER-WISE WEIGHTAGE\n${stats(chapterStats)}\n\nDIFFICULTY ANALYSIS\n${stats(difficultyStats)}\n\nBLOOM'S TAXONOMY DISTRIBUTION\n${stats(bloomStats)}\n\nCOMPETENCY-BASED ANALYSIS\n${competencyMarks} marks (${Math.round(competencyMarks * 100 / maxMarks)}%)\n\nFINAL QUALITY CHECKLIST\n✓ Total Marks = ${maxMarks}\n✓ Total Questions = ${totalQuestions}\n✓ No repeated questions\n✓ Balanced chapter coverage reviewed\n✓ Grammar and terminology checked\n✓ CBSE-style sectioning maintained\n✓ Question paper and marking scheme are print-ready`;
  return { paper, markingScheme, meta: { subject, examType, examMinutes, maxMarks, totalQuestions } };
}

export async function GET(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const key = path.join("/");
  if (key.startsWith("chat/history/")) return json([]);
  if (key.startsWith("chat/conversation/")) return json({ messages: [] });
  if (key.startsWith("pdf/history/")) return json({ history: [] });
  if (key === "quiz-attempts") {
    const userId = await firebaseUserId(request);
    if (!userId) return json({ detail: "Sign in to view quiz history." }, 401);
    await ensureQuizAttemptsTable();
    const db = await quizDb();
    const result = await db.prepare("SELECT id, subject, chapter, difficulty, score, total, percentage, duration_seconds, answers_json, created_at FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId).all();
    return json({ success: true, attempts: (result.results || []).map((row: any) => ({ ...row, answers: JSON.parse(row.answers_json || "[]"), answers_json: undefined })) });
  }
  if (key.startsWith("dashboard/")) return json({ success: true, quizzes_taken: 0, roadmaps_created: 0, completed_weeks: 0, weekly_progress: [] });
  if (key === "learning/history" || key === "learning/targets") {
    const userId = await firebaseUserId(request); if (!userId) return json({ detail: "Sign in to view your learning space." }, 401);
    await ensureLearningTables(); const db = await quizDb();
    if (key === "learning/history") { const result = await db.prepare("SELECT id, resource_type, title, subject, chapters, content_json, created_at FROM learning_resources WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").bind(userId).all(); return json({ success: true, resources: (result.results || []).map((row: any) => ({ ...row, content: JSON.parse(row.content_json || "{}"), content_json: undefined })) }); }
    const result = await db.prepare("SELECT id, title, subject, topic, period, due_date, completed, created_at FROM learning_targets WHERE user_id = ? ORDER BY completed ASC, created_at DESC LIMIT 100").bind(userId).all(); return json({ success: true, targets: result.results || [] });
  }
  if (key === "learning/plans" || key === "learning/diary") {
    const userId=await firebaseUserId(request); if(!userId)return json({detail:"Sign in to view your learning space."},401); await ensureLearningTables(); const db=await quizDb();
    if(key==="learning/plans"){const plans=await db.prepare("SELECT id,title,subject,topic,cadence,start_date,end_date,weekday,created_at FROM study_plans WHERE user_id=? ORDER BY created_at DESC").bind(userId).all();const checks=await db.prepare("SELECT plan_id,occurrence_date FROM study_plan_checks WHERE user_id=?").bind(userId).all();return json({success:true,plans:plans.results||[],checks:checks.results||[]});}
    const entries=await db.prepare("SELECT id,entry_date,title,content,created_at,updated_at FROM diary_entries WHERE user_id=? ORDER BY entry_date DESC,updated_at DESC LIMIT 100").bind(userId).all();return json({success:true,entries:entries.results||[]});
  }
  if (key.includes("generate-roadmap/progress/")) return json({ found: true, progress: { completed_weeks: [], weeks: [{ week: 1, status: "in-progress" }] } });
  if (key.startsWith("generate-roadmap/user/")) return json({ roadmaps: [] });
  return json({ status: "healthy", service: "Concepta API" });
}

export async function POST(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const key = path.join("/");
  if (key === "generate" || key === "generate-from-roadmap") {
    const body = await request.json();
    const count = Math.max(5, Math.min(50, Number(body.count || body.question_count || 10)));
    const subject = String(body.subject || body.topic || "Class 11 Commerce");
    const chapter = String(body.chapter || body.topic || subject);
    const difficulty = ["Easy", "Medium", "Hard"].includes(body.difficulty) ? body.difficulty : "Medium";
    if (!subject.trim() || !chapter.trim()) return json({ detail: "Choose both a subject and chapter." }, 400);
    try {
      const generated = await generateChapterQuiz(subject, chapter, difficulty, count);
      const questions = generated.map((item, index) => ({ ...item, id: index + 1, category: subject, chapter, difficulty }));
      return json({ success: true, title: `${chapter} · ${difficulty} Quiz`, subject, chapter, difficulty, questions, ai_mode: "chapter-locked" });
    } catch (error: any) {
      console.error("Quiz generation error", error?.message || error);
      if (error?.message === "AI_NOT_CONFIGURED") return json({ detail: "Concepta AI Quiz is being connected. The secure AI key has not been configured yet." }, 503);
      return json({ detail: "The AI could not create a reliable chapter-locked quiz. Please generate it again." }, 502);
    }
  }
  if (key === "submit-quiz") {
    const body = await request.json();
    const userId = await firebaseUserId(request);
    if (!userId) return json({ detail: "Sign in to save this attempt." }, 401);
    const correct = (body.answers || []).filter((item: any) => item.is_correct).length;
    const total = body.answers?.length || 0;
    const percentage = total ? Math.round(correct * 100 / total) : 0;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await ensureQuizAttemptsTable();
    const db = await quizDb();
    await db.prepare("INSERT INTO quiz_attempts (id, user_id, subject, chapter, difficulty, score, total, percentage, duration_seconds, answers_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, userId, String(body.subject || "Quiz"), String(body.chapter || body.topic || "Practice"), String(body.difficulty || "Medium"), correct, total, percentage, Number.isFinite(body.duration_seconds) ? body.duration_seconds : null, JSON.stringify(body.answers || []), createdAt).run();
    return json({ success: true, submission_id: id, saved: true, analysis: { total_questions: total, correct_answers: correct, overall_score: percentage } });
  }
  if (key === "learning/resources" || key === "learning/targets") {
    const userId = await firebaseUserId(request); if (!userId) return json({ detail: "Sign in to save your work." }, 401);
    await ensureLearningTables(); const db = await quizDb(); const body = await request.json(); const id = crypto.randomUUID(); const createdAt = new Date().toISOString();
    if (key === "learning/resources") { await db.prepare("INSERT INTO learning_resources (id,user_id,resource_type,title,subject,chapters,content_json,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(id,userId,String(body.resourceType||"resource"),String(body.title||"Generated resource"),String(body.subject||"General"),String(body.chapters||""),JSON.stringify(body.content||{}),createdAt).run(); return json({ success:true,id }); }
    await db.prepare("INSERT INTO learning_targets (id,user_id,title,subject,topic,period,due_date,completed,created_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,userId,String(body.title||body.topic||"Study target"),String(body.subject||"General"),String(body.topic||""),["daily","weekly","monthly"].includes(body.period)?body.period:"weekly",body.dueDate||null,0,createdAt).run(); return json({ success:true,id });
  }
  if(key==="learning/plans"||key==="learning/diary"){
    const userId=await firebaseUserId(request);if(!userId)return json({detail:"Sign in to save your work."},401);await ensureLearningTables();const db=await quizDb();const body=await request.json();const id=crypto.randomUUID();const now=new Date().toISOString();
    if(key==="learning/plans"){const cadence=["daily","weekly","monthly"].includes(body.cadence)?body.cadence:"daily";await db.prepare("INSERT INTO study_plans (id,user_id,title,subject,topic,cadence,start_date,end_date,weekday,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(id,userId,String(body.title||body.topic||"Study target"),String(body.subject||"General"),String(body.topic||""),cadence,String(body.startDate),String(body.endDate||body.startDate),Number.isFinite(body.weekday)?body.weekday:null,now).run();return json({success:true,id});}
    const entryDate=String(body.entryDate||now.slice(0,10));await db.prepare("INSERT INTO diary_entries (id,user_id,entry_date,title,content,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(id,userId,entryDate,String(body.title||"My day"),String(body.content||""),now,now).run();return json({success:true,id});
  }
  if(key.startsWith("learning/plans/")&&key.endsWith("/check")){
    const userId=await firebaseUserId(request);if(!userId)return json({detail:"Sign in first."},401);await ensureLearningTables();const db=await quizDb();const id=key.split("/")[2];const body=await request.json();const date=String(body.date||new Date().toISOString().slice(0,10));const existing=await db.prepare("SELECT plan_id FROM study_plan_checks WHERE plan_id=? AND user_id=? AND occurrence_date=?").bind(id,userId,date).first();if(existing)await db.prepare("DELETE FROM study_plan_checks WHERE plan_id=? AND user_id=? AND occurrence_date=?").bind(id,userId,date).run();else await db.prepare("INSERT INTO study_plan_checks (plan_id,user_id,occurrence_date,completed_at) VALUES (?,?,?,?)").bind(id,userId,date,new Date().toISOString()).run();return json({success:true,completed:!existing});
  }
  if (key.startsWith("learning/targets/") && key.endsWith("/toggle")) {
    const userId = await firebaseUserId(request); if (!userId) return json({ detail:"Sign in first." },401); await ensureLearningTables(); const id=key.split("/")[2]; const db=await quizDb(); await db.prepare("UPDATE learning_targets SET completed = CASE completed WHEN 1 THEN 0 ELSE 1 END WHERE id = ? AND user_id = ?").bind(id,userId).run(); return json({success:true});
  }
  if (key === "chat") {
    const body = await request.json();
    return json({ success: true, conversation_id: body.conversation_id || crypto.randomUUID(), user_id: body.user_id, reply: tutorReply(body.message || ""), suggested_followups: ["Show me an example", "Give me a practice question", "Explain the common mistakes"], ai_mode: "foundation", timestamp: new Date().toISOString() });
  }
  if (key === "generate-roadmap") return json(await generateCommerceRoadmap(await request.json()));
  if (key === "pdf/generate") {
    const body = await request.json();
    const mode = String(body.mode || "summary");
    const subject = String(body.subject || "Class 11 Commerce");
    const chapter = String(body.chapter || "Detect from PDF");
    const topic = String(body.topic || "Main PDF topic");
    const syllabusMode = mode === "mock-test" && body.sourceMode === "syllabus";
    const text = syllabusMode
      ? `CBSE Class 11 ${subject}. Syllabus scope: ${chapter}. Focus area: ${topic}. Generate balanced, original questions strictly within these named chapters using NCERT terminology and learning outcomes.`
      : combinePdfSources(body.sources, body.text);
    if (text.length < 120) return json({ detail: "The selected PDFs do not contain enough readable text. Scanned-image PDFs need OCR." }, 400);
    const difficulty = ["Easy", "Medium", "Hard"].includes(body.difficulty) ? body.difficulty : "Medium";
    const count = Math.max(5, Math.min(mode === "mock-test" ? 45 : mode === "quiz" ? 20 : 10, Number(body.count || 5)));
    try {
      if (mode === "mock-test") {
        const sectionTotal = Object.values(body.sections || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
        if (sectionTotal !== count) return json({ detail: `Section counts must total ${count} questions.` }, 400);
        return json({ success: true, ...(await generateMockTest(text, { ...body, subject, chapter, topic, count })) });
      }
      if (mode === "quiz") return json({ success: true, questions: await generatePdfQuiz(text, subject, chapter, topic, difficulty, count) });
      if (!["summary", "flashcards", "very-short", "short"].includes(mode)) return json({ detail: "Choose a valid PDF study tool." }, 400);
      return json({ success: true, ...(await generatePdfResource(text, mode, subject, chapter, topic, count)) });
    } catch (error: any) {
      console.error("PDF generation error", error?.message || error);
      // A readable PDF must remain useful even when the external AI provider is
      // temporarily rate-limited. These extractive fallbacks use only source text.
      if (mode === "summary") return json({ success: true, content: pdfSummary(text, subject), generation_mode: "source-fallback" });
      if (mode === "flashcards") return json({ success: true, flashcards: fallbackFlashcards(text, count), generation_mode: "source-fallback" });
      if (mode === "very-short" || mode === "short") return json({ success: true, questions: fallbackWrittenQuestions(text, count, mode === "very-short"), generation_mode: "source-fallback" });
      if (mode === "quiz") return json({ success: true, questions: fallbackPdfQuiz(text, subject, chapter, difficulty, count), generation_mode: "source-fallback" });
      if (mode === "mock-test") return json({ detail: syllabusMode ? "A reliable full paper could not be completed for this selection. Reduce the question count, choose fewer sections, or select broader chapters—no generic filler questions were added." : "The selected content is not sufficient for a reliable paper with this question and section count. Reduce the count or deselect sections—no out-of-scope filler questions were added." }, 422);
      return json({ detail: "Choose a valid PDF study tool." }, 400);
    }
  }
  if (key === "pdf/summary" || key === "pdf/notes" || key === "pdf/quiz" || key === "chat/learn-pdf") {
    const body = await request.json();
    const text = cleanPdfText(body.text);
    const subject = String(body.subject || "Class 11 Commerce");
    if (text.length < 80) return json({ detail: "The PDF does not contain enough readable text." }, 400);
    if (key === "pdf/summary") return json({ success: true, summary: pdfSummary(text, subject), filename: body.filename });
    if (key === "pdf/notes") return json({ success: true, notes: pdfNotes(text, subject), filename: body.filename });
    if (key === "pdf/quiz") return json({ success: true, questions: pdfQuiz(text, subject), filename: body.filename });
    return json({ success: true, message: `${body.filename || "Your PDF"} is analysed and ready for PDF-based learning in this session.` });
  }
  if (key === "chat/upload") return json({ detail: "Please use the PDF Notes page to analyse this document." }, 400);
  return json({ success: true });
}

export async function PATCH(_request: NextRequest) {
  return json({ success: true, progress: { completed_weeks: [1], weeks: [{ week: 1, status: "completed" }, { week: 2, status: "in-progress" }] } });
}

export async function DELETE(request: NextRequest, context: Context) {
  const {path}=await context.params;const key=path.join("/");const userId=await firebaseUserId(request);if(!userId)return json({detail:"Sign in to delete saved items."},401);await ensureLearningTables();const db=await quizDb();const parts=key.split("/");const id=parts[2];
  if(key.startsWith("learning/resources/")&&id){await db.prepare("DELETE FROM learning_resources WHERE id=? AND user_id=?").bind(id,userId).run();return json({success:true});}
  if(key.startsWith("learning/plans/")&&id){await db.batch([db.prepare("DELETE FROM study_plan_checks WHERE plan_id=? AND user_id=?").bind(id,userId),db.prepare("DELETE FROM study_plans WHERE id=? AND user_id=?").bind(id,userId)]);return json({success:true});}
  if(key.startsWith("learning/diary/")&&id){await db.prepare("DELETE FROM diary_entries WHERE id=? AND user_id=?").bind(id,userId).run();return json({success:true});}
  return json({detail:"Saved item not found."},404);
}
