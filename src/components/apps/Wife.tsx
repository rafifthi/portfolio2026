"use client";

export default function Wife() {
  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex-1 overflow-auto">
        {/* Hero image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src="https://picsum.photos/seed/karina/600/400"
            alt="My wife"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, var(--bg-app) 0%, transparent 50%)" }}
          />
        </div>

        <div className="px-8 pb-8 -mt-8 relative">
          <h1 className="text-3xl font-bold mb-1">My Wife</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            The person who keeps me grounded and inspired.
          </p>

          <div className="space-y-4 max-w-lg">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We met in the most unexpected way — through a mutual friend's birthday party that I almost didn't attend. She was standing by the dessert table, debating between chocolate cake and cheesecake, and I somehow found the courage to suggest getting both.
            </p>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              That small conversation turned into hours of talking about everything — our favorite movies, childhood dreams, and our shared love for late-night ramen runs. Three years later, she's still my favorite person to share a bowl of ramen with at 2 AM.
            </p>

            <div
              className="p-4 rounded-xl text-sm leading-relaxed"
              style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            >
              "She believes in me even when I don't believe in myself. She proofreads my code comments, tests my buggy apps, and still pretends to be impressed when I explain recursion for the hundredth time."
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              She's a pediatric nurse who somehow manages to be the most patient person I know — both with her patients and with me when I'm debugging at 3 AM. Her laugh is my favorite notification sound, and her presence is the only dependency I can't live without.
            </p>

            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We're currently planning our wedding (hence the Digital Invitation project) and dreaming of a honeymoon in Japan. She's the reason I build things — because everything I create is somehow an attempt to make her smile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
