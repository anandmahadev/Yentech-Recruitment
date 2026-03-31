"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Registration {
  id: string
  application_id: string
  campus_id: string
  full_name: string
  mobile: string
  domain: string
  answers: Record<string, string>
  why_choose_you: string
  experience: string | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "yentech2026"

const DOMAIN_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "ai-ml": { label: "AI / ML", icon: Brain, color: "#7c3aed" },
  "web-dev": { label: "Web Dev", icon: Code, color: "#0ea5e9" },
  cybersecurity: { label: "Cybersecurity", icon: Terminal, color: "#10b981" },
  graphics: { label: "Graphics / Media", icon: Zap, color: "#f59e0b" },
}

const SITUATIONAL_QUESTIONS = [
  "You're working on a team project and a member consistently misses deadlines, affecting everyone's work. How do you handle this?",
  "You've been assigned a task using a technology you've never worked with before, and the deadline is tight. What's your approach?",
  "During a club event, you notice a junior member struggling but hesitant to ask for help. What do you do?",
  "You strongly disagree with a decision made by the club leadership about an upcoming project. How do you respond?",
  "You're leading a workshop and realize mid-session that your prepared content is too advanced for most attendees. What's your move?",
]

const DOMAIN_SPECIFIC_QUESTIONS: Record<string, string[]> = {
  "web-dev": [
    "What does HTML stand for, and what is its role in a webpage?",
    "What is the difference between HTML, CSS, and JavaScript? Explain in your own words.",
    "What is the difference between a frontend and a backend developer?",
    "What does 'responsive design' mean?",
    "You visit a website and the layout looks broken on your phone but fine on a laptop. What could be the reason?",
    "Name any website you find visually appealing. What do you like about its design?",
  ],
}


// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onSuccess()
      } else {
        setError("Incorrect password. Access denied.")
        setIsLoading(false)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "rgba(10, 10, 15, 0.95)",
            borderColor: "rgba(0, 212, 255, 0.2)",
            boxShadow: "0 0 60px rgba(0, 212, 255, 0.05), 0 0 200px rgba(0, 212, 255, 0.02)",
          }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0, 212, 255, 0.1)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
              }}
            >
              <Shield className="w-8 h-8" style={{ color: "#00d4ff" }} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-1">Admin Access</h1>
          <p className="text-sm text-center mb-8" style={{ color: "#71717a" }}>
            YENTECH Recruitment Dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#a1a1aa" }}>
                Admin Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "#71717a" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg text-white placeholder-zinc-600 outline-none transition-all"
                  style={{
                    background: "#0f0f18",
                    border: error
                      ? "1px solid rgba(239, 68, 68, 0.5)"
                      : "1px solid rgba(39, 39, 42, 0.8)",
                  }}
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
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs"
                  style={{ color: "#ef4444" }}
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#00d4ff", color: "#050508" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Access Dashboard
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Candidate Card ───────────────────────────────────────────────────────────

function CandidateCard({ reg, index }: { reg: Registration; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const domain = DOMAIN_CONFIG[reg.domain] ?? { label: reg.domain, icon: Code, color: "#00d4ff" }
  const DomainIcon = domain.icon

  const answersArray = Object.entries(reg.answers || {}).sort(([a], [b]) => Number(a) - Number(b))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: "#0a0a0f", borderColor: "rgba(39, 39, 42, 0.8)" }}
    >
      {/* Card Header */}
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
            style={{ background: `${domain.color}18`, color: domain.color, border: `1px solid ${domain.color}40` }}
          >
            {reg.full_name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{reg.full_name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs font-mono" style={{ color: "#71717a" }}>
                {reg.campus_id}
              </span>
              <span className="text-xs" style={{ color: "#3f3f46" }}>·</span>
              <span className="text-xs" style={{ color: "#71717a" }}>
                {reg.mobile}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Domain Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: `${domain.color}15`, color: domain.color, border: `1px solid ${domain.color}30` }}
          >
            <DomainIcon className="w-3 h-3" />
            {domain.label}
          </div>

          {/* App ID */}
          <span className="hidden md:block text-xs font-mono px-2 py-1 rounded" style={{ background: "#1a1a24", color: "#71717a" }}>
            {reg.application_id}
          </span>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ background: expanded ? "rgba(0,212,255,0.1)" : "#1a1a24", color: expanded ? "#00d4ff" : "#a1a1aa" }}
          >
            {expanded ? (
              <>Hide <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>View <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Answers */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: "rgba(39,39,42,0.6)" }}>
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg p-3" style={{ background: "#0f0f18" }}>
                  <p className="font-medium mb-1" style={{ color: "#71717a" }}>Submitted</p>
                  <p className="text-white">{new Date(reg.created_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "#0f0f18" }}>
                  <p className="font-medium mb-1" style={{ color: "#71717a" }}>Domain</p>
                  <p style={{ color: domain.color }}>{domain.label}</p>
                </div>
                {reg.experience && (
                  <div className="rounded-lg p-3 md:col-span-2" style={{ background: "#0f0f18" }}>
                    <p className="font-medium mb-1" style={{ color: "#71717a" }}>Prior Experience</p>
                    <p className="text-white leading-relaxed">{reg.experience}</p>
                  </div>
                )}
              </div>

              {/* Situational Answers */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
                  Situational Answers
                </p>
                {answersArray
                  .filter(([key]) => Number(key) < 100)
                  .map(([key, answer], i) => (
                    <div key={key} className="rounded-lg p-4" style={{ background: "#0f0f18", border: "1px solid rgba(39,39,42,0.6)" }}>
                      <p className="text-xs font-medium mb-2" style={{ color: "#71717a" }}>
                        Q{i + 1}. {SITUATIONAL_QUESTIONS[i] ?? `Question ${Number(key)}`}
                      </p>
                      <p className="text-sm text-white leading-relaxed">{answer || <span className="italic text-zinc-600">No answer</span>}</p>
                    </div>
                  ))}
              </div>

              { /* Domain-Specific Answers */}
              {answersArray.filter(([key]) => Number(key) >= 100).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: domain.color }}>
                    {domain.label} — Domain Questions
                  </p>
                  {answersArray
                    .filter(([key]) => Number(key) >= 100)
                    .map(([key, answer], i) => {
                      const domainQList = DOMAIN_SPECIFIC_QUESTIONS[reg.domain] ?? []
                      return (
                        <div key={key} className="rounded-lg p-4" style={{ background: "#0f0f18", border: `1px solid ${domain.color}25` }}>
                          <p className="text-xs font-medium mb-2" style={{ color: "#71717a" }}>
                            D{i + 1}. {domainQList[i] ?? `Domain Question ${i + 1}`}
                          </p>
                          <p className="text-sm text-white leading-relaxed">{answer || <span className="italic text-zinc-600">No answer</span>}</p>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Why Choose You */}
              {reg.why_choose_you && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
                    Why Choose Me
                  </p>
                  <div className="rounded-lg p-4" style={{ background: "#0f0f18", border: "1px solid rgba(39,39,42,0.6)" }}>
                    <p className="text-sm text-white leading-relaxed">{reg.why_choose_you}</p>
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [domainFilter, setDomainFilter] = useState("all")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false })

      if (dbError) throw dbError
      setRegistrations(data ?? [])
    } catch (err) {
      console.warn("Admin fetch error:", err)
      setError("Failed to load registrations. Check your Supabase connection.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = registrations.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.campus_id.toLowerCase().includes(search.toLowerCase()) ||
      r.mobile.includes(search)
    const matchesDomain = domainFilter === "all" || r.domain === domainFilter
    return matchesSearch && matchesDomain
  })

  const domainCounts = registrations.reduce<Record<string, number>>((acc, r) => {
    acc[r.domain] = (acc[r.domain] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Recruitment Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              YENTECH · Admin Panel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "#1a1a24", color: "#a1a1aa" }}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80"
              style={{ background: "#1a1a24", color: "#ef4444" }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ background: "#0a0a0f", border: "1px solid rgba(39,39,42,0.8)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <span className="text-xs font-medium" style={{ color: "#71717a" }}>Total</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#00d4ff" }}>{registrations.length}</p>
          </div>
          {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <div key={key} className="rounded-xl p-4" style={{ background: "#0a0a0f", border: "1px solid rgba(39,39,42,0.8)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  <span className="text-xs font-medium truncate" style={{ color: "#71717a" }}>{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{domainCounts[key] ?? 0}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#71717a" }} />
            <input
              type="text"
              placeholder="Search by name, campus ID, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 outline-none transition-all"
              style={{ background: "#0a0a0f", border: "1px solid rgba(39,39,42,0.8)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Domain Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#71717a" }} />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-lg text-sm text-white outline-none cursor-pointer appearance-none"
              style={{ background: "#0a0a0f", border: "1px solid rgba(39,39,42,0.8)", minWidth: "160px" }}
            >
              <option value="all">All Domains</option>
              {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00d4ff" }} />
            <p className="text-sm" style={{ color: "#71717a" }}>Loading applications...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
              <X className="w-6 h-6" style={{ color: "#ef4444" }} />
            </div>
            <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-80"
              style={{ background: "#1a1a24", color: "#a1a1aa" }}
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm" style={{ color: "#71717a" }}>
              {registrations.length === 0 ? "No applications submitted yet." : "No results match your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs mb-4" style={{ color: "#71717a" }}>
              Showing {filtered.length} of {registrations.length} application{registrations.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((reg, i) => (
              <CandidateCard key={reg.id} reg={reg} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = sessionStorage.getItem("yentech-admin-auth")
    if (stored === "true") setIsAuthenticated(true)
  }, [])

  const handleLogin = () => {
    sessionStorage.setItem("yentech-admin-auth", "true")
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("yentech-admin-auth")
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
