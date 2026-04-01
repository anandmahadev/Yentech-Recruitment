"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  LogOut,
  RefreshCw,
  Loader2,
  Brain,
  Code,
  Terminal,
  Zap,
  X,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Clock,
  ExternalLink,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { adminLoginAction, adminLogoutAction, getAdminSessionAction, getRegistrationsAction } from "@/app/actions/auth-actions"
import { generateTestLinkAction, getTestSessionsAction, deleteTestSessionAction, deleteRegistrationAction } from "@/app/actions/admin-actions"
import { toast } from "sonner"
import { SITUATIONAL_QUESTIONS, DOMAIN_SPECIFIC_QUESTIONS } from "@/lib/constants"
import { useMemo } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Registration {
  id: string
  application_id: string
  campus_id: string
  full_name: string
  mobile: string
  email: string
  status: string
  domain: string
  answers: Record<string, string>
  why_choose_you: string
  experience: string | null
  created_at: string
}

interface TestSession {
  id: string
  registration_id: string
  link_id: string
  domain: string
  start_time: string | null
  completed_at: string | null
  expires_at: string
  created_at: string
  registrations?: {
    full_name: string
    email: string
    campus_id: string
    status: string
    answers: Record<string, string>
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "ai-ml": { label: "AI / ML", icon: Brain, color: "#7c3aed" },
  "web-dev": { label: "Web Dev", icon: Code, color: "#0ea5e9" },
  cybersecurity: { label: "Cybersecurity", icon: Terminal, color: "#10b981" },
  graphics: { label: "Graphics / Media", icon: Zap, color: "#f59e0b" },
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await adminLoginAction(password)
      if (res.success) {
        onSuccess()
      } else {
        setError(res.error || "Incorrect password. Access denied.")
      }
    } catch {
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "rgba(10, 10, 15, 0.95)",
            borderColor: "rgba(0, 212, 255, 0.2)",
            boxShadow: "0 0 60px rgba(0, 212, 255, 0.05), 0 0 200px rgba(0, 212, 255, 0.02)",
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#00d4ff]/10 border border-[#00d4ff]/30">
              <Shield className="w-8 h-8 text-[#00d4ff]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-1">Admin Access</h1>
          <p className="text-sm text-center mb-8 text-zinc-500">YENTECH Recruitment Dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-400">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-[#0f0f18] border border-zinc-800 text-white placeholder-zinc-600 outline-none focus:border-[#00d4ff]/50 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 rounded-lg font-semibold text-sm bg-[#00d4ff] text-[#050508] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Access Dashboard
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Assessment Report Overlay ───────────────────────────────────────────

function AssessmentReportOverlay({ 
  candidateName, 
  domain: domainKey, 
  answers, 
  onClose 
}: { 
  candidateName: string; 
  domain: string; 
  answers: Record<string, string>; 
  onClose: () => void 
}) {
  const domain = DOMAIN_CONFIG[domainKey as keyof typeof DOMAIN_CONFIG] || { label: domainKey, color: "#00d4ff" }
  
  const questions = useMemo(() => {
    const skipSituational = DOMAIN_CONFIG[domainKey as keyof typeof DOMAIN_CONFIG]?.skipSituational
    const sQs = skipSituational ? [] : SITUATIONAL_QUESTIONS.map((q, i) => ({ id: i.toString(), text: q, category: "situational" }))
    const dQs = (DOMAIN_SPECIFIC_QUESTIONS[domainKey] || []).map((q, i) => ({
      id: (100 + i).toString(),
      text: q,
      category: "domain",
    }))
    return [...sQs, ...dQs]
  }, [domainKey])

  const stats = {
    total: questions.length,
    answered: Object.values(answers).filter(a => !!a).length,
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <Brain className="w-6 h-6 text-[#00d4ff]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none mb-1">{candidateName}</h2>
              <p className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                <span style={{ color: domain.color }}>{domain.label}</span>
                <span className="opacity-30">|</span>
                <span>Assessment Report</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Progress</p>
              <p className="text-sm font-bold text-white">{stats.answered} / {stats.total} Answered</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 transition-all border border-transparent hover:border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {questions.map((q, idx) => {
            const answer = answers[q.id]
            const isAnswered = !!answer
            
            return (
              <div key={idx} className="group relative">
                {/* Category Badge */}
                <div className="flex items-center gap-3 mb-3">
                   <span className={cn(
                     "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border",
                     q.category === 'situational' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                   )}>
                     {q.category}
                   </span>
                   <span className="text-[10px] text-zinc-700 font-mono">Q#{idx + 1}</span>
                </div>
                
                <div className={cn(
                  "p-5 rounded-2xl transition-all border",
                  isAnswered ? "bg-white/[0.02] border-white/5 group-hover:border-white/10" : "bg-red-500/[0.02] border-red-500/10"
                )}>
                  <h4 className="text-base font-semibold text-white mb-4 leading-relaxed">
                    {q.text}
                  </h4>
                  
                  {isAnswered ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-zinc-300 text-sm leading-loose whitespace-pre-wrap font-sans italic">
                      "{answer}"
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-500/50 italic text-sm py-2">
                       <EyeOff className="w-4 h-4" />
                       No response provided for this question.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
            <p className="text-[10px] text-zinc-600 font-mono">Session ID Encrypted & Time-Stamped</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Registration Row ────────────────────────────────────────────────────────

function RegistrationCard({ 
  reg, 
  onGenerateLink, 
  onDelete,
  onViewReport
}: { 
  reg: Registration; 
  onGenerateLink: (id: string, domain: string) => void;
  onDelete: (id: string) => void;
  onViewReport: (candidateName: string, domain: string, answers: Record<string, string>) => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const domain = DOMAIN_CONFIG[reg.domain] ?? { label: reg.domain, icon: Code, color: "#00d4ff" }
  const DomainIcon = domain.icon

  const handleGenerate = async () => {
    setIsGenerating(true)
    await onGenerateLink(reg.id, reg.domain)
    setIsGenerating(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${reg.full_name}'s application? This action cannot be undone.`)) return
    setIsDeleting(true)
    await onDelete(reg.id)
    setIsDeleting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-white/5 overflow-hidden"
    >
      <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-sm font-bold text-[#00d4ff]">
            {reg.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{reg.full_name}</h3>
            <p className="text-xs text-zinc-500 font-mono">{reg.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] sm:text-xs">
            <DomainIcon className="w-3 h-3" style={{ color: domain.color }} />
            <span style={{ color: domain.color }}>{domain.label}</span>
          </div>
          
          <div className={cn(
            "px-2 py-1 rounded-md text-[10px] sm:text-xs font-mono border",
            reg.status?.toLowerCase() === 'invited' 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : reg.status?.toLowerCase() === 'completed'
              ? "bg-[#00d4ff]/10 border-[#00d4ff]/20 text-[#00d4ff]"
              : reg.status?.toLowerCase() === 'started'
              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          )}>
            {reg.status?.toUpperCase() || 'REGISTERED'}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {reg.status?.toLowerCase() === 'completed' ? (
            <div className="flex items-center gap-1 text-xs text-[#00d4ff] font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              Test Completed
            </div>
          ) : (!reg.status || reg.status.toLowerCase() === 'registered') ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d4ff] text-[#050508] text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
              Generate Link
            </button>
          ) : reg.status?.toLowerCase() === 'started' ? (
            <div className="flex items-center gap-1 text-xs text-yellow-500 italic">
              <Loader2 className="w-3 h-3 animate-spin" />
              Test in Progress
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-green-500 font-bold border border-green-500/20 bg-green-500/5 px-2 py-1 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              Link Generated
            </div>
          )}

          {reg.status?.toLowerCase() === 'completed' && (
            <button
              onClick={() => onViewReport(reg.full_name, reg.domain, reg.answers)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
            >
              <Brain className="w-3.5 h-3.5 text-[#00d4ff]" />
              View Report
            </button>
          )}

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
              title="Delete Application"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-zinc-500">Campus ID</p>
                  <p className="font-mono text-white">{reg.campus_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500">Mobile</p>
                  <p className="font-mono text-white">{reg.mobile}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-zinc-500">Registered At</p>
                  <p className="text-white">{new Date(reg.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Display Answers Summary if available */}
              {reg.answers && Object.keys(reg.answers).length > 0 && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">
                      Assessment Snapshots
                    </h4>
                    <button 
                       onClick={() => onViewReport(reg.full_name, reg.domain, reg.answers)}
                       className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-tighter underline decoration-zinc-800"
                    >
                      Open Full Detailed Report
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(reg.answers).slice(0, 4).map(([qId, answer]) => (
                      <div key={qId} className="p-2 rounded-lg bg-white/5 border border-white/5 truncate max-w-full">
                        <p className="text-[8px] text-zinc-600 mb-0.5">Q-ID: {qId}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{answer || "Skipped"}</p>
                      </div>
                    ))}
                    {Object.keys(reg.answers).length > 4 && (
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center italic text-[10px] text-zinc-600">
                        + {Object.keys(reg.answers).length - 4} more answers
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Session Row ─────────────────────────────────────────────────────────────

function SessionCard({ 
  session, 
  onDelete, 
  onViewReport 
}: { 
  session: TestSession; 
  onDelete: (id: string, regId: string) => void;
  onViewReport: (candidateName: string, domain: string, answers: Record<string, string>) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isExpired = new Date(session.expires_at) < new Date()
  const isCompleted = !!session.completed_at
  const isStarted = !!session.start_time && !isCompleted

  const [expanded, setExpanded] = useState(false)

  const handleCopy = () => {
    const url = `${window.location.origin}/test/${session.link_id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard!")
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will invalidate the link.")) return
    setIsDeleting(true)
    await onDelete(session.id, session.registration_id)
    setIsDeleting(false)
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-sm font-bold text-[#00d4ff]">
                {(session.registrations?.full_name || "U").charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-white">{session.registrations?.full_name || "Unknown Candidate"}</h3>
                <p className="text-xs text-zinc-500 font-mono">{session.registrations?.email}</p>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={cn(
              "px-2 py-1 rounded-md text-[10px] font-mono border",
              isCompleted ? "bg-green-500/10 border-green-500/20 text-green-400" :
              isStarted ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
              isExpired ? "bg-red-500/10 border-red-500/20 text-red-400" :
              "bg-blue-500/10 border-blue-500/20 text-blue-400"
            )}>
              {isCompleted ? "COMPLETED" : isStarted ? "IN PROGRESS" : isExpired ? "EXPIRED" : "PENDING"}
            </div>

            {isCompleted && (
              <button
                onClick={() => onViewReport(session.registrations?.full_name || "Unknown", session.domain, session.registrations?.answers || {})}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
              >
                <Brain className="w-3.5 h-3.5 text-[#00d4ff]" />
                View Report
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 transition-all"
                title="Copy Test Link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => window.open(`/test/${session.link_id}`, "_blank")}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 transition-all"
                title="Preview Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all"
                title="Delete Link"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 rounded-lg hover:bg-white/10 text-zinc-500"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] text-zinc-500 font-mono">
          <div>
            <p className="text-zinc-600 mb-0.5 uppercase tracking-tighter">Domain</p>
            <p className="text-zinc-400 font-bold">{session.domain?.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-zinc-600 mb-0.5 uppercase tracking-tighter">Expires</p>
            <p className={cn(isExpired ? "text-red-400" : "text-zinc-400")}>
              {new Date(session.expires_at).toLocaleDateString()}
            </p>
          </div>
          {session.start_time && (
            <div>
              <p className="text-zinc-600 mb-0.5 uppercase tracking-tighter">Started At</p>
              <p className="text-zinc-400">{new Date(session.start_time).toLocaleTimeString()}</p>
            </div>
          )}
          {session.completed_at && (
            <div>
              <p className="text-zinc-600 mb-0.5 uppercase tracking-tighter">Completed At</p>
              <p className="text-zinc-400">{new Date(session.completed_at).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4 bg-white/[0.02]">
              {/* Profile Details (Minimal) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[10px]">
                <div>
                   <p className="text-zinc-600 uppercase mb-0.5">Campus ID</p>
                   <p className="text-zinc-400 font-mono">{session.registrations?.campus_id}</p>
                </div>
                <div>
                   <p className="text-zinc-600 uppercase mb-0.5">Link ID</p>
                   <p className="text-zinc-400 font-mono">{session.link_id}</p>
                </div>
              </div>

              {/* Responses Section */}
              {isCompleted && session.registrations?.answers && Object.keys(session.registrations.answers).length > 0 ? (
                <div className="space-y-3 pt-2 border-t border-white/5">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-[#00d4ff]" />
                        <h4 className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Assessment Detail</h4>
                     </div>
                     <button 
                       onClick={() => onViewReport(session.registrations?.full_name || "Unknown", session.domain, session.registrations?.answers || {})}
                       className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-tighter"
                     >
                       Full Detailed View
                     </button>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(session.registrations.answers).slice(0, 4).map(([qId, answer]) => (
                      <div key={qId} className="p-2 rounded-lg bg-black/20 border border-white/5 truncate">
                        <p className="text-[8px] text-zinc-600 mb-0.5">QUESTION {qId}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{answer || "Skipped"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isCompleted ? (
                <p className="text-[10px] text-zinc-500 italic py-2">Test marked as completed but no responses were recorded.</p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"registrations" | "sessions">("registrations")
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [domainFilter, setDomainFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<{
    candidateName: string;
    domain: string;
    answers: Record<string, string>;
  } | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (tab === "registrations") {
        const data = await getRegistrationsAction()
        setRegistrations(data ?? [])
      } else {
        const data = await getTestSessionsAction()
        setSessions((data as unknown as TestSession[]) ?? [])
      }
    } catch (err) {
      console.error("Fetch error:", err)
      toast.error("Failed to load data.")
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerateLink = async (regId: string, domain: string) => {
    const res = await generateTestLinkAction(regId, domain)
    if (res.success) {
      toast.success("Link generated successfully!")
      fetchData()
    } else {
      toast.error(res.error || "Generation failed")
    }
  }

  const handleDeleteSession = async (sessionId: string, regId: string) => {
    const res = await deleteTestSessionAction(sessionId, regId)
    if (res.success) {
      toast.success("Session deleted")
      fetchData()
    } else {
      toast.error(res.error || "Delete failed")
    }
  }

  const handleDeleteRegistration = async (regId: string) => {
    const res = await deleteRegistrationAction(regId)
    if (res.success) {
      toast.success("Application deleted successfully")
      fetchData()
    } else {
      toast.error(res.error || "Delete failed")
    }
  }

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.campus_id.toLowerCase().includes(search.toLowerCase())
    const matchesDomain = domainFilter === "all" || r.domain === domainFilter
    return matchesSearch && matchesDomain
  })

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#00d4ff]" />
              YENTECH Admin
            </h1>
            <p className="text-xs text-zinc-500 font-mono">Recruitment Operations Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchData()} 
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-[#00d4ff] transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20">
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-8 w-fit">
          <button
            onClick={() => setTab("registrations")}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", tab === "registrations" ? "bg-[#00d4ff] text-[#050508]" : "text-zinc-500 hover:text-white")}
          >
            Applications ({registrations.length})
          </button>
          <button
            onClick={() => setTab("sessions")}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", tab === "sessions" ? "bg-[#00d4ff] text-[#050508]" : "text-zinc-500 hover:text-white")}
          >
            Test Sessions ({sessions.length})
          </button>
        </div>

        {/* Filters */}
        {tab === "registrations" && (
           <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none focus:border-[#00d4ff]/50"
              />
            </div>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm outline-none"
            >
              <option value="all">All Domains</option>
              {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Data List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00d4ff]" />
              <p className="text-zinc-500 text-sm">Synchronizing data...</p>
            </div>
          ) : tab === "registrations" ? (
            filteredRegistrations.length > 0 ? (
              filteredRegistrations.map(reg => (
                <RegistrationCard 
                  key={reg.id} 
                  reg={reg} 
                  onGenerateLink={handleGenerateLink} 
                  onDelete={handleDeleteRegistration} 
                  onViewReport={(name, dom, ans) => setSelectedReport({ candidateName: name, domain: dom, answers: ans })}
                />
              ))
            ) : (
              <p className="text-center py-20 text-zinc-600 italic">No registrations found matching criteria.</p>
            )
          ) : (
            sessions.length > 0 ? (
              sessions.map(session => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onDelete={handleDeleteSession} 
                  onViewReport={(name, dom, ans) => setSelectedReport({ candidateName: name, domain: dom, answers: ans })}
                />
              ))
            ) : (
              <p className="text-center py-20 text-zinc-600 italic">No active test sessions.</p>
            )
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedReport && (
          <AssessmentReportOverlay 
            {...selectedReport} 
            onClose={() => setSelectedReport(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    async function checkSession() {
      setIsMounted(true)
      const session = await getAdminSessionAction()
      if (session && session.admin) {
        setIsAuthenticated(true)
      }
    }
    checkSession()
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    await adminLogoutAction()
    setIsAuthenticated(false)
  }

  if (!isMounted) return null

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginScreen onSuccess={handleLogin} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
