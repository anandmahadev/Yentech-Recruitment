import { SignJWT, jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"

// Encryption logic separated from session logic to avoid issues in Middleware environment

const secretKey = process.env.SESSION_SECRET || "a_very_secret_key_change_me_in_production"
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  })
  return payload
}

// Session logic that uses cookies() - should only be called from Server Actions/Components
export async function login(password: string) {
  const { cookies } = await import("next/headers")
  const adminPassword = process.env.ADMIN_PASSWORD || "yentech2026"

  if (password === adminPassword) {
    // Create the session
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    const session = await encrypt({ admin: true, expires })

    // Save the session in a cookie
    const cookieStore = await cookies()
    cookieStore.set("yentech_admin_session", session, { 
      expires, 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    })
    return { success: true }
  } else {
    return { success: false, error: "Invalid password" }
  }
}

export async function logout() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  cookieStore.set("yentech_admin_session", "", { expires: new Date(0) })
}

export async function getSession() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const session = cookieStore.get("yentech_admin_session")?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("yentech_admin_session")?.value
  if (!session) return

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session)
  parsed.expires = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const res = NextResponse.next()
  res.cookies.set({
    name: "yentech_admin_session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  })
  return res
}
