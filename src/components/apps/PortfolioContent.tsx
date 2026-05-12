"use client";

import { Icon } from "@/components/Icon";

const cardBg = { background: "var(--bg-card)" };
const hoverBg = { background: "var(--bg-hover)" };
const textPrimary = { color: "var(--text-primary)" };
const textSecondary = { color: "var(--text-secondary)" };
const textTertiary = { color: "var(--text-tertiary)" };
const inputBg = { background: "var(--bg-input)" };

const portfolioData: Record<string, { title: string; icon: string; color: string; content: React.ReactNode }> = {
  about: {
    title: "About Me",
    icon: "User",
    color: "#3b82f6",
    content: (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-2xl font-bold text-white">
            JD
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={textPrimary}>John Doe</h2>
            <p className="text-sm mt-1" style={textSecondary}>Full Stack Developer & UI Designer</p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>React</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>Node.js</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>TypeScript</span>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={textSecondary}>
          Passionate developer with 5+ years of experience building scalable web applications.
          I love creating beautiful, intuitive interfaces and solving complex problems with clean code.
          When I'm not coding, you'll find me exploring new technologies, contributing to open source,
          or capturing moments through photography.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Years Exp.", value: "5+", color: "#3b82f6" },
            { label: "Projects", value: "50+", color: "#10b981" },
            { label: "Clients", value: "20+", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={cardBg}>
              <div className="text-lg font-semibold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] mt-0.5" style={textTertiary}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  projects: {
    title: "Projects",
    icon: "FolderOpen",
    color: "#f59e0b",
    content: (
      <div className="p-4 space-y-3">
        {[
          { name: "Lumona ERP", desc: "Enterprise resource planning system for SMEs", tech: ["Next.js", "PostgreSQL", "Prisma"], color: "#3b82f6" },
          { name: "Digital Invitation", desc: "Beautiful digital invitations for events", tech: ["React", "Tailwind", "Framer"], color: "#d4a574" },
          { name: "TaskFlow", desc: "AI-powered project management tool", tech: ["TypeScript", "OpenAI", "Supabase"], color: "#8b5cf6" },
          { name: "CryptoTracker", desc: "Real-time cryptocurrency dashboard", tech: ["Next.js", "WebSocket", "Chart.js"], color: "#10b981" },
        ].map((project) => (
          <div key={project.name} className="rounded-xl p-4 transition-colors cursor-pointer" style={cardBg}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + "22" }}>
                  <Icon name="Box" size={18} style={{ color: project.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-medium" style={textPrimary}>{project.name}</h3>
                  <p className="text-xs mt-0.5" style={textSecondary}>{project.desc}</p>
                </div>
              </div>
              <Icon name="ExternalLink" size={14} style={textTertiary} />
            </div>
            <div className="flex gap-1.5 mt-3">
              {project.tech.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-tertiary)" }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  experience: {
    title: "Experience",
    icon: "Briefcase",
    color: "#10b981",
    content: (
      <div className="p-4 space-y-4">
        {[
          { role: "Senior Frontend Engineer", company: "TechCorp Inc.", period: "2023 - Present", desc: "Leading frontend architecture decisions and mentoring junior developers." },
          { role: "Full Stack Developer", company: "StartupXYZ", period: "2021 - 2023", desc: "Built core product features from scratch, scaled to 100K users." },
          { role: "Junior Developer", company: "Agency Pro", period: "2019 - 2021", desc: "Developed websites and web applications for diverse clients." },
        ].map((job, i, arr) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
              {i < arr.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--border-subtle)" }} />}
            </div>
            <div className="pb-4">
              <div className="text-sm font-medium" style={textPrimary}>{job.role}</div>
              <div className="text-xs mt-0.5" style={{ color: "#10b981" }}>{job.company}</div>
              <div className="text-[10px] mt-0.5" style={textTertiary}>{job.period}</div>
              <p className="text-xs mt-1" style={textSecondary}>{job.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  skills: {
    title: "Skills",
    icon: "Zap",
    color: "#8b5cf6",
    content: (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "React / Next.js", level: 95, color: "#3b82f6" },
            { name: "TypeScript", level: 90, color: "#3b82f6" },
            { name: "Node.js", level: 85, color: "#10b981" },
            { name: "Python", level: 75, color: "#f59e0b" },
            { name: "PostgreSQL", level: 80, color: "#3b82f6" },
            { name: "Tailwind CSS", level: 95, color: "#3b82f6" },
            { name: "Figma", level: 85, color: "#ec4899" },
            { name: "Docker", level: 70, color: "#3b82f6" },
          ].map((skill) => (
            <div key={skill.name} className="rounded-xl p-3" style={cardBg}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={textPrimary}>{skill.name}</span>
                <span className="text-[10px]" style={textTertiary}>{skill.level}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${skill.level}%`, backgroundColor: skill.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  contact: {
    title: "Contact",
    icon: "Mail",
    color: "#ec4899",
    content: (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold" style={textPrimary}>Let's work together</h3>
          <p className="text-sm mt-1" style={textSecondary}>Open for freelance and full-time opportunities</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Email", value: "hello@johndoe.dev", icon: "Mail", color: "#ec4899" },
            { label: "LinkedIn", value: "linkedin.com/in/johndoe", icon: "Link", color: "#3b82f6" },
            { label: "GitHub", value: "github.com/johndoe", icon: "GitBranch", color: "#333" },
          ].map((c) => (
            <a key={c.label} href="#" className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ ...cardBg }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: c.color + "22" }}>
                <Icon name={c.icon} size={18} style={{ color: c.color }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={textPrimary}>{c.label}</div>
                <div className="text-xs" style={textSecondary}>{c.value}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    ),
  },
  resume: {
    title: "Resume.pdf",
    icon: "FileText",
    color: "#ef4444",
    content: (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.15)" }}>
          <Icon name="FileText" size={36} className="text-[#ef4444]" />
        </div>
        <h3 className="text-lg font-semibold" style={textPrimary}>John_Doe_Resume.pdf</h3>
        <p className="text-sm mt-1" style={textSecondary}>245 KB &middot; Last updated May 2026</p>
        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white">
            <Icon name="Download" size={14} />
            Download
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" style={{ ...cardBg, ...textPrimary }}>
            <Icon name="Eye" size={14} />
            Preview
          </button>
        </div>
      </div>
    ),
  },
};

interface PortfolioContentProps {
  appId: string;
}

export default function PortfolioContent({ appId }: PortfolioContentProps) {
  const data = portfolioData[appId];
  if (!data) return <div className="p-6" style={textSecondary}>Content not found</div>;

  return (
    <div className="h-full overflow-auto">
      {data.content}
    </div>
  );
}
