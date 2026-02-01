// import database models
import Room from "../models/room.model.js";
import User from "../models/user.model.js";

// import utility functions
import { assignTickets } from "./assignTickets.js";
import { activeRooms, pendingRoomDeletions, roomLocks } from "./room.js";
import { SaveExistingGameInDb, SaveGameInDb } from "../utils/game.utils.js";
import {
  claimPatternLogic,
  createRoomLogic,
  joinRoomLogic,
} from "./gameLogic.js";

// Create room
export const createRoom = async (player, setting) => {
  const roomId = setting?.roomId.trim();
  try {
    if (!player?.id || !roomId) {
      throw new Error("Invalid player data or room ID");
    }
    if (roomLocks.has(roomId)) {
      throw new Error(
        "Someone is already creating with this room id, try different room id"
      );
    } else {
      roomLocks.set(roomId, true);
    }
    const res = await createRoomLogic(roomId, player, setting);
    return res;
  } catch (err) {
    throw err;
  } finally {
    roomLocks.delete(roomId); // Unlock the room after operation
  }
};

// join room
export const joinRoom = async (socketid, player, roomid, publicId) => {
  const roomId = roomid;

  try {
    if (!socketid || !player || !roomId || !publicId) {
      throw new Error("Invalid parameters for joining room");
    }
    if (roomLocks.has(roomId)) {
      throw new Error(
        "Someone is already joining with this room id, try different room id"
      );
    } else {
      roomLocks.set(roomId, true);
    }
    const resForJoin = await joinRoomLogic(socketid, player, roomId, publicId);
    return resForJoin;
  } catch (err) {
    throw err;
  } finally {
    roomLocks.delete(roomId);
  }
};

// claim pattern
export const claimPoint = async (player, roomid, pattern, ticketIndex, io) => {
  const roomId = roomid;
  try {
    if (roomLocks.has(roomId)) {
      throw new Error("Someone is already claiming in this room, please wait.");
    } else {
      roomLocks.set(roomId, true);
    }
    if (!activeRooms.has(roomId)) {
      throw new Error("Room not found");
    }
    const roomData = activeRooms.get(roomId);

    const res = await claimPatternLogic(player, roomId, pattern, ticketIndex);

    // 📢 Broadcast claim updates
    if (res) {
      io.to(roomId).emit("pattern_claimed", {
        message: `${res.message}`,
      });
      io.to(roomId).emit("claimedList", roomData.claimTrack);
    }

    // 🎯 Check if all patterns are claimed
    const allClaimed = roomData.claimTrack.every((p) => p.winners === 0);
    if (allClaimed) {
      roomData.isCompleted = true;
      roomData.isOngoing = false;

      const currentTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      });
      const formattedTime = currentTime.replace(/, /g, " | Time : ");
      const finalDate = "Date : " + formattedTime;
      roomData.finishTime = finalDate;

      const exist = await Room.findOne({ roomid: roomId });
      if (exist) {
        await SaveExistingGameInDb(roomId, roomData);
      } else {
        await SaveGameInDb(roomId, roomData);
      }

      io.to(roomId).emit("game_over", roomData?.claimData);

      for (const player of roomData.players) {
        try {
          const user = await User.findById(player?.id);
          if (user) {
            user.invites = user.invites.filter(
              (invite) => invite.id !== roomId
            );
            await user.save();
          }
        } catch (err) {
          console.error(`Error updating player ${player?.id}:`, err);
        }
      }

      if (pendingRoomDeletions.has(roomId)) {
        clearTimeout(pendingRoomDeletions.get(roomId));
        pendingRoomDeletions.delete(roomId);
      }

      activeRooms.delete(roomId);
    }

    return res;
  } catch (err) {
    throw err;
  } finally {
    roomLocks.delete(roomId); // Unlock the room after operation
  }
};

// assign tickets to players
export const assignNumbers = async (roomid) => {
  const roomData = activeRooms.get(roomid);
  if (!roomData) {
    return "Room not found";
  }

  const allAssigned = !roomData.players
    .filter((player) => player?.assign_numbers !== undefined)
    .some((playerWithNumbers) => Object.keys(playerWithNumbers.assign_numbers).length === 0);

  if (allAssigned) {
    return "Numbers already assigned";
  }

  // roomData.players = assignNumbersToPlayers(roomData.players);
  roomData.players = await assignTickets(roomData.players);
  let isarr = Array.isArray(roomData.players);
  if (!isarr) {
    return "Error assigning numbers";
  }
  roomData.isOngoing = true;

  return true;
};

// reconnecting logic
export const reconnectPlayer = async (player, roomid) => {
  try {
    if (!player || !roomid) return "Invalid player data";

    const roomId = roomid;

    const roomInDb = await Room.findOne({ roomid: roomId });
    let roomInMemory = activeRooms.get(roomId);

    if (!roomInDb && !roomInMemory) {
      return "Room not found";
    }

    if (roomInDb?.isCompleted || roomInMemory?.isCompleted) {
      return "Room is completed, please join a new one.";
    }

    // Load into memory if not already present
    if (!roomInMemory) {
      const loadedRoom = {
        host: roomInDb?.host,
        publicId: roomInDb?.publicId || null,

        players: roomInDb.players || [],
        patterns: roomInDb.settings?.patterns || [],
        schedule: roomInDb.settings?.schedule || null,
        claimData: roomInDb.claimData || [],
        claimTrack: roomInDb.settings?.patterns || [],
        drawno: roomInDb.drawno || [],
        playersList: roomInDb.players?.map((p) => p.name) || [],
        isOngoing: roomInDb?.isOngoing,
        isCompleted: roomInDb?.isCompleted,
        finishTime: roomInDb?.finishTime,
        requestedTicketCount: roomInDb?.requestedTicketCount || [],
      };
      activeRooms.set(roomId, loadedRoom);
      roomInMemory = activeRooms.get(roomId);
    }

    // Update socketId in memory
    const found = roomInMemory.players?.find((p) => p.id === player.id);
    if (found) {
      found.socketid = player.socketId;
    } else {
      return "Player not found in room, please join again";
    }

    return roomInMemory.isOngoing === true ? true : false;
  } catch (err) {
    console.error("Error reconnecting player:", err);
    return "Server error";
  }
};

// store roomData in DB
export const storeRoom = async (roomid) => {
  try {
    if (!roomid) {
      return "Invalid room data";
    }
    let roomData = activeRooms.get(roomid);
    if (!roomData) {
      return "Room not found";
    }

    roomData.isCompleted = true;
    roomData.isOngoing = false;

    // get current time of india, format it to "YYYY-MM-DD HH:mm:ss"
    const currentTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });
    const formattedTime = currentTime.replace(/, /g, " | Time : ");
    const finalDate = "Date : " + formattedTime;

    roomData.finishTime = finalDate;

    const exist = await Room.findOne({ roomid: roomid });
    if (exist) {
      await SaveExistingGameInDb(roomid, roomData);
    } else {
      await SaveGameInDb(roomid, roomData);
    }

    for (const player of roomData.players) {
      try {
        const user = await User.findById(player.id);
        if (user) {
          user.invites = user.invites.filter((invite) => invite.id !== roomid);
          await user.save();
        }
      } catch (err) {
        console.error(`Error updating player ${player.id}:`, err);
      }
    }

    if (pendingRoomDeletions.has(roomid)) {
      clearTimeout(pendingRoomDeletions.get(roomid));
      pendingRoomDeletions.delete(roomid);
    }

    activeRooms.delete(roomid);

    return 1;
  } catch (err) {
    console.error(`Error saving room ${roomid}:`, err);
    return "Error saving room";
  }
};
