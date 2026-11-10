import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Compass,
  LockKeyhole,
  LogOut,
  Sparkles,
} from "lucide-react";
import ModeSelect from "../components/ModeSelect";
import PuzzleRoom from "../components/PuzzleRoom";
import RoomLobby from "../components/RoomLobby";
import { ApiError, apiRequest } from "../lib/api";
import { levels, playableLevels } from "../data/levels";

export default function GamePage({ token, onLogout, onLogin }) {
  const [player, setPlayer] = useState(null);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [error, setError] = useState("");
  const [onlineError, setOnlineError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleComplete = useCallback((completedCount) => {
    setCompletedLevels((current) => Math.max(current, completedCount));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPlayer() {
      setIsLoading(true);
      setError("");

      if (!token) {
        if (active) {
          setPlayer({ id: "GUEST-DEMO", name: "Guest Explorer" });
          setCompletedLevels(0);
          setIsLoading(false);
        }
        return;
      }

      try {
        const result = await apiRequest("/game/progress", { token });
        if (active) {
          setPlayer(result.user);
          setCompletedLevels(result.completedLevels);
        }
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          onLogout();
        } else {
          setError(requestError.message);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadPlayer();
    return () => {
      active = false;
    };
  }, [onLogout, token]);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    let inFlight = false;

    async function refreshPresence() {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await apiRequest("/game/presence/heartbeat", {
          method: "POST",
          token,
        });
        if (active) {
          setOnlinePlayers(result.availablePlayers);
          setInvitations(result.receivedInvitations);
          setOnlineError("");
        }
      } catch (requestError) {
        if (!active) return;
        if (requestError.status === 401) {
          onLogout();
        } else {
          setOnlineError(requestError.message);
        }
      } finally {
        inFlight = false;
      }
    }

    refreshPresence();
    const timer = window.setInterval(refreshPresence, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [onLogout, token]);

  useEffect(() => {
    const roomId = activeGame?.room?.id;
    if (!token || !roomId) return undefined;

    let active = true;
    let inFlight = false;

    async function refreshRoom() {
      if (inFlight) return;
      inFlight = true;
      try {
        const room = await apiRequest(`/game/rooms/${roomId}`, { token });
        if (active) {
          if (room.solved) {
            setCompletedLevels((current) =>
              Math.max(current, room.levelId),
            );
          }
          setActiveGame((current) => {
            if (!current || current.room?.id !== roomId) return current;
            return {
              ...current,
              kind:
                current.kind === "room-lobby" && room.status === "playing"
                  ? "room-game"
                  : current.kind,
              room,
            };
          });
        }
      } catch (requestError) {
        if (active && requestError.status === 404) {
          setError(requestError.message);
          setActiveGame(null);
        } else if (active) {
          setOnlineError(requestError.message);
        }
      } finally {
        inFlight = false;
      }
    }

    refreshRoom();
    const timer = window.setInterval(refreshRoom, 1800);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [activeGame?.room?.id, token]);

  const startVirtualGame = useCallback(
    (mode) => {
      if (!selectedLevel) return;
      setActiveGame({
        kind: "virtual-game",
        levelId: selectedLevel.id,
        mode,
        room: null,
      });
      setSelectedLevel(null);
    },
    [selectedLevel],
  );

  const createOnlineRoom = useCallback(
    async (mode) => {
      if (!token || !selectedLevel) return;
      setError("");
      setOnlineError("");
      try {
        const room = await apiRequest("/game/rooms", {
          method: "POST",
          token,
          body: JSON.stringify({ levelId: selectedLevel.id, mode }),
        });
        setActiveGame({
          kind: "room-lobby",
          levelId: selectedLevel.id,
          mode,
          room,
        });
        setSelectedLevel(null);
      } catch (requestError) {
        setOnlineError(requestError.message);
      }
    },
    [selectedLevel, token],
  );

  const joinOnlineRoom = useCallback((room) => {
    setActiveGame({
      kind: room.status === "playing" ? "room-game" : "room-lobby",
      levelId: room.levelId,
      mode: room.mode,
      room,
    });
    setSelectedLevel(null);
  }, []);

  const acceptInvitation = useCallback(
    async (invitation) => {
      try {
        const room = await apiRequest(
          `/game/invitations/${invitation.id}/accept`,
          { method: "POST", token },
        );
        joinOnlineRoom(room);
      } catch (requestError) {
        setOnlineError(requestError.message);
      }
    },
    [joinOnlineRoom, token],
  );

  const startOnlineGame = useCallback((room) => {
    setActiveGame((current) =>
      current ? { ...current, kind: "room-game", room } : current,
    );
  }, []);

  const exitGame = useCallback(() => {
    const roomId = activeGame?.room?.id;
    if (token && roomId) {
      apiRequest(`/game/rooms/${roomId}/participants/me`, {
        method: "DELETE",
        token,
      }).catch((requestError) => setOnlineError(requestError.message));
    }
    setActiveGame(null);
    setSelectedLevel(null);
  }, [activeGame?.room?.id, token]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080c0b] text-amber-200">
        <p aria-live="polite">Loading your adventure...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080c0b] px-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold text-red-300">
            Could not load your game progress.
          </p>
          <p className="mt-2 text-sm text-stone-400">{error}</p>
          <button
            className="mt-5 rounded-lg border border-amber-600 px-5 py-2 text-amber-200 hover:bg-amber-900/30"
            onClick={onLogout}
            type="button"
          >
            Return to the homepage
          </button>
        </div>
      </main>
    );
  }

  if (activeGame?.kind === "room-lobby") {
    return (
      <RoomLobby
        onBack={exitGame}
        onStart={startOnlineGame}
        onlineError={onlineError}
        onlinePlayers={onlinePlayers}
        room={activeGame.room}
        isOwner={activeGame.room.ownerId === player.id}
        token={token}
      />
    );
  }

  if (activeGame?.kind === "room-game" || activeGame?.kind === "virtual-game") {
    return (
      <PuzzleRoom
        key={`${activeGame.room?.id ?? activeGame.mode}-${activeGame.levelId}`}
        levelId={activeGame.levelId}
        mode={activeGame.mode}
        onComplete={handleComplete}
        onExit={exitGame}
        player={player}
        room={activeGame.room}
        token={token}
      />
    );
  }

  const unlockedThrough = Math.min(completedLevels + 1, playableLevels.length);

  return (
    <main className="min-h-screen bg-[#080c0b] text-white">
      <header className="border-b border-amber-900/40 bg-[#0b0e0b]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a className="flex items-center gap-3 text-amber-400" href="/">
            <Compass size={35} aria-hidden="true" />
            <span className="font-serif text-sm font-bold leading-tight tracking-wide sm:text-base">
              LOST
              <br />
              CIVILIZATION
            </span>
          </a>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-right">
              <p className="max-w-40 truncate font-semibold text-amber-100 sm:max-w-64">
                {player.name}
              </p>
              <p className="max-w-40 truncate text-xs text-stone-400 sm:max-w-64">
                  {token ? `Explorer ID · ${player.id}` : "Local demo · progress not saved"}
              </p>
            </div>
            {token ? (
                <button
                  aria-label="Sign out"
                  className="rounded-xl border border-stone-700 p-2.5 text-stone-300 transition hover:border-amber-600 hover:text-amber-300"
                  onClick={onLogout}
                  title="Sign out"
                  type="button"
                >
                  <LogOut size={18} />
                </button>
            ) : (
                <button
                  className="rounded-xl border border-amber-700 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-900/30"
                  onClick={onLogin}
                  type="button"
                >
                  Login
                </button>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-amber-900/30 bg-[radial-gradient(ellipse_at_top,#392612_0%,#11120f_48%,#080c0b_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-700/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-200">
              <Sparkles size={16} aria-hidden="true" />
              <span>
                {Math.min(completedLevels, playableLevels.length)} of{" "}
                {playableLevels.length} mysteries solved
              </span>
            </div>
            <h1 className="font-serif text-4xl font-black leading-tight text-amber-100 sm:text-6xl">
              Choose your expedition.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
              Decode the symbols, reveal hidden clues, and break every seal.
              Each new level adds another challenge. Explore alone, with virtual
              companions, or invite real players online.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="levels-heading"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-500">
              Ten mysteries ready to play
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-amber-100 sm:text-4xl"
              id="levels-heading"
            >
              The expedition
            </h2>
          </div>
          <p className="text-sm text-stone-400">
            {unlockedThrough} of {playableLevels.length} playable levels unlocked
          </p>
        </div>

        {token && invitations.length > 0 && (
          <section
            aria-label="Game invitations"
            className="mb-7 rounded-2xl border border-amber-700/50 bg-amber-950/20 p-5"
          >
            <h3 className="font-semibold text-amber-100">You have game invitations</h3>
            <ul className="mt-3 space-y-2">
              {invitations.map((invitation) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-700 bg-black/20 px-4 py-3"
                  key={invitation.id}
                >
                  <p className="text-sm text-stone-300">
                    <span className="font-semibold text-amber-200">
                      {invitation.from.name}
                    </span>{" "}
                    invited you to Level {invitation.levelId} ({invitation.mode})
                  </p>
                  <button
                    className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-stone-950"
                    onClick={() => acceptInvitation(invitation)}
                    type="button"
                  >
                    Accept invitation
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {error && (
          <p
            aria-live="polite"
            className="mb-6 rounded-lg border border-amber-800/70 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
            role="status"
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => {
            const playable = level.id <= playableLevels.length;
            const unlocked = playable && level.id <= unlockedThrough;
            const completed = level.id <= completedLevels;

            return (
              <article
                className={`group overflow-hidden rounded-2xl border bg-[#11130f] shadow-lg transition duration-300 ${
                  unlocked
                    ? "border-amber-900/50 hover:-translate-y-1 hover:border-amber-500/70 hover:shadow-[0_16px_40px_#0008]"
                    : "border-stone-800"
                }`}
                key={level.id}
              >
                <div className="relative h-80 overflow-hidden">
                  <img
                    alt={level.location}
                    className={`h-full w-full object-cover transition duration-500 ${
                      unlocked ? "group-hover:scale-105" : "scale-105 grayscale"
                    }`}
                    loading="lazy"
                    src={level.image}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-black/20" />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-4 left-5 text-5xl text-amber-300 drop-shadow-[0_0_14px_#f59e0b88]"
                  >
                    {level.symbol}
                  </span>
                  <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-sm">
                    LEVEL {String(level.id).padStart(2, "0")}
                  </span>
                  {completed && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950">
                      <Check size={14} aria-hidden="true" />
                      SOLVED
                    </span>
                  )}
                  {!unlocked && (
                    <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/50 text-amber-200 backdrop-blur-sm">
                      {playable ? (
                        <LockKeyhole size={20} aria-label="Locked" />
                      ) : (
                        <Clock3 size={20} aria-label="Coming soon" />
                      )}
                    </span>
                  )}
                </div>

                <div className="flex min-h-40 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                    {level.location}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-amber-100">
                    {level.name}
                  </h3>
                  <button
                    className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition ${
                      unlocked
                        ? "mt-5 bg-linear-to-b from-amber-300 to-amber-600 text-stone-950 hover:brightness-110"
                        : "mt-5 cursor-not-allowed bg-stone-800 text-stone-500"
                    }`}
                    disabled={!unlocked}
                    onClick={() => setSelectedLevel(level)}
                    type="button"
                  >
                    {unlocked ? (
                      completed ? (
                        "Play again"
                      ) : (
                        "Choose game mode"
                      )
                    ) : playable ? (
                      <>
                        <LockKeyhole size={15} aria-hidden="true" />
                        Solve the previous level
                      </>
                    ) : (
                      <>
                        <Clock3 size={15} aria-hidden="true" />
                        Coming soon
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-amber-900/30 px-5 py-7 text-center text-sm text-stone-500">
        Lost Civilization · Every clue leads somewhere.
      </footer>

      {selectedLevel && (
        <ModeSelect
          invitations={invitations}
          level={selectedLevel}
          onClose={() => setSelectedLevel(null)}
          onCreateOnline={createOnlineRoom}
          onJoinRoom={joinOnlineRoom}
          onStartVirtual={startVirtualGame}
          onlineError={onlineError}
          onlinePlayers={onlinePlayers}
          token={token}
        />
      )}
    </main>
  );
}
