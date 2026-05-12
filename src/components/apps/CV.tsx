"use client";

import { Icon } from "@/components/Icon";

export default function CV() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#f5f5f5" }}>
      {/* Toolbar */}
      <div className="h-10 flex items-center px-4 border-b bg-white gap-2">
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <Icon name="Printer" size={14} />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <Icon name="Download" size={14} />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">CV_ATS_Friendly.pdf</span>
      </div>

      {/* CV Document */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        <div className="max-w-[680px] mx-auto bg-white shadow-sm rounded-sm">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b-2 border-gray-900">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RAFIFTHI AQIL</h1>
            <p className="text-sm text-gray-600 mt-1">Frontend Engineer & UI Designer</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Icon name="Mail" size={11} /> rafifthii@gmail.com
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Phone" size={11} /> +62 812-3456-7890
              </span>
              <span className="flex items-center gap-1">
                <Icon name="MapPin" size={11} /> Jakarta, Indonesia
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Link" size={11} /> linkedin.com/in/rafifthi
              </span>
              <span className="flex items-center gap-1">
                <Icon name="GitBranch" size={11} /> github.com/rafifthi
              </span>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Summary */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                Professional Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Frontend engineer with 5+ years of experience building scalable web applications and design systems. Specialized in React ecosystem, TypeScript, and modern CSS architectures. Proven track record of reducing bundle sizes by 40% and improving Core Web Vitals. Strong eye for UI/UX detail with a focus on performance, accessibility, and developer experience.
              </p>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                Technical Skills
              </h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Languages:</span>{" "}
                  <span className="text-gray-700">TypeScript, JavaScript (ES6+), HTML5, CSS3, SQL</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Frameworks:</span>{" "}
                  <span className="text-gray-700">React, Next.js, Vue.js, Node.js, Express</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Styling:</span>{" "}
                  <span className="text-gray-700">Tailwind CSS, Styled Components, SCSS, CSS Modules</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Tools:</span>{" "}
                  <span className="text-gray-700">Git, Docker, Vite, Webpack, Figma, Jest, Cypress</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Databases:</span>{" "}
                  <span className="text-gray-700">PostgreSQL, MongoDB, Redis, Prisma ORM</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Cloud:</span>{" "}
                  <span className="text-gray-700">AWS (S3, Lambda, EC2), Vercel, Supabase</span>
                </div>
              </div>
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                Professional Experience
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-gray-900">Senior Frontend Engineer</h3>
                    <span className="text-xs text-gray-500">Jan 2023 — Present</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">TechCorp Inc. — Jakarta, Indonesia</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-gray-700 list-disc list-inside">
                    <li>Led frontend architecture for SaaS platform serving 50K+ daily active users</li>
                    <li>Reduced initial bundle size by 40% through aggressive code splitting and tree shaking</li>
                    <li>Mentored team of 4 junior developers, establishing code review practices</li>
                    <li>Improved Lighthouse score from 62 to 94 across all Core Web Vitals metrics</li>
                  </ul>
                </div>

                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-gray-900">Full Stack Developer</h3>
                    <span className="text-xs text-gray-500">Jun 2021 — Dec 2022</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">StartupXYZ — Jakarta, Indonesia</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-gray-700 list-disc list-inside">
                    <li>Built core product from MVP to 100K users in 18 months</li>
                    <li>Implemented real-time features using WebSockets and Redis pub/sub</li>
                    <li>Designed PostgreSQL schema supporting 1M+ records with sub-100ms queries</li>
                    <li>Integrated Stripe payments and automated invoicing system</li>
                  </ul>
                </div>

                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-gray-900">Frontend Developer</h3>
                    <span className="text-xs text-gray-500">Aug 2019 — May 2021</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Agency Pro — Jakarta, Indonesia</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-gray-700 list-disc list-inside">
                    <li>Developed 20+ websites and web apps for clients across fintech, e-commerce, healthcare</li>
                    <li>Specialized in React and Next.js with a focus on SEO and performance</li>
                    <li>Collaborated with design team to implement pixel-perfect responsive layouts</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                Selected Projects
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-gray-900">Lumona ERP</h3>
                    <span className="text-xs text-gray-500">Next.js, Prisma, PostgreSQL</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Enterprise resource planning system for SMEs. Features: multi-warehouse inventory, automated tax reporting, real-time analytics dashboard. Onboarded 50+ SMEs within 6 months.
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-gray-900">Siti Khadija Loyalty App</h3>
                    <span className="text-xs text-gray-500">React Native, Firebase, Node.js</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Digital loyalty and rewards platform for fashion boutiques. 3,500+ active users, 45% increase in repeat purchases, tiered membership system with referral rewards.
                  </p>
                </div>
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                Education
              </h2>
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">B.S. Computer Science</h3>
                  <p className="text-sm text-gray-700">Universitas Indonesia</p>
                </div>
                <span className="text-xs text-gray-500">2015 — 2019</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">GPA: 3.72/4.00 — Cum Laude</p>
            </section>

            {/* Certifications */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-1 mb-3">
                Certifications
              </h2>
              <div className="space-y-1.5 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>AWS Certified Solutions Architect — Associate</span>
                  <span className="text-xs text-gray-500">2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Meta Front-End Developer Professional Certificate</span>
                  <span className="text-xs text-gray-500">2023</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
