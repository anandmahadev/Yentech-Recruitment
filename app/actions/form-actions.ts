"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { IS_REGISTRATION_OPEN } from "@/lib/constants"

interface FormSubmissionData {
  fullName: string
  mobile: string
  email: string
  campusId: string
  domain: string
}

export async function submitRecruitmentFormAction(formData: FormSubmissionData) {
  if (!IS_REGISTRATION_OPEN) {
    return { success: false, error: "Registrations are currently closed. We've reached our capacity for this phase." }
  }

  // 1. Server-side validation
  const name = formData.fullName.trim()
  if (!name || !/^[a-zA-Z\s'.]{2,60}$/.test(name)) {
    return { success: false, error: "Invalid name" }
  }

  const mobileValid = /^[6-9]\d{9}$/.test(formData.mobile)
  if (!formData.mobile || !mobileValid) {
    return { success: false, error: "Invalid mobile number" }
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  if (!formData.email || !emailValid) {
    return { success: false, error: "Invalid email address" }
  }

  if (!formData.campusId.trim()) {
    return { success: false, error: "Campus ID is required" }
  }

  if (!formData.domain) {
    return { success: false, error: "Domain selection is required" }
  }

  try {
    const supabase = await createClient()
    
    // Check for duplicates on server as well
    const normalizedCampusId = formData.campusId.trim().toUpperCase()
    const email = formData.email.trim().toLowerCase()
    
    // Check for duplicates on server with proper escaping
    const { data: existing, error: checkError } = await supabase
      .from("registrations")
      .select("id, campus_id, mobile, email")
      .or(`campus_id.eq."${normalizedCampusId}",mobile.eq."${formData.mobile}",email.eq."${email}"`)
      .maybeSingle()

    if (checkError) {
      console.error("Duplicate check error:", checkError)
      // We'll continue to try the insert as a fallback, which will trigger a DB unique constraint if it truly is a duplicate.
    }

    if (existing) {
      let conflictField = "details";
      if (existing.campus_id === normalizedCampusId) conflictField = "Campus ID";
      else if (existing.mobile === formData.mobile) conflictField = "Mobile Number";
      else if (existing.email === email) conflictField = "Email";
      
      return { success: false, error: `An application with this ${conflictField} already exists.` }
    }

    // Generate a strong ID
    const applicationId = `YT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`

    const { error: insertError } = await supabase.from("registrations").insert({
      application_id: applicationId,
      campus_id: normalizedCampusId,
      full_name: name,
      mobile: formData.mobile,
      email: email,
      domain: formData.domain,
      status: 'registered',
      answers: {},
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
