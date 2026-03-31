"use server"

import { login, logout, getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function adminLoginAction(password: string) {
  const result = await login(password)
  if (result.success) {
    revalidatePath("/admin")
    return { success: true }
  }
  return { success: false, error: result.error }
}

export async function adminLogoutAction() {
  await logout()
  revalidatePath("/")
  redirect("/")
}

export async function getAdminSessionAction() {
  return await getSession()
}

import { createClient } from "@/lib/supabase/server"

export async function getRegistrationsAction() {
  const session = await getSession()
  if (!session || !session.admin) {
    throw new Error("Unauthorized")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
