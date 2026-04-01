"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * Generates a random alphanumeric string for the link ID
 */
function generateLinkId(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates a unique test link for a registered candidate
 */
export async function generateTestLinkAction(registrationId: string, domain: string) {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()
  
  // 1. Generate unique link ID
  const link_id = generateLinkId(20)
  
  // 2. Set expiry (7 days from now)
  const expires_at = new Date()
  expires_at.setDate(expires_at.getDate() + 7)

  // 3. Insert into test_sessions
  const { error: sessionError } = await supabase
    .from("test_sessions")
    .insert({
      registration_id: registrationId,
      link_id,
      domain,
      expires_at: expires_at.toISOString(),
    })

  if (sessionError) {
    console.error("Error generating test link:", sessionError)
    // Check if it's a constraint error (e.g. session already exists)
    if (sessionError.code === '23505') {
       return { success: false, error: "A test link already exists for this registration." }
    }
    return { success: false, error: "Failed to create test session in database." }
  }

  // 4. Update registration status
  const { error: regError } = await supabase
    .from("registrations")
    .update({ status: 'invited' })
    .eq("id", registrationId)

  if (regError) {
    console.error("Error updating registration status:", regError)
    // IMPORTANT: Return failure if status update failed, so admin knows
    return { 
      success: false, 
      error: `Link created, but failed to update candidate status: ${regError.message}. Code: ${regError.code}` 
    }
  }

  revalidatePath("/admin")
  return { success: true, linkId: link_id }
}

/**
 * Fetches all test sessions with candidate details
 */
export async function getTestSessionsAction() {
  const session = await getSession()
  if (!session || !session.admin) {
    throw new Error("Unauthorized")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("test_sessions")
    .select(`
      *,
      registrations (
        full_name,
        email,
        campus_id,
        status,
        answers
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching test sessions:", error)
    throw error
  }
  return data
}

/**
 * Deletes a test session
 */
export async function deleteTestSessionAction(sessionId: string, registrationId?: string) {
  const session = await getSession()
  if (!session || !session.admin) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from("test_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) return { success: false, error: error.message }

  // Optionally reset registration status
  if (registrationId) {
    await supabase
      .from("registrations")
      .update({ status: 'registered' })
      .eq("id", registrationId)
  }

  revalidatePath("/admin")
  return { success: true }
}
