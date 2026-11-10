import { useState } from "react";
import { Compass, Cpu, Users, UserRound, X } from "lucide-react";
import { apiRequest } from "../lib/api";

const modes = [
  { id: "solo", name: "Solo", players: "1 player", icon: UserRound },
  { id: "duo", name: "Duo", players: "2 players", icon: Users },
  { id: "team", name: "Team", players: "3 players", icon: Compass },
];

export default function ModeSelect({
  level,
  token,
  onlinePlayers,
  invitations,
  onlineError,
  onClose,
  onStartVirtual,
  onCreateOnline,
  onJoinRoom,
}) {
  const [selectedMode, setSelectedMode] = useState("solo");
  const [busyInvitation, setBusyInvitation] = useState("");
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [error, setError] = useState("");

  async function createInviteLobby() {
    setIsCreatingLobby(true);
    setError("");
    try {
      await onCreateOnline(selectedMode);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCreatingLobby(false);
    }
  }

  async function acceptInvitation(invitation) {
    setBusyInvitation(invitation.id);
    setError("");

    try {
      const room = await apiRequest(
        `/game/invitations/${invitation.id}/accept`,
        { method: "POST", token },
      );
      onJoinRoom(room);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyInvitation("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="mode-title"
        aria-modal="true"
        className="my-auto w-full max-w-3xl rounded-3xl border border-amber-700/50 bg-[#11130f] p-6 shadow-2xl sm:p-9"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
              Level {String(level.id).padStart(2, "0")}
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-amber-100"
              id="mode-title"
            >
              {level.name}
            </h2>
            <p className="mt-2 text-stone-400">Choose how you want to explore.</p>
          </div>
          <button
            aria-label="Close mode selection"
            className="rounded-full p-2 text-stone-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {modes.map(({ id, name, players, icon: Icon }) => (
            <button
              aria-pressed={selectedMode === id}
              className={`rounded-2xl border p-5 text-left transition ${
                selectedMode === id
                  ? "border-amber-400 bg-amber-400/10 text-amber-100"
                  : "border-stone-700 bg-black/20 text-stone-300 hover:border-stone-500"
              }`}
              key={id}
              onClick={() => setSelectedMode(id)}
              type="button"
            >
              <Icon size={25} aria-hidden="true" />
              <span className="mt-4 block font-serif text-xl font-bold">
                {name}
              </span>
              <span className="mt-1 block text-sm text-stone-400">{players}</span>
            </button>
          ))}
        </div>

        {selectedMode === "solo" ? (
          <div className="mt-6 rounded-2xl border border-stone-700/80 bg-black/20 p-5">
            <p className="font-semibold text-stone-200">Explore alone</p>
            <p className="mt-1 text-sm leading-6 text-stone-400">
              Solve {level.id} connected challenges and uncover the secret.
            </p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-amber-300 to-amber-600 px-5 py-3 font-bold text-stone-950 transition hover:brightness-110"
              onClick={() => onStartVirtual("solo")}
              type="button"
            >
              <Cpu size={18} aria-hidden="true" />
              Start solo
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-900/50 bg-amber-950/15 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-100">Invite real players</p>
                <p className="mt-1 text-sm text-stone-400">
                  {onlinePlayers.length} real player
                  {onlinePlayers.length === 1 ? "" : "s"} online
                </p>
              </div>
              {token && (
                <button
                  className="rounded-xl border border-amber-600 px-4 py-2.5 font-semibold text-amber-200 transition hover:bg-amber-900/30"
                  disabled={isCreatingLobby}
                  onClick={createInviteLobby}
                  type="button"
                >
                  {isCreatingLobby
                    ? "Creating lobby..."
                    : "Create room & invite"}
                </button>
              )}
            </div>
            {onlineError && (
              <p className="mt-3 text-sm text-red-300" role="status">
                {onlineError}
              </p>
            )}
          </div>
        )}

        {selectedMode !== "solo" &&
          (!token || onlinePlayers.length === 0) && (
            <div className="mt-4 rounded-2xl border border-stone-700/80 bg-black/20 p-5">
              <p className="font-semibold text-stone-200">
                {token ? "No real explorers are online" : "Play while signed out"}
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-400">
                {token
                  ? "Bring virtual companions for now, or return when friends are online."
                  : "Sign in later to invite real players. You can play with virtual companions now."}
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-b from-amber-300 to-amber-600 px-5 py-3 font-bold text-stone-950 transition hover:brightness-110"
                onClick={() => onStartVirtual(selectedMode)}
                type="button"
              >
                <Cpu size={18} aria-hidden="true" />
                Start with virtual companions
              </button>
            </div>
          )}

        {token && invitations.length > 0 && (
          <section aria-label="Game invitations" className="mt-5">
            <h3 className="font-semibold text-stone-200">Invitations</h3>
            <ul className="mt-2 space-y-2">
              {invitations.map((invitation) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-700 bg-black/20 p-3"
                  key={invitation.id}
                >
                  <p className="text-sm text-stone-300">
                    <span className="font-semibold text-amber-200">
                      {invitation.from.name}
                    </span>{" "}
                    invited you to Level {invitation.levelId} ({invitation.mode})
                  </p>
                  <button
                    className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-stone-950 disabled:opacity-50"
                    disabled={busyInvitation === invitation.id}
                    onClick={() => acceptInvitation(invitation)}
                    type="button"
                  >
                    {busyInvitation === invitation.id ? "Joining..." : "Accept"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(error || onlineError) && (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error || onlineError}
          </p>
        )}
      </section>
    </div>
  );
}
