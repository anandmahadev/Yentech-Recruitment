import { Brain, Code, Terminal, Zap } from "lucide-react"

export const DOMAIN_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  "ai-ml": { label: "AI / ML", icon: Brain, color: "#7c3aed" },
  "web-dev": { label: "Web Dev", icon: Code, color: "#0ea5e9" },
  cybersecurity: { label: "Cybersecurity", icon: Terminal, color: "#10b981" },
  graphics: { label: "Graphics / Media", icon: Zap, color: "#f59e0b" },
}

export const SITUATIONAL_QUESTIONS = [
  "You're working on a team project and a member consistently misses deadlines, affecting everyone's work. How do you handle this?",
  "You've been assigned a task using a technology you've never worked with before, and the deadline is tight. What's your approach?",
  "During a club event, you notice a junior member struggling but hesitant to ask for help. What do you do?",
  "You strongly disagree with a decision made by the club leadership about an upcoming project. How do you respond?",
  "You're leading a workshop and realize mid-session that your prepared content is too advanced for most attendees. What's your move?",
]

export const DOMAIN_SPECIFIC_QUESTIONS: Record<string, string[]> = {
  "web-dev": [
    "What does HTML stand for, and what is its role in a webpage?",
    "What is the difference between HTML, CSS, and JavaScript? Explain in your own words.",
    "What is the difference between a frontend and a backend developer?",
    "What does 'responsive design' mean?",
    "You visit a website and the layout looks broken on your phone but fine on a laptop. What could be the reason?",
    "Name any website you find visually appealing. What do you like about its design?",
  ],
  "ai-ml": [
    "What is the difference between Supervised and Unsupervised Learning?",
    "Explain the concept of 'Overfitting' in simple terms.",
    "What is a Neural Network?",
    "Mention one real-world application of AI that you find interesting.",
    "What is the role of Data Preprocessing in Machine Learning?",
  ],
  "cybersecurity": [
    "What is the difference between HTTP and HTTPS?",
    "What is a Phishing attack, and how can one prevent it?",
    "Explain the concept of 'Two-Factor Authentication' (2FA).",
    "What is Malware, and how does it spread?",
    "What is a Firewall and why is it important?",
  ],
  "graphics": [
    "What is the difference between Raster and Vector graphics?",
    "What are the primary colors used in digital displays (RGB) vs printing (CMYK)?",
    "Explain the concept of 'Typography' in design.",
    "What is UI/UX design, and why is it important?",
    "Name a design tool you've used or heard of and its purpose.",
  ]
}

export const TEST_DURATION_SECONDS = 20 * 60; // 20 minutes
