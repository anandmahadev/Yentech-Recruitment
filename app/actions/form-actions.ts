"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface FormSubmissionData {
  fullName: string
  mobile: string
  campusId: string
  domain: string
  answers: Record<string, string>
  whyChooseYou: string
  experience?: string
}

export async function submitRecruitmentFormAction(formData: FormSubmissionData) {
  // 1. Server-side validation
  const name = formData.fullName.trim()
  if (!name || !/^[a-zA-Z\s'.]{2,60}$/.test(name)) {
    return { success: false, error: "Invalid name" }
  }

  const mobileValid = /^[6-9]\d{9}$/.test(formData.mobile)
  if (!formData.mobile || !mobileValid) {
    return { success: false, error: "Invalid mobile number" }
  }

  if (!formData.campusId.trim()) {
    return { success: false, error: "Campus ID is required" }
  }

  if (!formData.domain) {
    return { success: false, error: "Domain selection is required" }
  }

  if (formData.whyChooseYou.trim().length < 50) {
    return { success: false, error: "Personal statement too short" }
  }

  try {
    const supabase = await createClient()
    
    // Check for duplicates on server as well
    const normalizedCampusId = formData.campusId.trim().toUpperCase()
    
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .or(`campus_id.eq.${normalizedCampusId},mobile.eq.${formData.mobile}`)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "Application already submitted with this Campus ID or Mobile number" }
    }

    // Generate a strong ID
    const applicationId = `YT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`

    const { error: insertError } = await supabase.from("registrations").insert({
      application_id: applicationId,
      campus_id: normalizedCampusId,
      full_name: name,
      mobile: formData.mobile,
      domain: formData.domain,
      answers: formData.answers,
      why_choose_you: formData.whyChooseYou.trim(),
      experience: formData.experience?.trim() || null,
    })

    if (insertError) {
      console.error("Insert error:", insertError)
      return { success: false, error: "Database error. Please try again." }
    }

    revalidatePath("/admin")
    return { success: true, applicationId }
  } catch (error) {
    console.error("Submission error:", error)
    return { success: false, error: "Connection error" }
  }
}
