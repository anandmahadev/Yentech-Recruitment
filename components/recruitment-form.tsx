"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  User,
  Brain,
  CheckCircle,
  Zap,
  Code,
  Terminal,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { submitRecruitmentFormAction } from "@/app/actions/form-actions"
import { IS_REGISTRATION_OPEN } from "@/lib/constants"

// ─── Domains ──────────────────────────────────────────────────────────────────

const domains = [
  { id: "ai-ml", name: "AI / ML", icon: Brain, color: "#7c3aed" },
  { id: "web-dev", name: "Web Dev", icon: Code, color: "#0ea5e9" },
  { id: "cybersecurity", name: "Cybersecurity", icon: Terminal, color: "#10b981" },
  { id: "graphics", name: "Graphics / Media", icon: Zap, color: "#f59e0b" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  fullName: string
  mobile: string
  email: string
  campusId: string
  domain: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecruitmentForm() {
  const [isMounted, setIsMounted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobile: "",
    email: "",
    campusId: "",
    domain: "",
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

  // ─── Registration Closed Screen ─────────────────────────────────────────────

  if (!IS_REGISTRATION_OPEN) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 md:p-12 text-center shadow-2xl">
          {/* Animated Background Gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00d4ff]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#7c3aed]/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#7c3aed]/20 flex items-center justify-center border border-white/10 shadow-inner">
              <Zap className="w-10 h-10 text-[#00d4ff]" />
            </div>

            <h2 className="text-3xl md:text-4xl font-sans font-bold text-white mb-6 tracking-tight">
              Registrations <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]">Closed</span>
            </h2>

            <div className="space-y-4 font-mono text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
              <p>
                Thank you for your interest in joining the YENTECH crew. 
              </p>
              <p>
                The registration window for the current recruitment phase has officially closed as we have reached our capacity.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Stay tuned for future opportunities
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // Full name
    const name = formData.fullName.trim()
    if (!name) {
      newErrors.fullName = "Name is required"
    } else if (!/^[a-zA-Z\s'.]{2,60}$/.test(name)) {
      newErrors.fullName = "Enter a valid full name (letters only, 2–60 chars)"
    }

    // Mobile
    const mobileValid = /^[6-9]\d{9}$/.test(formData.mobile)
    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required"
    } else if (!mobileValid) {
      newErrors.mobile = "Enter a valid 10-digit Indian mobile number"
    }

    // Email
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!emailValid) {
      newErrors.email = "Enter a valid email address"
    }

    // Campus ID
    if (!formData.campusId.trim()) {
      newErrors.campusId = "Campus ID is required"
    }

    // Domain
    if (!formData.domain) {
      newErrors.domain = "Select a domain"
    }

    // DB duplicate checks
    if (mobileValid && formData.campusId.trim() && emailValid) {
      setIsChecking(true)
      try {
        const supabase = createClient()
        const [campusCheck, mobileCheck, emailCheck] = await Promise.all([
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
          supabase
            .from("registrations")
            .select("email")
            .eq("email", formData.email.trim().toLowerCase())
            .maybeSingle(),
        ])
        if (campusCheck.data) {
          newErrors.campusId = "This Campus ID has already submitted an application"
        }
        if (mobileCheck.data) {
          newErrors.mobile = "This mobile number has already been used to apply"
        }
        if (emailCheck.data) {
          newErrors.email = "This email has already been used to apply"
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

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isSubmitting || isChecking) return
    
    const isValid = await validate()
    if (!isValid) return

    setIsSubmitting(true)
    setErrors({})
    
    try {
      const res = await submitRecruitmentFormAction(formData)

      if (res.success) {
        setApplicationId(res.applicationId!)
        setSubmitted(true)
      } else {
        const error = res.error || "Submission failed. Please try again."
        if (error.includes("Campus ID") || error.includes("Mobile") || error.includes("Email")) {
          setErrors({ 
            campusId: error.includes("Campus ID") ? error : "", 
            mobile: error.includes("Mobile") ? error : "", 
            email: error.includes("Email") ? error : "" 
          })
        } else {
          setErrors({ submit: error })
        }
      }
    } catch (error) {
      console.error("Submission error:", error)
      setErrors({ submit: "Connection failed. Please check your internet and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

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
          Registration Successful!
        </h2>
        <p className="text-muted-foreground mb-8 font-mono max-w-sm mx-auto">
          Your details have been saved. You will receive your secure test link shortly on your registered email.
        </p>
        <p className="text-sm text-muted-foreground mt-8 font-mono">
          YENTECH Recruitment Phase 1 Complete.
        </p>
      </motion.div>
    )
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center">
            <User className="w-5 h-5 text-[#00d4ff]" />
          </div>
          <div>
            <h2 className="text-xl font-sans font-bold text-foreground">Basic Information</h2>
            <p className="text-sm text-muted-foreground font-mono">Join the crew</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-mono text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] text-foreground font-mono transition-all"
                placeholder="name@example.com"
                autoComplete="off"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1 font-mono">{errors.email}</p>
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
                placeholder="10-digit mobile"
                autoComplete="off"
                maxLength={10}
              />
              {errors.mobile && (
                <p className="text-destructive text-xs mt-1 font-mono">{errors.mobile}</p>
              )}
            </div>
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

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isChecking}
          className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-background font-sans font-bold text-lg shadow-xl shadow-[#00d4ff]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting || isChecking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isChecking ? "Checking..." : "Registering..."}
            </>
          ) : (
            <>
              Submit Registration
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        {errors.submit && (
          <p className="text-destructive text-center text-xs mt-4 font-mono">{errors.submit}</p>
        )}
      </div>
    </div>
  )
}
