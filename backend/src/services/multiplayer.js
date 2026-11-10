import { randomUUID } from "node:crypto";

const PRESENCE_TTL_MS = 30_000;
const INVITATION_TTL_MS = 60_000;
const ROOM_TTL_MS = 3_600_000;

const onlinePlayers = new Map();
const invitations = new Map();
const rooms = new Map();

export function pruneMultiplayerState(now = Date.now()) {
  for (const [userId, player] of onlinePlayers) {
    if (now - player.lastSeen > PRESENCE_TTL_MS) {
      onlinePlayers.delete(userId);
    }
  }

  for (const [invitationId, invitation] of invitations) {
    if (invitation.status === "pending" && now > invitation.expiresAt) {
      invitations.delete(invitationId);
    }
  }

  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      rooms.delete(roomId);
      for (const [invitationId, invitation] of invitations) {
        if (invitation.roomId === roomId) invitations.delete(invitationId);
      }
    }
  }
}

export function updatePresence(user) {
  pruneMultiplayerState();
  onlinePlayers.set(user.id, {
    id: user.id,
    name: user.name,
    lastSeen: Date.now(),
  });

  const availablePlayers = [...onlinePlayers.values()]
    .filter((player) => player.id !== user.id)
    .map(({ id, name }) => ({ id, name }));

  const receivedInvitations = [...invitations.values()]
    .filter(
      (invitation) =>
        invitation.toUserId === user.id && invitation.status === "pending",
    )
    .map((invitation) => ({
      id: invitation.id,
      roomId: invitation.roomId,
      from: invitation.from,
      levelId: invitation.levelId,
      mode: invitation.mode,
      expiresAt: invitation.expiresAt,
    }));

  return { availablePlayers, receivedInvitations };
}

export function createRoom({ user, levelId, mode }) {
  const id = randomUUID();
  const room = {
    id,
    levelId,
    mode,
    capacity: mode === "team" ? 3 : 2,
    ownerId: user.id,
    participants: [
      {
        id: user.id,
        name: user.name,
        clueIndex: 0,
        isVirtual: false,
      },
    ],
    messages: [],
    status: "waiting",
    challengeIndex: 0,
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function leaveRoom(room, userId) {
  room.participants = room.participants.filter(
    (participant) => participant.id !== userId,
  );
  if (room.ownerId === userId && room.participants.length > 0) {
    room.ownerId = room.participants[0].id;
  }
  if (room.participants.length === 0) {
    rooms.delete(room.id);
    for (const [invitationId, invitation] of invitations) {
      if (invitation.roomId === room.id) invitations.delete(invitationId);
    }
  }
}

export function inviteToRoom({ room, from, toUser }) {
  const id = randomUUID();
  const invitation = {
    id,
    roomId: room.id,
    fromUserId: from.id,
    toUserId: toUser.id,
    from: { id: from.id, name: from.name },
    levelId: room.levelId,
    mode: room.mode,
    status: "pending",
    expiresAt: Date.now() + INVITATION_TTL_MS,
  };
  invitations.set(id, invitation);
  return invitation;
}

export function hasPendingInvitation(roomId, userId) {
  return [...invitations.values()].some(
    (invitation) =>
      invitation.roomId === roomId &&
      invitation.toUserId === userId &&
      invitation.status === "pending",
  );
}

export function acceptInvitation({ invitationId, user, completedLevels }) {
  pruneMultiplayerState();
  const invitation = invitations.get(invitationId);
  if (
    !invitation ||
    invitation.toUserId !== user.id ||
    invitation.status !== "pending"
  ) {
    return { error: "This invitation is no longer available." };
  }

  const room = rooms.get(invitation.roomId);
  if (!room || room.status !== "waiting") {
    invitations.delete(invitationId);
    return { error: "This game session is no longer accepting players." };
  }
  if (completedLevels < room.levelId - 1) {
    return { error: "Complete the previous level before joining." };
  }

  if (room.participants.some((participant) => participant.id === user.id)) {
    return { room };
  }

  if (room.participants.length >= room.capacity) {
    invitations.delete(invitationId);
    return { error: "This game is already full." };
  }

  room.participants.push({
    id: user.id,
    name: user.name,
    clueIndex: room.participants.length,
    isVirtual: false,
  });
  invitation.status = "accepted";
  return { room };
}

export function getRoomForPlayer(room, userId) {
  const participant = room.participants.find((entry) => entry.id === userId);
  if (!participant) return null;

  return {
    id: room.id,
    levelId: room.levelId,
    mode: room.mode,
    capacity: room.capacity,
    ownerId: room.ownerId,
    participants: room.participants.map(({ id, name, clueIndex, isVirtual }) => ({
      id,
      name,
      clueIndex,
      isVirtual,
    })),
    myClueIndex: participant.clueIndex,
    messages: room.messages,
    status: room.status,
    challengeIndex: room.challengeIndex,
    solved: room.status === "completed",
  };
}

export function addRoomMessage({ room, user, text }) {
  const message = {
    id: randomUUID(),
    userId: user.id,
    name: user.name,
    text,
    createdAt: new Date().toISOString(),
  };
  room.messages.push(message);
  room.messages = room.messages.slice(-100);
  return message;
}

export function startRoom(room) {
  const companionNames = ["Archivist Lyra", "Scout Orion"];

  if (room.participants.length === 1) {
    for (let clueIndex = 1; clueIndex < room.capacity; clueIndex += 1) {
      room.participants.push({
        id: `guide-${room.id}-${clueIndex}`,
        name: companionNames[clueIndex - 1] ?? `Guide ${clueIndex}`,
        clueIndex,
        isVirtual: true,
      });
    }
  }

  room.status = "playing";
  return room;
}

export function completeRoom(room) {
  room.status = "completed";
}
