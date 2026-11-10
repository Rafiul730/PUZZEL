import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Lightbulb,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../lib/api";
import { levels } from "../data/levels";

const symbolGlyphs = ["✦", "◇", "⟡"];

function localParticipants(mode, player) {
  const count = mode === "team" ? 3 : mode === "duo" ? 2 : 1;
  const virtualNames = ["Archivist Lyra", "Scout Orion"];
  return Array.from({ length: count }, (_, index) => ({
    id: index === 0 ? player.id : `virtual-${index}`,
    name: index === 0 ? player.name : virtualNames[index - 1],
    clueIndex: index,
    isVirtual: index > 0,
  }));
}

function normalizeAnswer(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(a|an)\s+/, "")
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");
}

export default function PuzzleRoom({
  levelId,
  mode,
  player,
  token,
  room,
  onComplete,
  onExit,
}) {
  const level = levels.find((entry) => entry.id === levelId);
  const [localChallengeIndex, setLocalChallengeIndex] = useState(0);
  const challengeIndex = Math.max(
    localChallengeIndex,
    room?.challengeIndex ?? 0,
  );
  const [revealedClues, setRevealedClues] = useState(() => new Set());
  const [revealedHint, setRevealedHint] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSolveLocally, setDidSolveLocally] = useState(false);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const challenge = level?.challenges[challengeIndex];
  const isComplete = didSolveLocally || Boolean(room?.solved);
  const participants = room?.participants ?? localParticipants(mode, player);
  const virtualCompanions = participants.filter(
    (participant) => participant.isVirtual,
  );
  const visibleMessages = room?.messages ?? localMessages;

  if (!level) {
    return null;
  }

  async function shareMessage(text, senderName = player.name) {
    const message = text.trim();
    if (!message) return;

    if (room && token) {
      await apiRequest(`/game/rooms/${room.id}/messages`, {
        method: "POST",
        token,
        body: JSON.stringify({ text: message }),
      });
    } else {
      setLocalMessages((messages) => [
        ...messages,
        {
          id: `${Date.now()}-${messages.length}`,
          userId: player.id,
          name: senderName,
          text: message,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  async function handleShare(event) {
    event.preventDefault();
    setFeedback("");
    try {
      await shareMessage(draft);
      setDraft("");
    } catch (requestError) {
      setFeedback(requestError.message);
    }
  }

  async function revealCompanionClue(participant) {
    const clue = challenge.clues[participant.clueIndex % challenge.clues.length];
    setRevealedClues((current) =>
      new Set(current).add(participant.clueIndex % challenge.clues.length),
    );
    try {
      await shareMessage(`${participant.name} shares: ${clue}`, participant.name);
    } catch (requestError) {
      setFeedback(requestError.message);
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();
    if (!answer.trim() || isSubmitting || !challenge) return;

    setFeedback("");
    setIsSubmitting(true);
    try {
      let result;
      if (token) {
        const path = room
          ? `/game/rooms/${room.id}/complete`
          : `/game/levels/${level.id}/challenges/${challengeIndex}/answer`;
        result = await apiRequest(path, {
          method: "POST",
          token,
          body: JSON.stringify({ answer, challengeIndex }),
        });
      } else {
        if (normalizeAnswer(answer) !== challenge.answer) {
          setFeedback("That answer does not fit the clues yet. Look closely and try again.");
          return;
        }
        result = {
          completed: challengeIndex === level.id - 1,
          challengeIndex: challengeIndex + 1,
          completedLevels: level.id,
        };
      }

      setAnswer("");
      setRevealedClues(new Set());
      setRevealedHint(false);
      if (result.completed) {
        setDidSolveLocally(true);
        onComplete(result.completedLevels ?? level.id);
      } else {
        setLocalChallengeIndex(result.challengeIndex);
        setFeedback("Seal opened. The next challenge awaits.");
      }
    } catch (requestError) {
      setFeedback(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c0b] px-4 py-6 text-white sm:px-7 sm:py-9">
      <img
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        src={level.image}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#080c0b]/70 via-[#080c0b]/85 to-[#080c0b]" />
      <div className="relative mx-auto max-w-5xl">
        <button
          className="mb-6 inline-flex items-center gap-2 text-sm text-stone-300 transition hover:text-amber-200"
          onClick={onExit}
          type="button"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to levels
        </button>

        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-amber-100/15 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              {level.location} · Level {String(level.id).padStart(2, "0")} · {mode}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-amber-50 sm:text-5xl">
              {level.name}
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-stone-300">
              {level.story}
            </p>
          </div>
          <div className="rounded-full border border-amber-300/30 bg-black/40 px-4 py-2 text-sm font-semibold text-amber-100">
            {level.id} seal{level.id === 1 ? "" : "s"} to break
          </div>
        </header>

        {isComplete ? (
          <section className="mt-10 rounded-3xl border border-emerald-700/60 bg-emerald-950/60 p-8 text-center backdrop-blur-md sm:p-12">
            <Check
              className="mx-auto text-emerald-300"
              size={50}
              aria-hidden="true"
            />
            <h2 className="mt-4 font-serif text-3xl font-bold text-emerald-100">
              Level completed
            </h2>
            <p className="mt-3 text-stone-200">
              All {level.id} challenges solved. The path to the next mystery is open.
            </p>
            <button
              className="mt-7 rounded-xl bg-emerald-400 px-6 py-3 font-bold text-emerald-950 transition hover:bg-emerald-300"
              onClick={onExit}
              type="button"
            >
              Return to levels
            </button>
          </section>
        ) : challenge ? (
          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-amber-100/15 bg-[#0c100f]/75 p-5 shadow-[0_24px_90px_#0009] backdrop-blur-md sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Sparkles size={18} aria-hidden="true" />
                <p className="font-semibold uppercase tracking-[0.18em]">
                  Challenge {challengeIndex + 1} of {level.id}
                </p>
              </div>
              <div
                aria-label={`${challengeIndex} of ${level.id} challenges completed`}
                className="flex gap-1.5"
              >
                {level.challenges.map((_, index) => (
                  <span
                    className={`h-1.5 w-6 rounded-full ${
                      index < challengeIndex ? "bg-emerald-400" : "bg-stone-700"
                    }`}
                    key={index}
                  />
                ))}
              </div>
            </div>

            <p className="mx-auto mt-7 max-w-3xl text-center font-serif text-2xl leading-relaxed text-amber-50 sm:text-3xl">
              “{challenge.puzzle}”
            </p>

            <section aria-labelledby="symbols-title" className="mt-8">
              <h2
                className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-stone-400"
                id="symbols-title"
              >
                Decode the ancient symbols
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {challenge.clues.map((clue, index) => (
                  <div className="min-h-28" key={`${challengeIndex}-${index}`}>
                    {revealedClues.has(index) ? (
                      <p className="flex h-full min-h-28 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-950/50 p-4 text-center text-sm leading-6 text-amber-100">
                        {clue}
                      </p>
                    ) : (
                      <button
                        aria-label={`Reveal clue ${index + 1}`}
                        className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-amber-100/20 bg-black/35 text-4xl text-amber-300 transition hover:border-amber-400/70 hover:bg-amber-950/40 focus-visible:outline-2 focus-visible:outline-amber-300"
                        onClick={() =>
                          setRevealedClues((current) =>
                            new Set(current).add(index),
                          )
                        }
                        type="button"
                      >
                        <span aria-hidden="true">
                          {index === 0 ? challenge.symbol : symbolGlyphs[index]}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                          Reveal symbol
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {virtualCompanions.length > 0 && (
              <section className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-stone-400">Ask a companion:</span>
                {virtualCompanions.map((companion) => (
                  <button
                    className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-stone-200 hover:border-amber-500"
                    key={companion.id}
                    onClick={() => revealCompanionClue(companion)}
                    type="button"
                  >
                    {companion.name.split(" ")[1]}
                  </button>
                ))}
              </section>
            )}

            <form
              className="mx-auto mt-8 max-w-2xl border-t border-stone-700/70 pt-6"
              onSubmit={submitAnswer}
            >
              <label
                className="mb-2 block text-sm font-medium text-stone-200"
                htmlFor="puzzle-answer"
              >
                Enter the answer to break this seal
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-stone-600 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-amber-400"
                  id="puzzle-answer"
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Your answer..."
                  value={answer}
                />
                <button
                  className="rounded-xl bg-linear-to-b from-amber-300 to-amber-600 px-6 py-3 font-bold text-stone-950 transition hover:brightness-110 disabled:opacity-50"
                  disabled={!answer.trim() || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Checking..." : "Submit answer"}
                </button>
              </div>
            </form>

            {challenge.hints?.length > 0 && (
              <div className="mt-4 text-center">
                {revealedHint ? (
                  <p className="inline-flex items-start gap-2 text-sm leading-6 text-amber-100">
                    <Lightbulb
                      className="mt-1 shrink-0 text-amber-400"
                      size={16}
                      aria-hidden="true"
                    />
                    {challenge.hints[0]}
                  </p>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-200"
                    onClick={() => setRevealedHint(true)}
                    type="button"
                  >
                    <Lightbulb size={15} aria-hidden="true" />
                    Reveal a hint
                  </button>
                )}
              </div>
            )}

            {feedback && (
              <p
                aria-live="polite"
                className="mt-4 rounded-lg border border-amber-900/70 bg-black/40 px-4 py-3 text-center text-sm text-amber-100"
                role="status"
              >
                {feedback}
              </p>
            )}
          </div>
        ) : null}

        {mode !== "solo" && !isComplete && (
          <aside className="mx-auto mt-6 max-w-4xl rounded-2xl border border-stone-800 bg-black/55 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300">
              <MessageCircle size={18} aria-hidden="true" />
              <h2 className="font-semibold">Team expedition chat</h2>
            </div>
            <ul
              aria-live="polite"
              className="mt-4 flex max-h-56 min-h-12 flex-col gap-2 overflow-y-auto"
            >
              {visibleMessages.length ? (
                visibleMessages.map((message) => (
                  <li
                    className="rounded-lg border border-stone-800 bg-white/5 px-3 py-2"
                    key={message.id}
                  >
                    <span className="mr-2 text-xs font-semibold text-amber-400">
                      {message.name}
                    </span>
                    <span className="wrap break-word text-sm text-stone-200">
                      {message.text}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-stone-500">
                  Share clues with your team to solve this mystery together.
                </li>
              )}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={handleShare}>
              <input
                className="min-w-0 flex-1 rounded-lg border border-stone-700 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-stone-500 focus:border-amber-600"
                maxLength={280}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Share a clue..."
                value={draft}
              />
              <button
                aria-label="Send message"
                className="rounded-lg bg-amber-500 px-3 text-stone-950 disabled:opacity-50"
                disabled={!draft.trim()}
                type="submit"
              >
                <Send size={17} aria-hidden="true" />
              </button>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
}
