/**
 * Studio lighting background effect.
 * Renders soft radial-gradient glows that simulate overhead + fill lights
 * bouncing green-tinted light across the page. Pure CSS, no JS overhead.
 * Adapts automatically to light/dark theme via opacity classes.
 */
export function StudioBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* ── Key light — large overhead ellipse, top-center ── */}
      <div
        className="studio-key-light absolute -top-[15%] left-1/2 h-[60vh] w-[80vw] rounded-full blur-[80px]"
        style={{
          background:
            "radial-gradient(ellipse at center, #A2CB8B 0%, #84B179 40%, transparent 70%)",
        }}
      />

      {/* ── Hero spotlight — concentrated green glow right behind hero content ── */}
      <div
        className="absolute left-1/2 top-[8%] h-[35vh] w-[50vw] -translate-x-1/2 rounded-full opacity-[0.07] blur-[60px] dark:opacity-[0.10]"
        style={{
          background:
            "radial-gradient(ellipse at center, #93BE82 0%, #A2CB8B 30%, transparent 65%)",
        }}
      />

      {/* ── Fill light left — warm accent from the left edge ── */}
      <div
        className="studio-fill-left absolute left-[-10%] top-[30%] h-[50vh] w-[40vw] rounded-full opacity-[0.08] blur-[70px] dark:opacity-[0.09]"
        style={{
          background:
            "radial-gradient(ellipse at center, #C7EABB 0%, #93BE82 50%, transparent 75%)",
        }}
      />

      {/* ── Fill light right — cooler green from the right edge ── */}
      <div
        className="studio-fill-right absolute right-[-8%] top-[20%] h-[45vh] w-[35vw] rounded-full opacity-[0.07] blur-[70px] dark:opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse at center, #B5DAA3 0%, #84B179 50%, transparent 75%)",
        }}
      />

      {/* ── Rim light — subtle bottom accent that grounds the page ── */}
      <div
        className="absolute -bottom-[10%] left-1/2 h-[30vh] w-[70vw] -translate-x-1/2 rounded-full opacity-[0.12] blur-[60px] dark:opacity-[0.10]"
        style={{
          background:
            "radial-gradient(ellipse at center, #D8EFBC 0%, #A2CB8B 40%, transparent 70%)",
        }}
      />

      {/* ── Mid-page wash — a wide, barely-visible fill at mid-scroll ── */}
      <div
        className="absolute left-[10%] top-[60%] h-[40vh] w-[60vw] rounded-full opacity-[0.12] blur-[80px] dark:opacity-[0.07]"
        style={{
          background:
            "radial-gradient(ellipse at center, #E8F5BD 0%, #C7EABB 40%, transparent 70%)",
        }}
      />

      {/* ── Subtle dot grid overlay — adds studio-floor texture ── */}
      <div
        className="absolute inset-0 opacity-[0.045] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-brand-700) 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
