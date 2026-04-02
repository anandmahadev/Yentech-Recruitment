"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  Shield,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Lock,
  Eye,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { 
  SITUATIONAL_QUESTIONS, 
  DOMAIN_SPECIFIC_QUESTIONS, 
  DOMAIN_CONFIG,
  TEST_DURATION_SECONDS 
} from "@/lib/constants"
import { 
  verifyTestLinkAction, 
  startTestSessionAction, 
  submitTestAnswersAction,
  autoSaveTestAnswersAction
} from "@/app/actions/test-actions"

// ─── Types ───────────────────────────────────────────────────────────────────

type TestState = "verifying" | "welcome" | "instructions" | "running" | "submitting" | "completed" | "error"

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const { linkId } = useParams()
  const router = useRouter()
  const [state, setState] = useState<TestState>("verifying")
  const [errorIcon, setErrorIcon] = useState<any>(XCircle)
  const [errorMessage, setErrorMessage] = useState("")
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const answersRef = useRef<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Update both state (for UI) and ref (for stable submission)
  const handleUpdateAnswers = (id: string, value: string) => {
    const updated = { ...answersRef.current, [id]: value }
    answersRef.current = updated
    setAnswers(updated)
  }
  
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [warningType, setWarningType] = useState<"blur" | "copy-paste">("blur")
  
  // Fullscreen enforcement
  const [showFullScreenOverlay, setShowFullScreenOverlay] = useState(false)
  const fullscreenViolationsRef = useRef(0)
  
  // Sync status
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "saved" | "error">("idle")
  
  // Refs for timer and synchronization
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ─── Initialization ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function verify() {
      const res = await verifyTestLinkAction(linkId as string)
      if (res.success) {
        setSessionData(res.session)
        if (res.alreadyStarted) {
          setTimeLeft(res.remainingSeconds!)
          // Restore previous answers if they exist
          if (res.session.registrations?.answers) {
            setAnswers(res.session.registrations.answers)
            answersRef.current = res.session.registrations.answers
          }
          setState("running")
        } else {
          setState("welcome")
        }
      } else {
        setState("error")
        setErrorMessage(res.error || "Link verification failed.")
        if (res.completed) setErrorIcon(CheckCircle)
      }
    }
    verify()
  }, [linkId])

  // ─── Questions Mapping ───────────────────────────────────────────────────────

  const questions = useMemo(() => {
    if (!sessionData) return []
    
    // Combine situational (0-99) and domain-specific (100+)
    const skipSituational = DOMAIN_CONFIG[sessionData.domain as keyof typeof DOMAIN_CONFIG]?.skipSituational
    const sQs = skipSituational ? [] : SITUATIONAL_QUESTIONS.map((q, i) => ({ id: i, text: q, category: "situational" }))
    const dQs = (DOMAIN_SPECIFIC_QUESTIONS[sessionData.domain] || []).map((q, i) => ({
      id: 100 + i,
      text: q,
      category: "domain",
    }))
    
    return [...sQs, ...dQs]
  }, [sessionData])

  // ─── Test Lifecycle ──────────────────────────────────────────────────────────

  const handleStartTest = async () => {
    setIsLoadingStart(true)
    const res = await startTestSessionAction(linkId as string)
    setIsLoadingStart(false)
    if (res.success) {
      // Enable fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } catch (err) {
        console.error("Fullscreen request failed:", err)
      }
      setState("running")
    } else {
      toast("Failed to start session. Please refresh.")
    }
  }
  const [isLoadingStart, setIsLoadingStart] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (state === "completed" || state === "submitting") return
    
    setState("submitting")
    // Always use Ref to get latest values during background events
    const currentAnswers = answersRef.current
    console.log(`Final submission started for link ${linkId}. Answers:`, currentAnswers)

    const res = await submitTestAnswersAction(linkId as string, currentAnswers)
    if (res.success) {
      setState("completed")
    } else {
      setState("error")
      setErrorMessage(res.error || "Submission failed.")
    }
  }, [linkId, state])

  // ─── Auto-save Logic ────────────────────────────────────────────────────────

  useEffect(() => {
    if (state !== "running") return

    const timer = setTimeout(async () => {
      // Background auto-save every 2 seconds of inactivity
      const currentAnswers = answersRef.current
      console.log(`Auto-saving link ${linkId}... Answers:`, currentAnswers)
      
      setSyncStatus("syncing")
      const res = await autoSaveTestAnswersAction(linkId as string, currentAnswers)
      
      if (!res.success) {
        console.error(`Auto-save FAILED for link ${linkId}:`, res.error)
        setSyncStatus("error")
      } else {
        console.log(`Auto-save SUCCESS for link ${linkId}`)
        setSyncStatus("saved")
        // Reset to idle after a few seconds
        setTimeout(() => setSyncStatus("idle"), 3000)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [answers, state, linkId])

  // ─── Timer Logic ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (state === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state, timeLeft, handleSubmit])

  // ─── Security Logic ──────────────────────────────────────────────────────────

  const violationsRef = useRef(0)

  useEffect(() => {
    if (state !== "running") return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        violationsRef.current += 1
        
        if (violationsRef.current === 1) {
          setWarningType("blur")
          setIsWarningVisible(true)
          toast.warning("First Warning: Please stay on the test screen. Further navigation will auto-submit the test.")
        } else if (violationsRef.current >= 2) {
          toast.error("Second Violation: Submitting test automatically.")
          handleSubmit()
        }
      }
    }

    const handleCopyPaste = (e: any) => {
      e.preventDefault()
      setWarningType("copy-paste")
      setIsWarningVisible(true)
      toast.error("Copy/Paste is restricted.")
      return false
    }

    const handleContextMenu = (e: any) => {
      e.preventDefault()
      return false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12
      if (e.key === "F12") {
        e.preventDefault()
        toast.error("Developer tools are disabled.")
        return false
      }
      // Disable Ctrl+Shift+I/J/C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault()
        toast.error("Inspection tools are disabled.")
        return false
      }
      // Disable Ctrl+U (View Source) and Ctrl+S (Save)
      if (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S")) {
        e.preventDefault()
        toast.error("This action is restricted.")
        return false
      }
    }

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && state === "running") {
        fullscreenViolationsRef.current += 1
        
        if (fullscreenViolationsRef.current === 1) {
          setShowFullScreenOverlay(true)
          toast.warning("First Warning: Please stay in fullscreen mode. One more exit will auto-submit the test.")
        } else if (fullscreenViolationsRef.current >= 2) {
          toast.error("Second Fullscreen Violation: Submitting test automatically.")
          handleSubmit()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("copy", handleCopyPaste)
    document.addEventListener("paste", handleCopyPaste)
    document.addEventListener("cut", handleCopyPaste)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("fullscreenchange", handleFullScreenChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("copy", handleCopyPaste)
      document.removeEventListener("paste", handleCopyPaste)
      document.removeEventListener("cut", handleCopyPaste)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
    }
  }, [state, handleSubmit])

  // ─── Formatting ──────────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  // ─── Renderers ───────────────────────────────────────────────────────────────

  if (state === "verifying") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#00d4ff] mx-auto" />
          <p className="text-[#00d4ff] font-mono tracking-widest text-sm animate-pulse">
            ENCRYPTING SESSION...
          </p>
        </div>
      </div>
    )
  }

  if (state === "error") {
    const Icon = errorIcon || XCircle
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-white/5 bg-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <Icon className="w-8 h-8 text-[#00d4ff]" />
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">Access Denied</h1>
          <p className="text-zinc-500 font-mono text-sm leading-relaxed">{errorMessage}</p>
          <button onClick={() => router.push("/")} className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all">
            Return to Home
          </button>
        </motion.div>
      </div>
    )
  }

  if (state === "welcome") {
    const domain = DOMAIN_CONFIG[sessionData.domain] || { label: sessionData.domain, color: "#00d4ff" }
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full p-8 rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/30">
              <Shield className="w-6 h-6 text-[#00d4ff]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">YENTECH ASSESSMENT</h1>
              <p className="text-xs text-zinc-500 uppercase font-mono tracking-tighter">Security Check Verified</p>
            </div>
          </header>

          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <p className="text-sm text-zinc-400">Candidate: <span className="text-white font-bold">{sessionData.registrations.full_name}</span></p>
              <p className="text-sm text-zinc-400">Domain: <span style={{ color: domain.color }} className="font-bold">{domain.label}</span></p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">Overview</h3>
              <ul className="space-y-3">
                {[
                  "Domain: " + domain.label,
                  "Candidate Verified: " + sessionData.registrations.full_name,
                  "Ready for final briefing protocols.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-xs text-zinc-500">
                    <span className="text-[#00d4ff] font-mono">0{i+1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => setState("instructions")} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              PROCEED TO INSTRUCTIONS <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (state === "instructions") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="max-w-2xl w-full p-8 rounded-3xl border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00d4ff]/10 blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#7c3aed]/10 blur-[100px]" />

          <header className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Assessment Briefing</h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-2 uppercase tracking-[0.3em] opacity-50">Security Protocol Activated</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {[
              { icon: Clock, title: `${TEST_DURATION_SECONDS / 60} Minutes`, desc: "Strict time limit. Auto-submits at 00:00." },
              { icon: Shield, title: "Fullscreen", desc: "Mandatory mode. 2 strikes policy active." },
              { icon: Brain, title: "Focus", desc: "Stay within the test window at all times." },
              { icon: Lock, title: "Secured", desc: "Tab switching & Copy/Paste is DISABLED." },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start hover:bg-white/[0.07] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20 shrink-0">
                  <item.icon className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 mb-10">
             <div className="flex items-center gap-3 mb-2 text-red-500 uppercase tracking-widest font-black text-[10px]">
                <AlertTriangle className="w-4 h-4" />
                Critical Enforcement
             </div>
             <p className="text-[11px] text-zinc-400 leading-relaxed">
                By starting, you agree to enter <span className="text-white font-bold">FULLSCREEN MODE</span>. Navigating away, minimizing the browser, or attempting to use developer tools will trigger an immediate security strike.
             </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setState("welcome")} 
              className="flex-1 py-4 rounded-xl border border-white/10 text-zinc-500 font-bold hover:text-white transition-all text-xs"
            >
              BACK
            </button>
            <button 
              onClick={handleStartTest} 
              disabled={isLoadingStart} 
              className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-[#050508] font-black shadow-xl shadow-[#00d4ff]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isLoadingStart ? <Loader2 className="w-5 h-5 animate-spin" /> : <>START ASSESSMENT <ChevronRight className="w-5 h-5" /></>}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (state === "running" || state === "submitting") {
    const currentQ = questions[currentQuestionIndex]
    const domain = DOMAIN_CONFIG[sessionData.domain] || { color: "#00d4ff" }
    
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col p-4 sm:p-8">
        {/* Sticky Header with Timer */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <Brain className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white">{sessionData.registrations.full_name}</p>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">Recruitment Round 2</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Sync Progress Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg border border-white/5 bg-white/5">
              {syncStatus === "syncing" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#00d4ff]" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Syncing Progress</span>
                </>
              )}
              {syncStatus === "saved" && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Progress Saved</span>
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">Cloud Sync Error</span>
                </>
              )}
              {syncStatus === "idle" && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">Connection Stable</span>
                </>
              )}
            </div>

            <div className={cn(
              "flex items-center gap-4 px-6 py-2 rounded-full border transition-all",
              timeLeft < 60 ? "border-red-500/50 bg-red-500/10 text-red-500" : "border-[#00d4ff]/30 bg-[#00d4ff]/5 text-[#00d4ff]"
            )}>
              <Clock className={cn("w-5 h-5", timeLeft < 60 && "animate-pulse")} />
              <span className="text-xl font-mono font-bold tracking-tighter">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={state === "submitting"} className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50">
            {state === "submitting" ? "FINISHING..." : "FINISH TEST"}
          </button>
        </header>

        <main className="flex-1 mt-24 max-w-3xl mx-auto w-full relative">
          {/* Progress Indicator */}
          <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                    "flex-1 h-1.5 min-w-[20px] rounded-full transition-all duration-300", 
                    i === currentQuestionIndex ? "bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" : 
                    answers[questions[i].id] ? "bg-green-500/50" : "bg-white/10"
                )} 
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl"
            >
              <div className="space-y-4">
                <span 
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{ 
                        background: currentQ.category === 'situational' ? '#00d4ff15' : `${domain.color}15`, 
                        color: currentQ.category === 'situational' ? '#00d4ff' : domain.color,
                        border: `1px solid ${currentQ.category === 'situational' ? '#00d4ff30' : `${domain.color}30`}`
                    }}
                >
                  {currentQ.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {currentQ.text}
                </h2>
              </div>

              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleUpdateAnswers(currentQ.id.toString(), e.target.value)}
                placeholder="Type your response here..."
                className="w-full h-48 sm:h-64 p-6 bg-[#0a0a12] border border-white/5 rounded-xl text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-[#00d4ff]/30 transition-all resize-none shadow-inner"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 p-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <p className="text-xs text-zinc-600 font-mono">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>

                <button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  NEXT <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Security Warning Notification */}
        <AnimatePresence>
          {isWarningVisible && (
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4">
              <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-xl flex items-center gap-4 shadow-2xl">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-500">SECURITY ALERT</p>
                  <p className="text-[10px] text-zinc-300">
                    {warningType === "blur" 
                      ? "Action detected outside test window. This event has been logged." 
                      : "Copying / Pasting is restricted during this assessment."}
                  </p>
                </div>
                <button onClick={() => setIsWarningVisible(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <XCircle className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen Required Overlay */}
        <AnimatePresence>
          {showFullScreenOverlay && !document.fullscreenElement && state === "running" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-[#050508]/95 backdrop-blur-md flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-md space-y-8">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Full Screen Required</h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Exiting fullscreen mode is a security violation. You have <span className="text-red-500 font-bold">one strike remaining</span>. Re-entering fullscreen will allow you to continue.
                  </p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen()
                        setShowFullScreenOverlay(false)
                      }
                    } catch (err) {
                      toast.error("Manual action required: Please use your browser to go fullscreen.")
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-[#050508] font-bold shadow-xl shadow-[#00d4ff]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  RETURN TO FULLSCREEN
                </button>
                <p className="text-[10px] text-zinc-700 font-mono italic">Strike 1 of 2 logged for session: {linkId}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (state === "completed") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8 p-10 rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">Assessment Success</h1>
            <p className="text-zinc-500 text-sm leading-relaxed decoration-zinc-800">
              Your responses have been securely uploaded and encrypted. The results will be reviewed by the YENTECH leadership.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
             <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Session ID</p>
             <p className="text-xs font-mono text-zinc-400 mt-1">{linkId}</p>
          </div>
          <button onClick={() => router.push("/")} className="w-full py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all">
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  return null
}
