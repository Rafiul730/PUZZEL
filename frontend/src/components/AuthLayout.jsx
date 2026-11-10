import { ArrowLeft, Compass } from "lucide-react";

const expeditionImage =
  "https://images.unsplash.com/photo-1713711188502-a3540228bf9d?auto=format&fit=crop&w=1400&q=85";

export default function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080c0b] px-4 py-8 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#5b361b_0%,transparent_55%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-4xl border border-amber-800/40 bg-[#11130f]/95 shadow-[0_24px_90px_#000b] md:min-h-162.5 md:grid-cols-[0.9fr_1.1fr]">
        <aside
          className="relative hidden bg-cover bg-center md:flex md:flex-col md:justify-between md:p-10"
          style={{ backgroundImage: `url(${expeditionImage})` }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/45 to-[#080c0b]/95" />
          <a
            className="relative flex items-center gap-3 text-amber-300"
            href="/"
          >
            <Compass size={38} aria-hidden="true" />
            <span className="font-serif text-lg font-bold leading-tight tracking-wide">
              LOST
              <br />
              CIVILIZATION
            </span>
          </a>
          <div className="relative pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
              Your next discovery
            </p>
            <h1 className="mt-4 font-serif text-4xl font-black leading-tight text-white">
              Every clue
              <br />
              leads somewhere.
            </h1>
            <p className="mt-4 max-w-sm leading-7 text-stone-200">
              Create an explorer profile, save your progress, and uncover the
              secrets hidden across ten ancient expeditions.
            </p>
          </div>
          <p className="relative text-xs text-stone-300">
            Secure account access · Progress saved to your profile
          </p>
        </aside>

        <section className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
          <a
            className="mb-9 inline-flex items-center gap-2 self-start text-sm text-stone-400 transition hover:text-amber-200"
            href="/"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to the expedition
          </a>

          <a
            className="mb-7 flex items-center justify-center gap-2 text-amber-400 md:hidden"
            href="/"
          >
            <Compass size={30} aria-hidden="true" />
            <span className="font-serif text-sm font-bold leading-tight">
              LOST CIVILIZATION
            </span>
          </a>

          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500">
              {eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-amber-50 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 leading-6 text-stone-400">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
