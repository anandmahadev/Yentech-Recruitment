"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, User, Brain, MessageSquare, CheckCircle, Zap, Code, Cpu, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"

const domains = [
  { id: "ai-ml", name: "AI / ML", icon: Brain, color: "#7c3aed" },
  { id: "web-dev", name: "Web Dev", icon: Code, color: "#0ea5e9" },
  { id: "cybersecurity", name: "Cybersecurity", icon: Terminal, color: "#10b981" },
  { id: "graphics", name: "Graphics / Media", icon: Zap, color: "#f59e0b" },
]

const situationalQuestions = [
  {
    id: 1,
    question: "You&apos;re working on a team project and a member consistently misses deadlines, affecting everyone&apos;s work. How do you handle this?",
    options: [
      "Directly confront them in front of the team to address the issue publicly",
      "Have a private conversation to understand their challenges and offer support",
      "Report them immediately to the project lead without discussion",
      "Take over their tasks yourself to avoid conflict"
    ]
  },
  {
    id: 2,
    question: "You&apos;ve been assigned a task using a technology you&apos;ve never worked with before, and the deadline is tight. What&apos;s your approach?",
    options: [
      "Tell your lead you can&apos;t do it and ask for a different assignment",
      "Research the basics, start building, and ask for help when truly stuck",
      "Wait until the last minute hoping someone else takes over",
      "Copy code from the internet without understanding it"
    ]
  },
  {
    id: 3,
    question: "During a club event, you notice a junior member struggling but hesitant to ask for help. What do you do?",
    options: [
      "Ignore it - they need to learn to speak up",
      "Approach them casually, offer assistance without making them feel embarrassed",
      "Announce to everyone that someone needs help",
      "Complete their task for them quickly"
    ]
  },
  {
    id: 4,
    question: "You strongly disagree with a decision made by the club leadership about an upcoming project. How do you respond?",
    options: [
      "Publicly criticize the decision on social media or group chats",
      "Express your concerns respectfully with alternative suggestions in a proper forum",
      "Silently comply but complain to other members privately",
      "Refuse to participate in the project"
    ]
  },
  {
    id: 5,
    question: "You&apos;re leading a workshop and realize mid-session that your prepared content is too advanced for most attendees. What&apos;s your move?",
    options: [
      "Continue as planned - they should catch up",
      "Adapt on the spot, simplify concepts, and check understanding frequently",
      "End the workshop early since it&apos;s not working",
      "Blame the organizers for not filtering attendees properly"
    ]
  }
]

interface FormData {
  fullName: string
  mobile: string
  campusId: string
  domain: string
  answers: Record<number, number>
  whyChooseYou: string
  experience: string
}

// Store submitted campus IDs to prevent duplicates (in production, this would be in a database)
const submittedCampusIds = new Set<string>()

export function RecruitmentForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobile: "",
    campusId: "",
    domain: "",
    answers: {},
    whyChooseYou: "",
    experience: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [applicationId, setApplicationId] = useState("")
  

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required"
    if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Enter valid 10-digit mobile number"
    if (!formData.campusId.trim()) {
      newErrors.campusId = "Campus ID is required"
    } else if (submittedCampusIds.has(formData.campusId.trim().toUpperCase())) {
      newErrors.campusId = "This Campus ID has already submitted an application"
    }
    if (!formData.domain) newErrors.domain = "Select a domain"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const answered = Object.keys(formData.answers).length
    if (answered < 5) {
      setErrors({ questions: "Please answer all questions" })
      return false
    }
    setErrors({})
    return true
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    if (formData.whyChooseYou.trim().length < 50) {
      newErrors.whyChooseYou = "Please write at least 50 characters"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) handleSubmit()
  }

  const handleSubmit = () => {
    // Check for duplicate campus ID one more time before final submission
    const normalizedCampusId = formData.campusId.trim().toUpperCase()
    if (submittedCampusIds.has(normalizedCampusId)) {
      setStep(1)
      setErrors({ campusId: "This Campus ID has already submitted an application" })
      return
    }
    
    // Store the campus ID to prevent future duplicates
    submittedCampusIds.add(normalizedCampusId)
    
    const id = `YT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setApplicationId(id)
    setSubmitted(true)
  }

  const calculateScore = () => {
    const correctAnswers: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
    let score = 0
    Object.entries(formData.answers).forEach(([q, a]) => {
      if (correctAnswers[parseInt(q)] === a) score++
    })
    return score
  }

  const progressWidth = `${(step / 3) * 100}%`

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
        {/* Step 1: Basic Info */}
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
              <div>
                <label className="block text-sm font-mono text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1 font-mono">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-mono text-foreground mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                  placeholder="10-digit mobile number"
                />
                {errors.mobile && <p className="text-destructive text-xs mt-1 font-mono">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-mono text-foreground mb-2">Campus ID</label>
                <input
                  type="text"
                  value={formData.campusId}
                  onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                  placeholder="Enter your campus ID"
                />
                {errors.campusId && <p className="text-destructive text-xs mt-1 font-mono">{errors.campusId}</p>}
              </div>

              <div>
                <label className="block text-sm font-mono text-foreground mb-3">Choose Your Domain</label>
                <div className="grid grid-cols-2 gap-3">
                  {domains.map((domain) => {
                    const Icon = domain.icon
                    return (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, domain: domain.id })}
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
                        <p className="font-sans font-semibold text-foreground text-sm">{domain.name}</p>
                      </button>
                    )
                  })}
                </div>
                {errors.domain && <p className="text-destructive text-xs mt-2 font-mono">{errors.domain}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Situational Questions */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#7c3aed]" />
              </div>
              <div>
                <h2 className="text-xl font-sans font-bold text-foreground">Situational Assessment</h2>
                <p className="text-sm text-muted-foreground font-mono">How would you handle these scenarios?</p>
              </div>
            </div>

            {errors.questions && (
              <p className="text-destructive text-sm font-mono bg-destructive/10 p-3 rounded-lg">{errors.questions}</p>
            )}

            <div className="space-y-6">
              {situationalQuestions.map((q, qIndex) => (
                <div key={q.id} className="bg-card border border-border rounded-lg p-5">
                  <p className="text-foreground font-mono text-sm mb-4 leading-relaxed">
                    <span className="text-[#00d4ff] font-bold">Q{qIndex + 1}.</span>{" "}
                    {q.question.replace(/&apos;/g, "'")}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          answers: { ...formData.answers, [q.id]: oIndex }
                        })}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all duration-200 font-mono text-sm",
                          formData.answers[q.id] === oIndex
                            ? "border-[#00d4ff] bg-[#00d4ff]/10 text-foreground"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-[#00d4ff]/50 hover:text-foreground"
                        )}
                      >
                        <span className="text-[#00d4ff] mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                        {option.replace(/&apos;/g, "'")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Personal Statement */}
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
                <p className="text-sm text-muted-foreground font-mono">Tell us why you&apos;re the one</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-mono text-foreground mb-2">
                  Why should we choose you? <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.whyChooseYou}
                  onChange={(e) => setFormData({ ...formData, whyChooseYou: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all resize-none"
                  placeholder="What makes you stand out? What will you bring to YENTECH? (min 50 characters)"
                />
                <div className="flex justify-between mt-1">
                  {errors.whyChooseYou && <p className="text-destructive text-xs font-mono">{errors.whyChooseYou}</p>}
                  <p className={cn(
                    "text-xs font-mono ml-auto",
                    formData.whyChooseYou.length >= 50 ? "text-[#10b981]" : "text-muted-foreground"
                  )}>
                    {formData.whyChooseYou.length}/50 min
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-foreground mb-2">
                  Relevant Experience <span className="text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  rows={4}
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-mono text-sm hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00d4ff] text-[#050508] font-sans font-semibold text-sm hover:bg-[#00d4ff]/90 transition-colors"
        >
          {step === 3 ? "Submit Application" : "Continue"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
