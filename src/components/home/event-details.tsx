export default function EventDetails() {
  return (
    <section className="px-4 py-14 max-w-2xl mx-auto">
      <p
        className="text-center text-xs uppercase tracking-[0.35em] mb-8"
        style={{ color: "#9A7B6B" }}
      >
        Schedule of Events
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Church Service */}
        <div
          className="rounded-2xl p-6 border"
          style={{ borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" }}
        >
          <div className="text-3xl mb-3">⛪</div>
          <h3
            className="font-bold text-lg mb-1"
            style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
          >
            Church Service
          </h3>
          <p
            className="text-sm font-bold mb-4 tracking-wide"
            style={{ color: "#C07A54" }}
          >
            10:00 AM
          </p>
          <p className="text-sm leading-6" style={{ color: "#6B4A3A" }}>
            Archangels Catholic Church
            <br />
            1 Mission St, Satellite Town
            <br />
            Lagos 102102, Lagos
          </p>
        </div>

        {/* Reception */}
        <div
          className="rounded-2xl p-6 border"
          style={{ borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" }}
        >
          <div className="text-3xl mb-3">🥂</div>
          <h3
            className="font-bold text-lg mb-1"
            style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
          >
            Wedding Reception
          </h3>
          <p
            className="text-sm font-bold mb-4 tracking-wide"
            style={{ color: "#C07A54" }}
          >
            3:00 PM
          </p>
          <p className="text-sm leading-6" style={{ color: "#6B4A3A" }}>
            Canary World
            <br />
            23 Rd, opposite L Close
            <br />
            Festac Town, Lagos 102102, Lagos
          </p>
        </div>
      </div>

      {/* Colours of the Day */}
      <div
        className="mt-5 rounded-2xl p-5 text-center border"
        style={{ borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" }}
      >
        <p
          className="text-xs uppercase tracking-[0.35em] mb-4"
          style={{ color: "#9A7B6B" }}
        >
          Colours of the Day
        </p>
        <div className="flex justify-center gap-4 mb-3">
          {[
            { color: "#D4AF37", label: "Gold" },
            { color: "#8B4513", label: "Brown" },
            { color: "#E8750A", label: "Orange" },
          ].map(({ color, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full shadow-md border-2 border-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs" style={{ color: "#9A7B6B" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>
          Gold, Brown &amp; Orange
        </p>
      </div>
    </section>
  );
}
