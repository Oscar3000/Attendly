export default function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #FFF9F4 0%, #FDF0E6 55%, #FFF9F4 100%)",
      }}
    >
      {/* Gold top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, #C07A54, #D4AF37, #C07A54, transparent)",
        }}
      />

      {/* Monogram */}
      <div
        className="mb-5 text-5xl sm:text-6xl font-bold tracking-widest select-none"
        style={{
          color: "#C07A54",
          fontFamily: "Georgia, serif",
          textShadow: "0 2px 6px rgba(192,122,84,0.25)",
        }}
      >
        P &amp; O
      </div>

      {/* Tagline */}
      <p
        className="text-xs uppercase tracking-[0.35em] mb-6"
        style={{ color: "#9A7B6B" }}
      >
        Solemnly request your presence at their wedding celebration
      </p>

      {/* Couple names */}
      <h1
        className="text-6xl sm:text-8xl font-bold mb-2 leading-tight"
        style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
      >
        Pamela
      </h1>
      <div
        className="text-3xl sm:text-4xl my-1"
        style={{ color: "#C07A54", fontFamily: "Georgia, serif" }}
      >
        &amp;
      </div>
      <h1
        className="text-6xl sm:text-8xl font-bold mb-8 leading-tight"
        style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
      >
        Oscar
      </h1>

      {/* Date pill */}
      <div
        className="px-8 py-3 rounded-full text-base sm:text-lg font-semibold mb-10 tracking-wide"
        style={{ backgroundColor: "#C07A54", color: "#FFFFFF" }}
      >
        May 23rd, 2026
      </div>

      {/* Ornamental divider */}
      <div className="flex items-center gap-3 mb-8 w-full max-w-xs">
        <div className="flex-1 h-px" style={{ backgroundColor: "#D4AF37" }} />
        <span className="text-xl" style={{ color: "#D4AF37" }}>
          ❧
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#D4AF37" }} />
      </div>

      {/* Families */}
      <div
        className="text-center text-sm sm:text-base max-w-sm leading-relaxed"
        style={{ color: "#6B4A3A" }}
      >
        <p className="font-semibold">
          Chief Sunday &amp; Late Lolo Peace Innah
        </p>
        <p className="italic text-xs mb-3" style={{ color: "#9A7B6B" }}>
          (UGO MBA 1 of Ntezi)
        </p>
        <p className="mb-3 text-sm" style={{ color: "#9A7B6B" }}>
          and
        </p>
        <p className="font-semibold">Chief &amp; Lolo Livinus Umeh</p>
        <p className="italic text-xs" style={{ color: "#9A7B6B" }}>
          (Ogbuefi Okunenyeife 1 of Obinofia Ndiuno)
        </p>
      </div>

      {/* Gold bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, #C07A54, #D4AF37, #C07A54, transparent)",
        }}
      />
    </section>
  );
}
