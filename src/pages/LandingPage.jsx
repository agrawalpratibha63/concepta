import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, CheckCircle2, FileText, Layers3, ListChecks, Map, MoveUpRight, Sparkles } from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]
const tools = [
  { icon: Bot, number: '01', title: 'Ask', copy: 'Turn a difficult question into a clear conversation.', path: '/tutor', tone: 'ocean' },
  { icon: FileText, number: '02', title: 'Distil', copy: 'Transform long chapters into useful notes.', path: '/pdf-notes', tone: 'coral' },
  { icon: ListChecks, number: '03', title: 'Practise', copy: 'Check understanding with focused quizzes.', path: '/quiz', tone: 'blue' },
  { icon: Map, number: '04', title: 'Progress', copy: 'Know the next best step with a simple roadmap.', path: '/roadmap', tone: 'amber' },
]

function ConceptUniverse() {
  return <div className="concept-universe" aria-hidden="true">
    <div className="universe-ring ring-a"/><div className="universe-ring ring-b"/><div className="universe-ring ring-c"/>
    <motion.div className="core-orb" animate={{rotate:[0,360]}} transition={{duration:22,repeat:Infinity,ease:'linear'}}><div className="core-face">C</div><span/><span/><span/></motion.div>
    <motion.div className="concept-chip chip-one" animate={{y:[0,-16,0],rotate:[-5,-2,-5]}} transition={{duration:5.2,repeat:Infinity,ease:'easeInOut'}}><FileText/><span><small>CHAPTER</small>Smart notes ready</span><CheckCircle2/></motion.div>
    <motion.div className="concept-chip chip-two" animate={{y:[0,13,0],rotate:[6,3,6]}} transition={{duration:6,repeat:Infinity,ease:'easeInOut'}}><Bot/><span><small>TUTOR</small>Explain it simply</span><Sparkles/></motion.div>
    <motion.div className="concept-chip chip-three" animate={{x:[0,10,0],y:[0,-7,0]}} transition={{duration:5.5,repeat:Infinity,ease:'easeInOut'}}><ListChecks/><span><small>PRACTICE</small>8 / 10 correct</span></motion.div>
    <div className="orbit-dot dot-a"/><div className="orbit-dot dot-b"/><div className="orbit-dot dot-c"/>
  </div>
}

export default function LandingPage() {
  return <div className="new-home min-h-screen overflow-hidden">
    <section className="new-hero">
      <div className="hero-noise"/><div className="hero-lines"/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-[1.02fr_.98fr] items-center gap-10 min-h-[820px] pt-24 pb-16">
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.7,ease}} className="hero-editorial">
          <div className="edition-line"><span>CONCEPTA</span><i/><span>LEARNING, REIMAGINED</span></div>
          <h1>Clarity changes<br/><em>everything.</em></h1>
          <p>A focused learning space that helps you understand difficult concepts, practise with purpose, and always know what to do next.</p>
          <div className="hero-actions"><Link to="/signup" className="home-cta">Start your learning space <ArrowRight/></Link><Link to="/tutor" className="home-link">Explore the tutor <MoveUpRight/></Link></div>
          <div className="hero-proof"><div className="proof-stack"><span>C</span><span>11</span><span>AI</span></div><p><strong>One connected workspace</strong><br/>Notes · Tutor · Quizzes · Roadmaps</p></div>
        </motion.div>
        <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{duration:1,delay:.15,ease}}><ConceptUniverse/></motion.div>
      </div>
      <div className="scroll-cue"><span>SCROLL TO EXPLORE</span><i/></div>
    </section>

    <section className="manifesto-section"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="manifesto-index">01 — THE IDEA</div><motion.p initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.7,ease}}>Most learning platforms give you <span>more content.</span><br/>Concepta gives you <em>the next clear step.</em></motion.p></div></section>

    <section className="tools-stage"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="stage-head"><div><span>02 — THE WORKSPACE</span><h2>Four tools.<br/>One learning flow.</h2></div><p>Each tool moves your understanding forward instead of adding more noise.</p></div><div className="editorial-tools">{tools.map((tool,i)=>{const Icon=tool.icon;return <motion.div key={tool.title} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08,duration:.55,ease}}><Link to={tool.path} className={`editorial-tool ${tool.tone}`}><div className="tool-top"><span>{tool.number}</span><Icon/></div><h3>{tool.title}</h3><p>{tool.copy}</p><div className="tool-open">Open tool <ArrowRight/></div></Link></motion.div>})}</div></div></section>

    <section className="flow-section"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center"><div className="flow-copy"><span>03 — HOW IT FEELS</span><h2>Less switching.<br/>More understanding.</h2><p>Move naturally from a doubt to an explanation, then to notes, practice and a plan—without losing context.</p><Link to="/signup" className="home-cta">Create free account <ArrowRight/></Link></div><div className="flow-visual"><div className="flow-line"/>{[['A','Ask a doubt'],['U','Understand'],['P','Practise'],['G','Grow']].map(([letter,label],i)=><motion.div key={letter} className="flow-node" initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.12}}><b>{letter}</b><span>{label}</span><small>0{i+1}</small></motion.div>)}</div></div></section>

    <section className="home-finale"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="finale-card"><Layers3/><div><span>START WITH ONE CONCEPT</span><h2>Your next breakthrough<br/>can begin right now.</h2></div><Link to="/signup">Begin <ArrowRight/></Link></div></div></section>
  </div>
}
