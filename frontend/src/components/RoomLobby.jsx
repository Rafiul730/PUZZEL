import { useState } from "react";
import { ArrowLeft, Check, Clock3, Send, Users } from "lucide-react";
import { apiRequest } from "../lib/api";

export default function RoomLobby({
  room,
  token,
  isOwner,
  onlinePlayers,
  onlineError,
  onStart,
  onBack,
}) {
  const [invitedPlayers, setInvitedPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const hasRealTeammate = room.participants.some(
    (participant) => participant.id !== room.ownerId && !participant.isVirtual,
  );

  async function invitePlayer(player) {
    setMessage("");
    try {
      await apiRequest(`/game/rooms/${room.id}/invitations`, {
        method: "POST",
        token,
        body: JSON.stringify({ toUserId: player.id }),
      });
      setInvitedPlayers((current) => [...current, player.id]);
      setMessage(`Invitation sent to ${player.name}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function startGame() {
    setIsStarting(true);
    setMessage("");
    try {
      const startedRoom = await apiRequest(`/game/rooms/${room.id}/start`, {
        method: "POST",
        token,
      });
      onStart(startedRoom);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0b] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-400 transition hover:text-amber-200"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to levels
        </button>

        <section className="rounded-3xl border border-amber-800/50 bg-[#11130f] p-6 sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
            Level {String(room.levelId).padStart(2, "0")} · {room.mode} mode
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-amber-100 sm:text-4xl">
            Gather your explorers
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-stone-400">
            Invite online players to solve the mystery together. If you start
            before another real player joins, virtual companions can fill the team.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="flex items-center gap-2 font-semibold text-stone-200">
                <Users size={18} aria-hidden="true" />
                Your team ({room.participants.length}/{room.capacity})
              </h2>
              <ul className="mt-3 space-y-2">
                {room.participants.map((participant) => (
                  <li
                    className="flex items-center justify-between rounded-xl border border-stone-700 bg-black/20 px-4 py-3"
                    key={participant.id}
                  >
                    <span className="font-medium text-stone-200">
                      {participant.name}
                    </span>
                    <span className="text-xs text-stone-500">
                      {participant.id === room.ownerId
                        ? "Host"
                        : participant.isVirtual
                          ? "Virtual explorer"
                          : "Player"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                <Clock3 size={14} aria-hidden="true" />
                {room.status === "waiting"
                  ? "Invite real players, or start with virtual companions if nobody is available."
                  : "The game is ready."}
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-200">
                {isOwner ? "Online players" : "Lobby"}
              </h2>
              {!isOwner ? (
                <p className="mt-3 rounded-xl border border-dashed border-stone-700 px-4 py-5 text-sm leading-6 text-stone-500">
                  The host will start the puzzle when everyone is ready. This
                  page updates automatically.
                </p>
              ) : onlinePlayers.length ? (
                <ul className="mt-3 space-y-2">
                  {onlinePlayers.map((player) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-700 bg-black/20 px-4 py-3"
                      key={player.id}
                    >
                      <span className="truncate font-medium text-stone-200">
                        {player.name}
                      </span>
                      {invitedPlayers.includes(player.id) ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-300">
                          <Check size={14} aria-hidden="true" />
                          Invited
                        </span>
                      ) : (
                        <button
                          className="rounded-lg border border-amber-700 px-3 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-900/30"
                          onClick={() => invitePlayer(player)}
                          type="button"
                        >
                          Invite
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-stone-700 px-4 py-5 text-sm leading-6 text-stone-500">
                  No other players are online right now. You can invite someone
                  when they appear, or start with virtual companions.
                </p>
              )}
            </section>
          </div>

          {(message || onlineError) && (
            <p
              aria-live="polite"
              className="mt-5 rounded-lg border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200"
              role="status"
            >
              {message || onlineError}
            </p>
          )}

          {isOwner && (
            <button
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-amber-300 to-amber-600 px-5 py-3.5 font-bold text-stone-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              disabled={isStarting}
              onClick={startGame}
              type="button"
            >
              <Send size={17} aria-hidden="true" />
              {isStarting
                ? "Preparing game..."
                : hasRealTeammate
                  ? "Start with your team"
                  : "Start with virtual companions"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
