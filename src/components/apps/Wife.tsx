"use client";

export default function Wife() {
  return (
    <div
      className="h-full overflow-auto flex flex-col items-center px-8 py-10"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Framed portrait */}
      <div
        className="rounded-2xl p-3"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--window-shadow)",
        }}
      >
        <div
          className="overflow-hidden rounded-xl"
          style={{ width: 240, aspectRatio: "3 / 4" }}
        >
          <img
            src="/images/ryujin-gf.jpg"
            alt="My wife"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      </div>

      {/* Name */}
      <h1 className="text-2xl font-bold mt-6">Kanza</h1>
      <p
        className="text-xs uppercase tracking-wider mt-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        Interior Architect · Married 25 June 2025
      </p>

      {/* Short narrative */}
      <p
        className="text-sm leading-relaxed text-center max-w-sm mt-4"
        style={{ color: "var(--text-secondary)" }}
      >
        We first crossed paths at a tutoring class back in 6th grade — though it
        took until high school for the story to actually begin. She&apos;s an
        interior architect: persistent, sharp, refreshingly down-to-earth, and
        somehow as bright as the sun even on a Monday. I married her on 25 June
        2025, which is still the best idea I&apos;ve ever had — and I have a lot
        of ideas.
      </p>
    </div>
  );
}
