
import {
  House,
  UserRound,
  Puzzle,
  ChartNoAxesColumnIncreasing,
  Users,
  ArrowRight,
  Play,
  Compass,
  Mountain,
} from "lucide-react";

const templeBg =
  "https://images.unsplash.com/photo-1713711188502-a3540228bf9d?auto=format&fit=crop&w=2400&q=85";

const features = [
  {
    icon: Puzzle,
    title: "Multiple Game Modes",
    description: "Play Solo, with a Friend, or as a Team",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Explorer Progress",
    description: "Save your journey across all 10 challenging levels",
  },
];

const modes = [
  {
    icon: UserRound,
    title: "Solo Mode",
    description: "Play on your own and uncover the secrets.",
    button: "Play Solo",
  },
  {
    icon: Users,
    title: "Duo Mode",
    description: "Team up with a friend and solve together.",
    button: "Play Duo",
  },
  {
    icon: Users,
    title: "Team Mode",
    description: "Invite two explorers and uncover the mystery together.",
    button: "Play Team",
  },
];

function Home({ onLogin, onStartJourney }) {
  return (
    <main className="min-h-screen bg-[#080c0b] text-white">

      {/* HERO BACKGROUND */}
      <section
        id="home"
        className="relative min-h-187.5 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${templeBg})` }}
      >
        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 bg-linear-to-t from-[#080c0b] via-transparent to-black/40" />

        <div className="relative z-10">

          {/* NAVBAR */}
          <header className="mx-auto flex max-w-375 items-center justify-between px-6 py-5 lg:px-12">

            {/* LOGO */}
            <a href="#" className="flex items-center gap-2 text-amber-400">
              <Compass size={42} />
              <span className="font-serif text-xl font-bold leading-tight">
                LOST
                <br />
                CIVILIZATION
              </span>
            </a>

            {/* NAVIGATION */}
            <nav className="hidden items-center gap-8 lg:flex">
              {[
                { icon: House, name: "Home" },
                { icon: Mountain, name: "Modes" },
                { icon: UserRound, name: "About", href: "#adventure" },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.name}
                    href={
                      item.href ??
                      `#${item.name.toLowerCase().replaceAll(" ", "-")}`
                    }
                    className="flex items-center gap-2 font-semibold text-gray-200 transition hover:text-amber-400"
                  >
                    <Icon size={19} />
                    {item.name}
                  </a>
                );
              })}
            </nav>

            {/* LOGIN */}
            <button
              className="rounded-xl border border-amber-300 bg-linear-to-b from-amber-400 to-amber-600 px-5 py-3 font-bold text-black shadow-[0_0_20px_#f59e0b55] transition hover:scale-105"
              onClick={onLogin}
              type="button"
            >
              <span className="flex items-center gap-2">
                <UserRound size={18} />
                Log In
              </span>
            </button>
          </header>

          {/* HERO CONTENT */}
          <div className="mx-auto flex max-w-375 px-6 lg:px-12">
            <div className="max-w-155 py-20 text-center md:py-24">

              <Compass
                size={100}
                className="mx-auto mb-2 text-amber-400 drop-shadow-[0_0_20px_#f59e0b]"
              />

              <h1 className="font-serif text-5xl font-black uppercase leading-[0.95] text-amber-400 drop-shadow-[0_0_25px_#f59e0b] md:text-7xl">
                Lost
                <br />
                Civilization
              </h1>

              <h2 className="mt-7 font-serif text-xl font-bold leading-relaxed text-amber-100 md:text-2xl">
                Unravel the Mystery. Solve the Puzzles.
                <br />
                Discover the Lost Truth.
              </h2>

              <div className="mx-auto my-5 h-0.5 w-64 bg-linear-to-r from-transparent via-amber-400 to-transparent" />

              <p className="mx-auto max-w-md text-base leading-7 text-gray-200">
                In the year 2099, a team of explorers discovers an ancient underground civilization. Inside the ruins, they find a mysterious device called the Heart of Eternity.
              </p>

              <button
                className="mt-8 inline-flex items-center gap-3 rounded-full border-2 border-amber-300 bg-linear-to-b from-amber-300 to-amber-600 px-10 py-4 font-serif text-lg font-bold text-black shadow-[0_0_30px_#f59e0b88] transition hover:scale-105 hover:shadow-[0_0_45px_#f59e0b]"
                onClick={onStartJourney}
                type="button"
              >
                <Play size={21} fill="black" />
                Explore Our Fleet
              </button>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="relative z-20 mx-auto grid max-w-350 grid-cols-1 gap-5 px-6 pb-10 md:grid-cols-3 lg:px-12">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="flex items-center gap-6 rounded-2xl border border-amber-600/60 bg-[#160e08]/90 p-5 shadow-[0_0_20px_#000] backdrop-blur-sm transition hover:border-amber-300"
              >
                <Icon
                  size={45}
                  className="shrink-0 text-amber-400 drop-shadow-[0_0_12px_#f59e0b]"
                />

                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-200">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* GAME MODES */}
      <section id="modes" className="mx-auto max-w-375 px-6 py-12 lg:px-12">

        <div className="mb-8 flex items-center gap-5">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-amber-500" />
          <h2 className="font-serif text-3xl font-bold text-amber-400">
            Game Modes
          </h2>
          <div className="h-px flex-1 bg-linear-to-l from-transparent to-amber-500" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {modes.map((mode) => {
            const Icon = mode.icon;

            return (
              <div
                key={mode.title}
                className="rounded-2xl border border-amber-600/60 bg-linear-to-br from-[#25211c] to-[#0c0b09] p-7 shadow-xl transition duration-300 hover:-translate-y-2 hover:border-amber-300 hover:shadow-[0_0_25px_#f59e0b30]"
              >
                <div className="flex items-center gap-5">
                  <Icon
                    size={58}
                    className="shrink-0 text-amber-400 drop-shadow-[0_0_12px_#f59e0b]"
                  />

                  <div>
                    <h3 className="font-serif text-xl font-bold text-amber-200">
                      {mode.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {mode.description}
                    </p>
                  </div>
                </div>

                <button
                  className="mt-6 ml-auto flex items-center gap-2 rounded-lg border border-amber-400 bg-linear-to-b from-amber-300 to-amber-600 px-6 py-3 font-serif font-bold text-black transition hover:brightness-110"
                  onClick={onStartJourney}
                  type="button"
                >
                  {mode.button}
                  <ArrowRight size={18} />
                </button>
              </div>
            );
          })}

        </div>
      </section>

      {/* BOTTOM CALL TO ACTION */}
      <section
        className="mx-6 mb-12 rounded-2xl border border-amber-500/70 bg-linear-to-br from-[#b87529] via-[#f2bd69] to-[#8a4815] px-6 py-12 text-center shadow-[0_0_30px_#f59e0b22] md:mx-auto md:max-w-350"
        id="adventure"
      >

        <h2 className="font-serif text-3xl font-black text-[#211306] md:text-4xl">
          Ready for the Adventure?
        </h2>

        <p className="mx-auto mt-4 max-w-lg font-semibold leading-7 text-[#301b08]">
          Join the Lost Civilization and become a part of
          this legendary journey!
        </p>

        <button
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#351d08] px-8 py-3 font-bold text-amber-300 shadow-lg transition hover:bg-black"
          onClick={onStartJourney}
          type="button"
        >
          Explore Our Fleet
          <ArrowRight size={19} />
        </button>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-amber-900/50 px-6 py-7 text-center text-sm text-gray-400">
        © 2026 Lost Civilization. All Rights Reserved.
      </footer>

    </main>
  );
}

export default Home;
