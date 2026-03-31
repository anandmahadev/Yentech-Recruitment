import { RecruitmentForm } from "@/components/recruitment-form"
import { Cpu, Lock } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00d4ff 1px, transparent 1px),
              linear-gradient(to bottom, #00d4ff 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-[120px]" />
      </div>

      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-12">
          {/* Call for Members Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4ff]"></span>
            </span>
            <span className="text-[#00d4ff] text-sm font-mono">Applications Now Open</span>
          </div>

          {/* Logo & Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center">
              <Cpu className="w-7 h-7 text-background" />
            </div>
            <h1 className="text-5xl md:text-6xl font-sans font-bold text-foreground tracking-tight">
              YEN<span className="text-[#00d4ff]">TECH</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl font-sans font-semibold text-foreground mb-3">
            Join the Crew. Lead the Campus.
          </p>
          <p className="text-muted-foreground font-mono text-base max-w-lg mx-auto">
            We&apos;re building the next generation of tech leaders. Are you ready to be one of them?
          </p>
        </header>

        {/* Recruitment Form Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-10 shadow-2xl shadow-[#00d4ff]/5">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              </div>
              <span className="text-muted-foreground font-mono text-xs ml-2">recruitment_form.exe</span>
            </div>
            <RecruitmentForm />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 pb-8 space-y-3">
          <p className="text-muted-foreground font-mono text-xs">
            &copy; {new Date().getFullYear()} YENTECH. Built with passion by students, for students.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:opacity-80"
            style={{ color: "#3f3f46" }}
          >
            <Lock className="w-3 h-3" />
            admin panel
          </Link>
        </footer>
      </div>
    </main>
  )
}
