"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { TEST_DURATION_SECONDS } from "@/lib/constants"

/**
 * Verifies if a test link is valid, not expired, and not already completed
 */
export async function verifyTestLinkAction(linkId: string) {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from("test_sessions")
    .select(`
      *,
      registrations (
        full_name,
        domain,
        answers
      )
    `)
    .eq("link_id", linkId)
    .maybeSingle()

  if (error || !session) {
    return { success: false, error: "Invalid or non-existent assessment link." }
  }

  // Check completion
  if (session.completed_at) {
    return { success: false, error: "This assessment has already been completed.", completed: true }
  }

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    return { success: false, error: "This assessment link has expired." }
  }

  // If already started, check if 20m have passed
  if (session.start_time) {
    const startTime = new Date(session.start_time)
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

    if (elapsedSeconds > TEST_DURATION_SECONDS + 60) { // +60s grace period
      // Auto-mark as completed if left hanging? For now just block.
      return { success: false, error: "Your session has timed out." }
    }
    
    return { 
      success: true, 
      session, 
      alreadyStarted: true, 
      remainingSeconds: Math.max(0, TEST_DURATION_SECONDS - elapsedSeconds) 
    }
  }

  return { success: true, session, alreadyStarted: false, remainingSeconds: TEST_DURATION_SECONDS }
}

/**
 * Starts a test session
 */
export async function startTestSessionAction(linkId: string) {
  const supabase = await createClient()

  // Verify first
  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, start_time, registration_id")
    .eq("link_id", linkId)
    .single()

  if (!session) return { success: false, error: "Session not found." }
  if (session.start_time) return { success: true } // Already started

  const now = new Date().toISOString()
  
  // 1. Update session start time
  await supabase
    .from("test_sessions")
    .update({ start_time: now })
    .eq("id", session.id)

  // 2. Update registration status
  const { error: regError } = await supabase
    .from("registrations")
    .update({ status: "started" })
    .eq("id", session.registration_id)

  if (regError) {
    console.error(`Failed to start session for link ${linkId}:`, regError)
    return { success: false, error: `Failed to set test status to 'started': ${regError.message}` }
  }

  console.log(`Test session ${session.id} started at ${now}`)

  return { success: true, startTime: now }
}

/**
 * Submits finalized test answers
 */
export async function submitTestAnswersAction(linkId: string, answers: Record<string, string>) {
  const supabase = await createClient()

  // 1. Get session details
  const { data: session } = await supabase
    .from("test_sessions")
    .select("*, registrations(id)")
    .eq("link_id", linkId)
    .single()

  if (!session) return { success: false, error: "Session not found." }
  if (session.completed_at) return { success: false, error: "Already submitted." }

  // 2. Verify timing (Server-side check)
  const startTime = new Date(session.start_time || new Date())
  const now = new Date()
  const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000

  // Allow a small grace period for network latency (e.g., 22 minutes total)
  if (elapsedSeconds > (TEST_DURATION_SECONDS + 120)) {
     // Still record what we can? Or block?
     // Decision: Record but mark as late or just proceed. 
     // For this recruitment app, we'll accept it but it's clearly timed out on client.
  }

  // 3. Update registrations table
  console.log(`Submitting answers for registration ${session.registration_id}...`)
  const { error: regError } = await supabase
    .from("registrations")
    .update({ 
      answers: answers, 
      status: "completed" 
    })
    .eq("id", session.registration_id)

  if (regError) {
    console.error("Final submission registration error:", regError)
    return { success: false, error: `Database error saving answers: ${regError.message}` }
  }

  // 4. Close session
  const { error: sessionError } = await supabase
    .from("test_sessions")
    .update({ completed_at: now.toISOString() })
    .eq("id", session.id)

  if (sessionError) {
    console.error("Final submission session closure error:", sessionError)
  }

  console.log(`Successfully submitted test for registration ${session.registration_id}`)
  revalidatePath("/admin")
  return { success: true }
}

/**
 * Auto-saves partial test answers without closing the session
 */
export async function autoSaveTestAnswersAction(linkId: string, answers: Record<string, string>) {
  const supabase = await createClient()

  // 1. Get session details
  const { data: session } = await supabase
    .from("test_sessions")
    .select("registration_id, completed_at")
    .eq("link_id", linkId)
    .single()

  if (!session || session.completed_at) {
    return { success: false, error: "Session invalid or already completed" }
  }

  // 2. Update registration answers
  const { error } = await supabase
    .from("registrations")
    .update({ answers })
    .eq("id", session.registration_id)

  if (error) {
    console.error("Auto-save error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
