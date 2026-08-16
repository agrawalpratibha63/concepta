import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Clock3, Loader2, RotateCcw, Sparkles, TimerOff, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { commerceSubjects } from '../data/commerceSyllabus'

const API_BASE = '/api/v1'
const difficultyOptions = ['Easy','Medium','Hard']
const questionOptions = [5,10,20,30,40,50]
const timerOptions = [5,10,15,20,30]

function formatTime(seconds) { const mins=Math.floor(seconds/60); return `${String(mins).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}` }

export default function QuizPage() {
  const { user } = useAuth()
  const location = useLocation()
  const pdfQuiz = location.state?.generatedQuiz
  const [subjectId,setSubjectId] = useState('')
  const [chapter,setChapter] = useState('')
  const [difficulty,setDifficulty] = useState('Medium')
  const [count,setCount] = useState(10)
  const [timerEnabled,setTimerEnabled] = useState(false)
  const [timerMinutes,setTimerMinutes] = useState(10)
  const [questions,setQuestions] = useState(pdfQuiz?.questions || [])
  const [title,setTitle] = useState(pdfQuiz?.title || '')
  const [current,setCurrent] = useState(0)
  const [answers,setAnswers] = useState({})
  const [remaining,setRemaining] = useState(location.state?.timeLimit ? location.state.timeLimit*60 : 0)
  const [results,setResults] = useState(false)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')
  const [soundOn,setSoundOn] = useState(true)
  const [reward,setReward] = useState('')
  const [startedAt,setStartedAt] = useState(0)
  const selectedSubject = useMemo(()=>commerceSubjects.find(s=>s.id===subjectId),[subjectId])

  const resetQuiz = () => { setQuestions([]);setTitle('');setCurrent(0);setAnswers({});setResults(false);setRemaining(0) }
  const selectSubject = (id) => { setSubjectId(id);setChapter('') }

  const normalize = (items) => items.map((q,i)=>({ id:q.id||i+1, question:q.question, options:q.options||[], correct:Number.isInteger(q.correct)?q.correct:0, explanation:q.explanation||'', category:q.category||chapter })).filter(q=>q.question&&q.options.length===4)

  const generate = async () => {
    if (!subjectId || !chapter) return
    setLoading(true);setError('')
    try {
      const response=await fetch(`${API_BASE}/generate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user?.uid||user?.email,subject:selectedSubject.name,subject_id:subjectId,chapter,difficulty,count,question_count:count,class_name:'Class 11 Commerce'})})
      if(!response.ok){const failed=await response.json().catch(()=>({}));throw new Error(failed.detail||'Quiz generation failed')}
      const data=await response.json(); const ready=normalize(data.questions||[])
      if(!ready.length) throw new Error('No questions returned')
      setQuestions(ready);setTitle(data.title||`${chapter} Quiz`);setCurrent(0);setAnswers({});setResults(false);setRemaining(timerEnabled?timerMinutes*60:0);setStartedAt(Date.now())
    } catch(error){ console.error(error);setError(error.message||'Quiz could not be generated. Please try again.') } finally { setLoading(false) }
  }

  const submit = async () => {
    setResults(true)
    try { const token=await user?.getIdToken();await fetch(`${API_BASE}/submit-quiz`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({subject:selectedSubject?.name||questions[0]?.category||'PDF Quiz',chapter:chapter||questions[0]?.chapter||title,difficulty, duration_seconds:startedAt?Math.round((Date.now()-startedAt)/1000):null,answers:questions.map((q,i)=>({question_id:String(q.id),question:q.question,selected_option:answers[i]===undefined?'Not answered':q.options[answers[i]],correct_option:q.options[q.correct],is_correct:answers[i]===q.correct,explanation:q.explanation||''}))})}) } catch(error){console.error(error)}
  }

  const celebrateCorrect = () => {
    setReward('Great! You picked the right one ✨')
    setTimeout(()=>setReward(''),1800)
    if(!soundOn) return
    try { const AudioCtx=window.AudioContext||window.webkitAudioContext;const ctx=new AudioCtx();[523.25,659.25,783.99].forEach((frequency,index)=>{const oscillator=ctx.createOscillator();const gain=ctx.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.12,ctx.currentTime+.02+index*.08);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.24+index*.08);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(ctx.currentTime+index*.08);oscillator.stop(ctx.currentTime+.35+index*.08)});setTimeout(()=>ctx.close(),900) } catch(error){console.debug(error)}
    if('speechSynthesis' in window){window.speechSynthesis.cancel();const message=new SpeechSynthesisUtterance('Great! You picked the right one.');message.rate=1.05;message.pitch=1.12;message.volume=.8;window.speechSynthesis.speak(message)}
  }

  const chooseAnswer = (index,q) => { if(answers[current]!==undefined) return;setAnswers({...answers,[current]:index});if(index===q.correct)celebrateCorrect() }

  useEffect(()=>{ if(!timerEnabled&& !location.state?.timeLimit) return; if(!questions.length||results||remaining<=0) return; const id=setInterval(()=>setRemaining(v=>v-1),1000);return()=>clearInterval(id)},[questions.length,results,remaining,timerEnabled,location.state])
  useEffect(()=>{ if(questions.length&&remaining===0&&(timerEnabled||location.state?.timeLimit)&&!results) submit() },[remaining])

  if (questions.length) {
    const score=questions.filter((q,i)=>answers[i]===q.correct).length
    if(results) return <div className="product-page quiz-experience min-h-screen pt-28 pb-20 px-4"><div className="quiz-result max-w-3xl mx-auto"><div className="result-badge"><Trophy/></div><span className="quiz-kicker">QUIZ COMPLETE</span><h1>{score} out of {questions.length}</h1><p>{score/questions.length>=.8?'Excellent understanding. You are ready to move forward.':score/questions.length>=.5?'Good start. Review the explanations and try once more.':'This chapter needs another focused revision.'}</p><div className="score-track"><span style={{width:`${Math.round(score/questions.length*100)}%`}}/></div><div className="result-actions"><button onClick={()=>{setAnswers({});setResults(false);setCurrent(0);setRemaining(timerEnabled?timerMinutes*60:0)}}><RotateCcw/> Try again</button><button onClick={resetQuiz}>Choose another chapter <ArrowRight/></button></div><div className="answer-review">{questions.map((q,i)=><div key={q.id} className={`review-item ${answers[i]===q.correct?'correct':'incorrect'}`}><div><span>{i+1}</span><p>{q.question}</p></div><small>Correct answer: <strong>{q.options[q.correct]}</strong></small></div>)}</div></div></div>
    const q=questions[current]
    return <div className="product-page quiz-experience min-h-screen pt-24 pb-16 px-4"><AnimatePresence>{reward&&<motion.div initial={{opacity:0,y:-20,scale:.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-12}} className="reward-toast"><Trophy/>{reward}</motion.div>}</AnimatePresence><div className="max-w-5xl mx-auto"><div className="quiz-topbar"><button onClick={resetQuiz}><ArrowLeft/> Exit quiz</button><div><span>{title}</span><small>Question {current+1} of {questions.length}</small></div><div className="quiz-actions">{(timerEnabled||location.state?.timeLimit)?<div className={`quiz-timer ${remaining<60?'urgent':''}`}><Clock3/>{formatTime(remaining)}</div>:<div className="untimed-chip"><TimerOff/> Untimed</div>}<button className="sound-toggle" onClick={()=>setSoundOn(v=>!v)} aria-label={soundOn?'Mute rewards':'Turn on reward sounds'}>{soundOn?<Volume2/>:<VolumeX/>}</button></div></div><div className="question-progress"><span style={{width:`${((current+1)/questions.length)*100}%`}}/></div><AnimatePresence mode="wait"><motion.div key={current} initial={{opacity:0,x:25}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-25}} className="question-stage"><span className="question-label">QUESTION {String(current+1).padStart(2,'0')}</span><h1>{q.question}</h1><div className="answer-grid">{q.options.map((option,i)=><button key={option} onClick={()=>chooseAnswer(i,q)} className={`${answers[current]===i?'selected ':''}${answers[current]!==undefined&&i===q.correct?'answer-correct':''}`}><span>{String.fromCharCode(65+i)}</span><p>{option}</p>{answers[current]===i&&<Check/>}</button>)}</div><div className="question-nav"><button disabled={current===0} onClick={()=>setCurrent(v=>v-1)}><ArrowLeft/> Previous</button>{current===questions.length-1?<button disabled={answers[current]===undefined} onClick={submit} className="primary">Submit quiz <CheckCircle2/></button>:<button disabled={answers[current]===undefined} onClick={()=>setCurrent(v=>v+1)} className="primary">Next question <ArrowRight/></button>}</div></motion.div></AnimatePresence></div></div>
  }

  return <div className="product-page quiz-builder min-h-screen pt-28 pb-20 px-4"><div className="max-w-7xl mx-auto"><header className="quiz-builder-head"><div><span className="quiz-kicker">CONCEPTA PRACTICE LAB</span><h1>Build a quiz around<br/><em>what you need to learn.</em></h1><p>Class 11 Commerce · CBSE/NCERT-aligned chapter selection</p></div><div className="builder-step"><Sparkles/><span>Quiz setup</span><b>01</b></div></header>
    <div className="builder-layout"><section className="builder-main"><div className="builder-section"><div className="section-number">01</div><div className="section-content"><h2>Choose your subject</h2><p>Start with the area you want to practise.</p><div className="subject-picker">{commerceSubjects.map(subject=><button key={subject.id} onClick={()=>selectSubject(subject.id)} className={`${subject.color} ${subjectId===subject.id?'active':''}`}><span>{subject.short}</span><div><strong>{subject.name}</strong><small>{subject.description}</small></div>{subjectId===subject.id&&<Check/>}</button>)}</div></div></div>
      <div className={`builder-section ${!selectedSubject?'disabled-section':''}`}><div className="section-number">02</div><div className="section-content"><h2>Choose a chapter</h2><p>{selectedSubject?`${selectedSubject.name} · ${selectedSubject.chapters.length} available chapters`:'Select a subject to see its chapters.'}</p>{selectedSubject&&<div className="chapter-picker">{selectedSubject.chapters.map((item,i)=><button key={item} onClick={()=>setChapter(item)} className={chapter===item?'active':''}><span>{String(i+1).padStart(2,'0')}</span>{item}<ChevronRight/></button>)}</div>}</div></div>
    </section><aside className="quiz-settings"><span className="quiz-kicker">QUIZ SETTINGS</span><h2>Fine-tune practice</h2><label>Difficulty</label><div className="segmented">{difficultyOptions.map(x=><button key={x} onClick={()=>setDifficulty(x)} className={difficulty===x?'active':''}>{x}</button>)}</div><label>Number of questions</label><div className="count-grid">{questionOptions.map(x=><button key={x} onClick={()=>setCount(x)} className={count===x?'active':''}>{x}</button>)}</div><div className="timer-toggle"><div><Clock3/><span><strong>Add a timer</strong><small>Optional focused practice</small></span></div><button role="switch" aria-checked={timerEnabled} onClick={()=>setTimerEnabled(v=>!v)} className={timerEnabled?'on':''}><i/></button></div>{timerEnabled&&<div className="timer-select"><label>Time limit</label><select value={timerMinutes} onChange={e=>setTimerMinutes(Number(e.target.value))}>{timerOptions.map(x=><option key={x} value={x}>{x} minutes</option>)}</select></div>}<div className="setup-summary"><span>Ready to generate</span><p>{selectedSubject?.name||'Choose subject'}<br/>{chapter||'Choose chapter'}</p><small>{difficulty} · {count} questions · {timerEnabled?`${timerMinutes} min`:'No timer'}</small></div>{error&&<div className="quiz-error" role="alert">{error}</div>}<button disabled={!chapter||loading} onClick={generate} className="generate-quiz-btn">{loading?<><Loader2 className="animate-spin"/> Building chapter-locked quiz…</>:<>Generate my quiz <ArrowRight/></>}</button></aside></div>
  </div></div>
}
