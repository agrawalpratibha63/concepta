import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, ChevronDown, ChevronUp, Clock3, FileText, ListChecks, Map, Sparkles, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const tools = [
  { title: 'Ask Concepta Tutor', description: 'Get a clear explanation for any difficult concept.', icon: Bot, path: '/tutor', className: 'dash-tool-teal', label: 'START A CHAT' },
  { title: 'Practice a Quiz', description: 'Choose a topic and test what you understand.', icon: ListChecks, path: '/quiz', className: 'dash-tool-blue', label: 'BEGIN PRACTICE' },
  { title: 'Create PDF Notes', description: 'Turn a chapter PDF into useful revision material.', icon: FileText, path: '/pdf-notes', className: 'dash-tool-coral', label: 'UPLOAD A PDF' },
  { title: 'Build a Roadmap', description: 'Plan what to study next, one week at a time.', icon: Map, path: '/roadmap', className: 'dash-tool-amber', label: 'PLAN MY WEEK' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'
  const [attempts,setAttempts] = useState([])
  const [historyLoading,setHistoryLoading] = useState(true)
  const [openAttempt,setOpenAttempt] = useState('')

  useEffect(()=>{let active=true;const load=async()=>{if(!user){setHistoryLoading(false);return}try{const token=await user.getIdToken();const response=await fetch('/api/v1/quiz-attempts',{headers:{Authorization:`Bearer ${token}`}});const data=await response.json();if(active&&response.ok)setAttempts(data.attempts||[])}catch(error){console.error(error)}finally{if(active)setHistoryLoading(false)}};load();return()=>{active=false}},[user])

  return <div className="product-page dashboard-clean pt-28 pb-20 min-h-screen">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.header initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="dashboard-welcome">
        <div><span className="product-kicker">YOUR LEARNING SPACE</span><h1>Welcome back, {userName}.</h1><p>What would you like to work on today?</p></div>
        <div className="welcome-mark"><Sparkles/></div>
      </motion.header>

      <div className="dashboard-tools">
        {tools.map((tool,index)=>{const Icon=tool.icon;return <motion.div key={tool.title} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.08*index}}>
          <Link to={tool.path} className={`dashboard-tool ${tool.className}`}>
            <div className="dashboard-tool-icon"><Icon/></div>
            <div className="dashboard-tool-copy"><span>{tool.label}</span><h2>{tool.title}</h2><p>{tool.description}</p></div>
            <div className="dashboard-tool-arrow"><ArrowRight/></div>
          </Link>
        </motion.div>})}
      </div>

      <div className="dashboard-note"><div className="note-dot"/><p><strong>Keep it simple:</strong> choose one tool, complete one focused session, then come back for the next step.</p></div>

      <section className="quiz-history-section">
        <div className="quiz-history-head"><div><span className="product-kicker">SAVED PROGRESS</span><h2>Your quiz history</h2><p>Open any attempt to review your answers whenever you want.</p></div><div className="history-count"><Trophy/><strong>{attempts.length}</strong><span>attempts</span></div></div>
        {historyLoading?<div className="history-empty">Loading your saved quizzes…</div>:!attempts.length?<div className="history-empty"><ListChecks/><h3>Your first score will appear here.</h3><p>Complete a quiz and Concepta will save it to your account.</p><Link to="/quiz">Start a quiz <ArrowRight/></Link></div>:<div className="quiz-history-list">{attempts.map(attempt=>{const open=openAttempt===attempt.id;return <article key={attempt.id} className="history-attempt"><button className="history-summary" onClick={()=>setOpenAttempt(open?'':attempt.id)}><div className="history-score" style={{'--score':`${attempt.percentage}%`}}><strong>{attempt.percentage}%</strong></div><div className="history-copy"><span>{attempt.subject} · {attempt.difficulty}</span><h3>{attempt.chapter}</h3><small><Clock3/>{new Date(attempt.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} · {attempt.score}/{attempt.total} correct</small></div>{open?<ChevronUp/>:<ChevronDown/>}</button>{open&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="history-review">{attempt.answers.map((answer,index)=><div key={`${attempt.id}-${index}`} className={answer.is_correct?'saved-correct':'saved-wrong'}><b>{index+1}</b><div><p>{answer.question}</p><small>Your answer: <strong>{answer.selected_option}</strong></small>{!answer.is_correct&&<small>Correct answer: <strong>{answer.correct_option}</strong></small>}{answer.explanation&&<em>{answer.explanation}</em>}</div></div>)}</motion.div>}</article>})}</div>}
      </section>
    </div>
  </div>
}
