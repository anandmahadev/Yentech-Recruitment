import { Brain, Code, Terminal, Zap } from "lucide-react"

export const DOMAIN_CONFIG: Record<string, { label: string; icon: any; color: string; skipSituational?: boolean }> = {
  "ai-ml": { label: "AI / ML", icon: Brain, color: "#7c3aed" },
  "web-dev": { label: "Web Dev", icon: Code, color: "#0ea5e9" },
  cybersecurity: { label: "Cybersecurity", icon: Terminal, color: "#10b981" },
  graphics: { label: "Graphics / Media", icon: Zap, color: "#f59e0b", skipSituational: true },
}

/**
 * Global toggle to enable/disable new candidate registrations.
 * Set to false when the recruitment phase has ended.
 */
export const IS_REGISTRATION_OPEN = false;

export const SITUATIONAL_QUESTIONS = [
  "You're working on a team project and a member consistently misses deadlines, affecting everyone's work. How do you handle this?",
  "You've been assigned a task using a technology you've never worked with before, and the deadline is tight. What's your approach?",
  "During a club event, you notice a junior member struggling but hesitant to ask for help. What do you do?",
  "You're leading a workshop and realize mid-session that your prepared content is too advanced for most attendees. What's your move?",
]

export const DOMAIN_SPECIFIC_QUESTIONS: Record<string, string[]> = {
  "web-dev": [
    "Explain the roles of HTML, CSS, and JavaScript in web development. Also describe semantic HTML and why it is important (with examples).",
    "Explain the CSS box model and compare Flexbox and Grid. How do you use them to create responsive designs?",
    "What is the difference between inline, internal, and external CSS? When would you use each? Also explain the difference between id and class.",
    "What are variables and functions in JavaScript? Explain the differences between var, let, and const, and between == and ===.",
    "What is the DOM and how does JavaScript interact with it? Explain event handling with an example. Also, what is the difference between id and class, and how are they used in CSS and JavaScript?",
    "How do HTML forms work? Explain different input types and how JavaScript can be used to validate form data before submission. Also, what is the difference between GET and POST methods?",
  ],
  "ai-ml": [
    "What's something related to AI or technology that you taught yourself recently - not for a class, but just because you were curious? How did you go about learning it?",
    "Imagine you want to build a simple app that recommends movies to users based on what they've already watched. You have no idea where to start. Walk us through how you'd break this problem down into smaller steps before writing any code.",
    "Tell us about a time you got really stuck on a coding or tech problem. What did you try before giving up or asking for help, and what did that experience teach you?",
    "In simple terms, what is the difference between a model that is overfitting versus one that is underfitting? You don't need to use technical formulas - just explain it the way you'd explain it to a friend who hasn't studied ML.",
    "What's one area of AI/ML or programming that you feel least confident about right now, and what - if anything - are you doing about it?",
    "If you join the AI/ML department, what's one thing you'd genuinely like to build, learn, or contribute to -- even if it's just an idea right now? Why that specifically?",
  ],
  "cybersecurity": [
    "What is the difference between HTTP and HTTPS?",
    "What is a Phishing attack, and how can one prevent it?",
    "Explain the concept of 'Two-Factor Authentication' (2FA).",
    "What is Malware, and how does it spread?",
    "What is a Firewall and why is it important?",
  ],
  "graphics": [
    "Share your portfolio link and describe your two best designs, including the goal, your approach, and the final outcome.",
    "Describe how you would improve a poorly designed poster. What key elements would you focus on and why?",
    "Explain your complete process of converting a rough idea or concept into a final design.",
    "In your opinion, what factors make a design look premium rather than average? Explain with reasoning.",
    "You and your team create two strong concepts, but you must choose only one. How do you decide?",
    "Create a short event promo (reel/video/post) for a college activity (theme will be provided). Submit within the deadline.",
    "What makes content engaging or viral on platforms like Instagram or YouTube?",
    "How do you plan and cover a college event (before, during, and after)?",
    "How do you handle tight deadlines and feedback while working on media content?",
  ]
}

export const TEST_DURATION_SECONDS = 30 * 60; // 30 minutes
