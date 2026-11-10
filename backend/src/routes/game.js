import express from "express";
import mongoose from "mongoose";
import {
  acceptInvitation,
  addRoomMessage,
  completeRoom,
  createRoom,
  getRoom,
  getRoomForPlayer,
  hasPendingInvitation,
  inviteToRoom,
  leaveRoom,
  pruneMultiplayerState,
  startRoom,
  updatePresence,
} from "../services/multiplayer.js";
import User from "../models/User.js";
import requireAuth from "../middleware/requireAuth.js";
import { isCorrectChallengeAnswer } from "../data/levelAnswers.js";

const router = express.Router();

router.use(requireAuth);

router.post("/presence/heartbeat", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name");
    if (!user) {
      return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
    }

    return res.json(updatePresence({ id: user.id, name: user.name }));
  } catch (error) {
    return next(error);
  }
});

router.post("/rooms", async (req, res, next) => {
  const { levelId, mode } = req.body ?? {};

  if (!Number.isInteger(levelId) || levelId < 1 || levelId > 10) {
    return res.status(400).json({ message: "Choose a level from 1 to 10." });
  }

  if (mode !== "duo" && mode !== "team") {
    return res.status(400).json({ message: "Choose duo or team mode to invite players." });
  }

  try {
    const user = await User.findById(req.userId).select("name completedLevels");
    if (!user) {
      return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
    }
    if (user.completedLevels < levelId - 1) {
      return res.status(409).json({ message: "Complete the previous level before inviting players." });
    }

    const room = createRoom({
      user: { id: user.id, name: user.name },
      levelId,
      mode,
    });
    return res.status(201).json(getRoomForPlayer(room, user.id));
  } catch (error) {
    return next(error);
  }
});

router.post("/rooms/:roomId/invitations", async (req, res, next) => {
  const { toUserId } = req.body ?? {};
  if (typeof toUserId !== "string" || !mongoose.isValidObjectId(toUserId)) {
    return res.status(400).json({ message: "Choose a player to invite." });
  }

  try {
    pruneMultiplayerState();
    const room = getRoom(req.params.roomId);
    if (!room || room.ownerId !== req.userId) {
      return res.status(404).json({ message: "Game session not found." });
    }
    if (room.status !== "waiting" || room.participants.length >= room.capacity) {
      return res.status(409).json({ message: "This game session is not accepting players." });
    }
    if (room.participants.some((participant) => participant.id === toUserId)) {
      return res.status(409).json({ message: "This player has already joined the game." });
    }
    if (hasPendingInvitation(room.id, toUserId)) {
      return res.status(409).json({ message: "This player already has a pending invitation." });
    }

    const online = updatePresence({
      id: req.userId,
      name: (await User.findById(req.userId).select("name"))?.name ?? "",
    }).availablePlayers.some((player) => player.id === toUserId);
    if (!online) {
      return res.status(409).json({ message: "That player is no longer online." });
    }

    const [fromUser, toUser] = await Promise.all([
      User.findById(req.userId).select("name"),
      User.findById(toUserId).select("name completedLevels"),
    ]);
    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "Player account not found." });
    }
    if (toUser.completedLevels < room.levelId - 1) {
      return res.status(409).json({ message: "That player has not unlocked this level yet." });
    }

    const invitation = inviteToRoom({
      room,
      from: { id: fromUser.id, name: fromUser.name },
      toUser: { id: toUser.id },
    });
    return res.status(201).json({ invitationId: invitation.id });
  } catch (error) {
    return next(error);
  }
});

router.post("/invitations/:invitationId/accept", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name completedLevels");
    if (!user) {
      return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
    }

    const result = acceptInvitation({
      invitationId: req.params.invitationId,
      user: { id: user.id, name: user.name },
      completedLevels: user.completedLevels,
    });
    if (result.error) {
      return res.status(409).json({ message: result.error });
    }

    return res.json(getRoomForPlayer(result.room, user.id));
  } catch (error) {
    return next(error);
  }
});

router.get("/rooms/:roomId", (req, res) => {
  pruneMultiplayerState();
  const room = getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ message: "Game session not found." });
  }

  const playerRoom = getRoomForPlayer(room, req.userId);
  if (!playerRoom) {
    return res.status(403).json({ message: "You are not part of this game session." });
  }
  return res.json(playerRoom);
});

router.delete("/rooms/:roomId/participants/me", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room || !getRoomForPlayer(room, req.userId)) {
    return res.status(404).json({ message: "Game session not found." });
  }

  leaveRoom(room, req.userId);
  return res.json({ message: "You left the game session." });
});

router.post("/rooms/:roomId/start", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room || room.ownerId !== req.userId) {
    return res.status(404).json({ message: "Game session not found." });
  }
  if (room.status !== "waiting") {
    return res.status(409).json({ message: "This game session has already started." });
  }

  startRoom(room);
  return res.json(getRoomForPlayer(room, req.userId));
});

router.post("/rooms/:roomId/messages", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room || !getRoomForPlayer(room, req.userId)) {
    return res.status(404).json({ message: "Game session not found." });
  }
  if (room.status !== "playing") {
    return res.status(409).json({ message: "The game has not started yet." });
  }

  const { text } = req.body ?? {};
  if (typeof text !== "string" || !text.trim() || text.trim().length > 280) {
    return res.status(400).json({ message: "Messages must be between 1 and 280 characters." });
  }

  User.findById(req.userId)
    .select("name")
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
      }

      const message = addRoomMessage({
        room,
        user: { id: user.id, name: user.name },
        text: text.trim(),
      });
      return res.status(201).json(message);
    })
    .catch(next);
});

router.post("/rooms/:roomId/complete", async (req, res, next) => {
  const { answer, challengeIndex } = req.body ?? {};

  try {
    const room = getRoom(req.params.roomId);
    if (!room || !getRoomForPlayer(room, req.userId)) {
      return res.status(404).json({ message: "Game session not found." });
    }
    if (room.status === "completed") {
      return res.json({ completedLevels: room.levelId, message: "Level already completed." });
    }
    if (room.status !== "playing") {
      return res.status(409).json({ message: "The game has not started yet." });
    }
    if (challengeIndex !== room.challengeIndex) {
      return res.status(409).json({
        message: "Your team has moved to another challenge. The latest progress is ready.",
        challengeIndex: room.challengeIndex,
      });
    }
    if (!isCorrectChallengeAnswer(room.levelId, challengeIndex, answer)) {
      return res.status(400).json({ message: "That answer is not correct. Compare your clues and try again." });
    }

    const isFinalChallenge = challengeIndex === room.levelId - 1;
    if (!isFinalChallenge) {
      room.challengeIndex += 1;
      return res.json({
        challengeIndex: room.challengeIndex,
        completed: false,
        message: "Challenge solved. The next seal is open.",
      });
    }

    if (room.submittingChallenge) {
      return res.status(409).json({
        message: "Your team is already opening this seal. Please wait.",
      });
    }

    room.submittingChallenge = true;
    try {
      const humanPlayers = room.participants.filter((participant) => !participant.isVirtual);
      const results = await Promise.all(
        humanPlayers.map((participant) =>
          User.updateOne(
            {
              _id: participant.id,
              completedLevels: { $gte: room.levelId - 1 },
            },
            { $max: { completedLevels: room.levelId } },
            { runValidators: true },
          ),
        ),
      );
      if (results.some((result) => result.matchedCount === 0)) {
        return res.status(409).json({ message: "Every player must unlock this level before completing it together." });
      }

      completeRoom(room);
      return res.json({
        challengeIndex: room.challengeIndex,
        completed: true,
        completedLevels: room.levelId,
        message: "Level completed.",
      });
    } finally {
      room.submittingChallenge = false;
    }
  } catch (error) {
    return next(error);
  }
});

router.get("/progress", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name completedLevels");

    if (!user) {
      return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
      },
      completedLevels: user.completedLevels,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/levels/:levelId/challenges/:challengeIndex/answer", async (req, res, next) => {
  const levelId = Number(req.params.levelId);
  const challengeIndex = Number(req.params.challengeIndex);
  const { answer } = req.body ?? {};

  if (!Number.isInteger(levelId) || levelId < 1 || levelId > 10) {
    return res.status(404).json({ message: "That level does not exist." });
  }

  if (
    !Number.isInteger(challengeIndex) ||
    challengeIndex < 0 ||
    challengeIndex >= levelId
  ) {
    return res.status(404).json({ message: "That challenge does not exist." });
  }

  if (typeof answer !== "string") {
    return res.status(400).json({ message: "Choose an answer before submitting." });
  }

  try {
    const user = await User.findById(req.userId).select("completedLevels levelChallengeProgress");
    if (!user) {
      return res.status(401).json({ message: "Your account could not be found. Please sign in again." });
    }
    if (user.completedLevels < levelId - 1) {
      return res.status(409).json({ message: "Complete the previous level before continuing." });
    }
    if (!isCorrectChallengeAnswer(levelId, challengeIndex, answer)) {
      return res.status(400).json({ message: "That answer is not correct. Compare the clues and try again." });
    }

    const progressKey = String(levelId);
    const expectedChallengeIndex = user.levelChallengeProgress.get(progressKey) ?? 0;
    const isReplayStart =
      user.completedLevels >= levelId && challengeIndex === 0;
    const currentChallengeIndex = isReplayStart ? 0 : expectedChallengeIndex;

    if (challengeIndex !== currentChallengeIndex) {
      return res.status(409).json({
        message: "Complete the current challenge before continuing.",
        challengeIndex: currentChallengeIndex,
      });
    }

    const nextChallengeIndex = challengeIndex + 1;
    const completed = nextChallengeIndex === levelId;
    user.levelChallengeProgress.set(
      progressKey,
      completed ? 0 : nextChallengeIndex,
    );
    if (completed) {
      user.completedLevels = Math.max(user.completedLevels, levelId);
    }
    await user.save();

    return res.json({
      completedLevels: user.completedLevels,
      challengeIndex: nextChallengeIndex,
      completed,
      message: completed
        ? "Level completed."
        : "Challenge solved. The next seal is open.",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
