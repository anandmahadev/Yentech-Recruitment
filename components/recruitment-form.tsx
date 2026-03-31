"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  ChevronLeft,
  User,
  Brain,
  MessageSquare,
  CheckCircle,
  Zap,
  Code,
  Terminal,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ─── Domains ──────────────────────────────────────────────────────────────────

const domains = [
  { id: "ai-ml", name: "AI / ML", icon: Brain, color: "#7c3aed" },
  { id: "web-dev", name: "Web Dev", icon: Code, color: "#0ea5e9" },
  { id: "cybersecurity", name: "Cybersecurity", icon: Terminal, color: "#10b981" },
  { id: "graphics", name: "Graphics / Media", icon: Zap, color: "#f59e0b" },
]

// ─── Questions ────────────────────────────────────────────────────────────────

const situationalQuestions = [
  {
    id: 1,
    question:
      "You're working on a team project and a member consistently misses deadlines, affecting everyone's work. How do you handle this?",
    placeholder: "Describe how you would approach this situation...",
  },
  {
    id: 2,
    question:
      "You've been assigned a task using a technology you've never worked with before, and the deadline is tight. What's your approach?",
    placeholder: "Explain your strategy for learning and delivering...",
  },
  {
    id: 3,
    question:
      "During a club event, you notice a junior member struggling but hesitant to ask for help. What do you do?",
    placeholder: "Describe how you would support them...",
  },
  {
    id: 4,
    question:
      "You strongly disagree with a decision made by the club leadership about an upcoming project. How do you respond?",
    placeholder: "Explain how you would handle this disagreement...",
  },
  {
    id: 5,
    question:
      "You're leading a workshop and realize mid-session that your prepared content is too advanced for most attendees. What's your move?",
    placeholder: "Describe how you would adapt...",
  },
]

/**
 * Domain-specific questions — IDs start from 101 to avoid collisions.
 */
const domainQuestions: Record<
  string,
  Array<{ id: number; question: string; placeholder: string }>
> = {
  "web-dev": [
    {
      id: 101,
      question: "What does HTML stand for, and what is its role in a webpage?",
      placeholder: "Explain in your own words...",
    },
    {
      id: 102,
      question:
        "What is the difference between HTML, CSS, and JavaScript? Explain in your own words.",
      placeholder: "Describe each and how they work together...",
    },
    {
      id: 103,
      question: "What is the difference between a frontend and a backend developer?",
      placeholder: "Explain the distinction...",
    },
    {
      id: 104,
      question: "What does 'responsive design' mean?",
      placeholder: "Explain what makes a website responsive...",
    },
    {
      id: 105,
      question:
        "You visit a website and the layout looks broken on your phone but fine on a laptop. What could be the reason?",
      placeholder: "What might be causing this issue?",
    },
    {
      id: 106,
      question:
        "Name any website you find visually appealing. What do you like about its design?",
      placeholder: "Share the website and describe what stands out to you...",
    },
  ],
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  fullName: string
  mobile: string
  campusId: string
  domain: string
  answers: Record<number, string>
  whyChooseYou: string
  experience: string
}

// ─── Paste Warning Component ──────────────────────────────────────────────────

function PasteWarning({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 mt-1"
        >
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <p className="text-amber-400 text-xs font-mono">
            Pasting is not allowed — please type your answer.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Textarea with paste guard ────────────────────────────────────────────────

function GuardedTextarea({
  value,
  onChange,
  rows = 3,
  placeholder,
  className,
}: {
  value: string
  onChange: (val: string) => void
  rows?: number
  placeholder?: string
  className?: string
}) {
  const [pasteBlocked, setPasteBlocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    setPasteBlocked(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setPasteBlocked(false), 3000)
  }

  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onDrop={(e) => e.preventDefault()}
        rows={rows}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        maxLength={2000}
      />
      <PasteWarning show={pasteBlocked} />
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecruitmentForm() {
  const [isMounted, setIsMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobile: "",
    campusId: "",
    domain: "",
    answers: {},
    whyChooseYou: "",
    experience: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [applicationId, setApplicationId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  /** Returns the full list of questions for the currently selected domain */
  const getActiveQuestions = () => {
    const extra = domainQuestions[formData.domain] ?? []
    return [...situationalQuestions, ...extra]
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // Full name — letters and spaces only, 2–60 chars
    const name = formData.fullName.trim()
    if (!name) {
      newErrors.fullName = "Name is required"
    } else if (!/^[a-zA-Z\s'.]{2,60}$/.test(name)) {
      newErrors.fullName = "Enter a valid full name (letters only, 2–60 chars)"
    }

    // Mobile — 10 digits, must not start with 0
    const mobileValid = /^[6-9]\d{9}$/.test(formData.mobile)
    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required"
    } else if (!mobileValid) {
      newErrors.mobile = "Enter a valid 10-digit Indian mobile number"
    }

    // Campus ID
    if (!formData.campusId.trim()) {
      newErrors.campusId = "Campus ID is required"
    }

    // Domain
    if (!formData.domain) {
      newErrors.domain = "Select a domain"
    }

    // DB duplicate checks — run both in parallel when both fields are syntactically valid
    if (mobileValid && formData.campusId.trim()) {
      setIsChecking(true)
      try {
        const supabase = createClient()
        const [campusCheck, mobileCheck] = await Promise.all([
          supabase
            .from("registrations")
            .select("campus_id")
            .eq("campus_id", formData.campusId.trim().toUpperCase())
            .maybeSingle(),
          supabase
            .from("registrations")
            .select("mobile")
            .eq("mobile", formData.mobile)
            .maybeSingle(),
        ])
        if (campusCheck.data) {
          newErrors.campusId = "This Campus ID has already submitted an application"
        }
        if (mobileCheck.data) {
          newErrors.mobile = "This mobile number has already been used to apply"
        }
      } catch {
        console.warn("Database connection error.")
      } finally {
        setIsChecking(false)
      }
    } else if (mobileValid && !formData.campusId.trim()) {
      // Campus ID missing — still check mobile independently
      setIsChecking(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("registrations")
          .select("mobile")
          .eq("mobile", formData.mobile)
          .maybeSingle()
        if (data) {
          newErrors.mobile = "This mobile number has already been used to apply"
        }
      } catch {
        console.warn("Database connection error.")
      } finally {
        setIsChecking(false)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    getActiveQuestions().forEach((q) => {
      const answer = formData.answers[q.id]?.trim()
      if (!answer || answer.length < 20) {
        newErrors[`q${q.id}`] = "Please provide a meaningful answer (min 20 characters)"
      }
    })
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }
    setErrors({})
    return true
  }

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (formData.whyChooseYou.trim().length < 50) {
      newErrors.whyChooseYou = "Please write at least 50 characters"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleNext = async () => {
    // Guard against double-tap / double-click
    if (isSubmitting || isChecking) return

    if (step === 1) {
      const isValid = await validateStep1()
      if (isValid) setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    } else if (step === 3 && validateStep3()) {
      await handleSubmit()
    }
  }

  const handleDomainChange = (domainId: string) => {
    // Reset answers when domain changes to avoid stale domain-specific answers
    if (domainId !== formData.domain) {
      setFormData({ ...formData, domain: domainId, answers: {} })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const normalizedCampusId = formData.campusId.trim().toUpperCase()
      const id = `YT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const { error } = await supabase.from("registrations").insert({
        application_id: id,
        campus_id: normalizedCampusId,
        full_name: formData.fullName.trim(),
        mobile: formData.mobile,
        domain: formData.domain,
        answers: formData.answers,
        why_choose_you: formData.whyChooseYou.trim(),
        experience: formData.experience.trim() || null,
      })

      if (error) {
        if (error.code === "23505") {
          // Unique constraint — could be campus_id or could be mobile if we add that constraint
          setStep(1)
          setErrors({ campusId: "This Campus ID has already submitted an application" })
          return
        }
        setErrors({ submit: "Something went wrong. Please try again." })
        return
      }

      setApplicationId(id)
      setSubmitted(true)
    } catch {
      console.warn("Submission error.")
      setErrors({ submit: "Connection failed. Please check your internet and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressWidth = `${(step / 3) * 100}%`
  const selectedDomain = domains.find((d) => d.id === formData.domain)

  // ─── Success Screen ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#00d4ff]/20 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-[#00d4ff]" />
        </motion.div>
        <h2 className="text-3xl font-sans font-bold text-foreground mb-4">
          Application Submitted!
        </h2>
        <p className="text-muted-foreground mb-8 font-mono">
          Welcome to the crew. We&apos;ll be in touch soon.
        </p>
        <div className="inline-block bg-card border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-2">Your Application ID</p>
          <p className="text-2xl font-mono font-bold text-[#00d4ff]">{applicationId}</p>
        </div>
        <p className="text-sm text-muted-foreground mt-6 font-mono">
          Save this ID for future reference
        </p>
      </motion.div>
    )
  }

  const textareaClass =
    "w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono text-sm transition-all resize-none"

  // ─── Form ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2 text-xs font-mono text-muted-foreground">
          <span className={cn(step >= 1 && "text-[#00d4ff]")}>Basic Info</span>
          <span className={cn(step >= 2 && "text-[#00d4ff]")}>Assessment</span>
          <span className={cn(step >= 3 && "text-[#00d4ff]")}>Personal Statement</span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]"
            initial={{ width: "0%" }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-foreground">Basic Information</h2>
                <p className="text-sm text-muted-foreground font-mono">Tell us about yourself</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-mono text-foreground mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                  placeholder="Enter your full name"
                  autoComplete="off"
                  maxLength={60}
                />
                {errors.fullName && (
                  <p className="text-destructive text-xs mt-1 font-mono">{errors.fullName}</p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-mono text-foreground mb-2">
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                  placeholder="10-digit mobile number"
                  autoComplete="off"
                  maxLength={10}
                />
                {errors.mobile && (
                  <p className="text-destructive text-xs mt-1 font-mono">{errors.mobile}</p>
                )}
              </div>

              {/* Campus ID */}
              <div>
                <label htmlFor="campusId" className="block text-sm font-mono text-foreground mb-2">
                  Campus ID
                </label>
                <input
                  id="campusId"
                  type="text"
                  value={formData.campusId}
                  onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                  placeholder="Enter your campus ID"
                  autoComplete="off"
                  maxLength={30}
                />
                {errors.campusId && (
                  <p className="text-destructive text-xs mt-1 font-mono">{errors.campusId}</p>
                )}
              </div>

              {/* Domain Selection */}
              <div>
                <label className="block text-sm font-mono text-foreground mb-3">
                  Choose Your Domain
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {domains.map((domain) => {
                    const Icon = domain.icon
                    return (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() => handleDomainChange(domain.id)}
                        className={cn(
                          "relative p-4 rounded-lg border-2 transition-all duration-300 text-left group overflow-hidden",
                          formData.domain === domain.id
                            ? "border-[#00d4ff] bg-[#00d4ff]/10"
                            : "border-border bg-card hover:border-[#00d4ff]/50"
                        )}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                          style={{ backgroundColor: domain.color }}
                        />
                        <Icon className="w-6 h-6 mb-2" style={{ color: domain.color }} />
                        <p className="font-sans font-semibold text-foreground text-sm">
                          {domain.name}
                        </p>
                      </button>
                    )
                  })}
                </div>
                {errors.domain && (
                  <p className="text-destructive text-xs mt-2 font-mono">{errors.domain}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Assessment ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#7c3aed]" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-foreground">Assessment</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  Answer all questions thoughtfully
                </p>
              </div>
            </div>

            {/* Situational section label */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground px-2">
                Situational Questions
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-6">
              {situationalQuestions.map((q, qIndex) => (
                <div key={q.id} className="bg-card border border-border rounded-lg p-5">
                  <p className="text-foreground font-mono text-sm mb-4 leading-relaxed">
                    <span className="text-[#00d4ff] font-bold">Q{qIndex + 1}.</span>{" "}
                    {q.question}
                  </p>
                  <GuardedTextarea
                    value={formData.answers[q.id] || ""}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        answers: { ...formData.answers, [q.id]: val },
                      })
                    }
                    placeholder={q.placeholder}
                    className={textareaClass}
                  />
                  <div className="flex justify-between mt-2">
                    {errors[`q${q.id}`] && (
                      <p className="text-destructive text-xs font-mono">{errors[`q${q.id}`]}</p>
                    )}
                    <p
                      className={cn(
                        "text-xs font-mono ml-auto",
                        (formData.answers[q.id]?.length || 0) >= 20
                          ? "text-[#10b981]"
                          : "text-muted-foreground"
                      )}
                    >
                      {formData.answers[q.id]?.length || 0}/20 min
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Domain-specific questions */}
            {(domainQuestions[formData.domain] ?? []).length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-border" />
                  <span
                    className="text-xs font-mono font-semibold uppercase tracking-widest px-2"
                    style={{ color: selectedDomain?.color ?? "#00d4ff" }}
                  >
                    {selectedDomain?.name} Questions
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-6">
                  {(domainQuestions[formData.domain] ?? []).map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="bg-card border rounded-lg p-5"
                      style={{ borderColor: `${selectedDomain?.color ?? "#00d4ff"}40` }}
                    >
                      <p className="text-foreground font-mono text-sm mb-4 leading-relaxed">
                        <span
                          className="font-bold"
                          style={{ color: selectedDomain?.color ?? "#00d4ff" }}
                        >
                          D{qIndex + 1}.
                        </span>{" "}
                        {q.question}
                      </p>
                      <GuardedTextarea
                        value={formData.answers[q.id] || ""}
                        onChange={(val) =>
                          setFormData({
                            ...formData,
                            answers: { ...formData.answers, [q.id]: val },
                          })
                        }
                        placeholder={q.placeholder}
                        className={textareaClass}
                      />
                      <div className="flex justify-between mt-2">
                        {errors[`q${q.id}`] && (
                          <p className="text-destructive text-xs font-mono">
                            {errors[`q${q.id}`]}
                          </p>
                        )}
                        <p
                          className={cn(
                            "text-xs font-mono ml-auto",
                            (formData.answers[q.id]?.length || 0) >= 20
                              ? "text-[#10b981]"
                              : "text-muted-foreground"
                          )}
                        >
                          {formData.answers[q.id]?.length || 0}/20 min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Personal Statement ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-foreground">Personal Statement</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  Tell us why you&apos;re the one
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="whyChooseYou"
                  className="block text-sm font-mono text-foreground mb-2"
                >
                  Why should we choose you? <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="whyChooseYou"
                  value={formData.whyChooseYou}
                  onChange={(e) => setFormData({ ...formData, whyChooseYou: e.target.value })}
                  rows={5}
                  maxLength={3000}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all resize-none"
                  placeholder="What makes you stand out? What will you bring to YENTECH? (min 50 characters)"
                />
                <div className="flex justify-between mt-1">
                  {errors.whyChooseYou && (
                    <p className="text-destructive text-xs font-mono">{errors.whyChooseYou}</p>
                  )}
                  <p
                    className={cn(
                      "text-xs font-mono ml-auto",
                      formData.whyChooseYou.length >= 50
                        ? "text-[#10b981]"
                        : "text-muted-foreground"
                    )}
                  >
                    {formData.whyChooseYou.length}/50 min
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-mono text-foreground mb-2"
                >
                  Relevant Experience{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all resize-none"
                  placeholder="Any projects, achievements, or experiences you'd like to share..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-border">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-mono text-sm hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {errors.submit && (
          <p className="text-destructive text-xs font-mono self-center">{errors.submit}</p>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || isChecking}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00d4ff] text-[#050508] font-sans font-semibold text-sm hover:bg-[#00d4ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isChecking ? "Checking..." : "Submitting..."}
            </>
          ) : (
            <>
              {step === 3 ? "Submit Application" : "Continue"}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
