import dotenv from "dotenv";
dotenv.config();

import Room from "./models/room.model.js";
import http from "http";
import { Server } from "socket.io";

//importing socket connection game logic
import { activeRooms, pendingRoomDeletions } from "./logic/room.js";
import {
  createRoom,
  joinRoom,
  assignNumbers,
  claimPoint,
  storeRoom,
  reconnectPlayer,
} from "./logic/game.js";
import { SaveExistingGameInDb } from "./utils/game.utils.js";

//importing database connection and connecting to database
import connectDB from "./database/main.js";
connectDB();

//import app and create server
import app from "./app.js";
const server = http.createServer(app);

// Allowed origins for Socket.io
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

// Initialize socket.io with client
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ New socket connected:", socket.id);
  
  // =============================================
  // CREATE ROOM - Host creates a new game room
  // =============================================
  socket.on("create_room", async (player, setting) => {
    try {
      console.log("📦 create_room called:", { playerId: player?.id, roomId: setting?.roomId });
      
      if (!player?.id || !setting?.roomId) {
        socket.emit("error", "Invalid input: player and room ID required");
        return;
      }
      
      const res = await createRoom(player, setting);
      if (!res?.success) {
        socket.emit("error", res?.message || "Failed to create room");
        return;
      }
      
      const room = activeRooms.get(setting.roomId);
      if (!room) {
        socket.emit("error", "Room not found after creation");
        return;
      }
      
      socket.join(setting.roomId);
      console.log("✅ Room created successfully:", setting.roomId);
      
      socket.emit("room_created", {
        id: setting.roomId,
        publicId: room.publicId,
      });
      
      io.to(setting.roomId).emit("player_update", room.playersList || []);
    } catch (err) {
      console.error("❌ Error in create_room:", err);
      socket.emit("error", err.message || "Server error");
    }
  });

  // =============================================
  // JOIN ROOM - User joins an existing room
  // =============================================
  socket.on("join_room", async (socketid, player, roomid, publicId) => {
    try {
      console.log("🚪 join_room called:", { socketid, playerId: player?.id, roomid });
      
      if (!socketid || !player?.id || !roomid) {
        socket.emit("error", "Invalid input: missing required fields");
        return;
      }
      
      const res = await joinRoom(socketid, player, roomid, publicId);
      if (!res?.success) {
        socket.emit("error", res?.message || res || "Failed to join room");
        return;
      }
      
      const room = activeRooms.get(roomid);
      if (!room) {
        socket.emit("error", "Room not found in memory");
        return;
      }
      
      socket.join(roomid);
      console.log("✅ Player joined room:", roomid);
      console.log("📋 Current playersList:", room.playersList);
      console.log("👥 Current players:", room.players.map(p => ({ name: p.name, socketid: p.socketid })));
      
      // Send success to the joining player
      socket.emit("room_joined", {
        id: roomid,
        publicId: room.publicId || publicId,
      });
      
      // Notify host about ticket request
      const hostPlayer = room.players.find((p) => p.id === room.host);
      console.log("🏠 Host player:", hostPlayer?.name, "socketid:", hostPlayer?.socketid);
      if (hostPlayer?.socketid) {
        io.to(hostPlayer.socketid).emit("requestedTicket", room.requestedTicketCount || []);
      }
      
      // Update player list for everyone in the room
      console.log("📤 Emitting player_update to room:", roomid);
      io.to(roomid).emit("player_update", room.playersList || []);
    } catch (err) {
      console.error("❌ Error in join_room:", err);
      socket.emit("error", err.message || "Server error");
    }
  });

  // =============================================
  // START GAME - Host starts the game
  // =============================================
  socket.on("start_game", async (roomid, hostId) => {
    try {
      console.log("🎮 start_game called:", { roomid, hostId });
      
      if (!roomid || !hostId) {
        socket.emit("error", "Missing room ID or host ID");
        return;
      }
      
      const room = activeRooms.get(roomid);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      
      if (room.host !== hostId) {
        socket.emit("error", "Only the host can start the game");
        return;
      }
      
      // Assign tickets to all players
      const result = await assignNumbers(roomid);
      if (typeof result === "string") {
        socket.emit("error", result);
        return;
      }
      
      // Update room status
      room.isOngoing = true;
      const roomInDb = await Room.findOne({ roomid: roomid });
      if (roomInDb) {
        roomInDb.isOngoing = true;
        await roomInDb.save();
      }
      
      // Get all players with their assigned tickets
      const players = room.players || [];
      
      // Prepare all tickets data for host view
      const allPlayersTickets = players
        .filter(p => p.ticketCount > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          ticketCount: p.ticketCount,
          assign_numbers: p.assign_numbers || {},
        }));
      
      console.log("📤 Sending started_game to", players.length, "players");
      
      // Send game data to each player
      players.forEach((player) => {
        if (!player.socketid) {
          console.warn("⚠️ Player has no socket ID:", player.name);
          return;
        }
        
        const isHost = player.id === room.host;
        const gameData = {
          player: {
            id: player.id,
            name: player.name,
            ticketCount: player.ticketCount || 0,
            assign_numbers: player.assign_numbers || {},
          },
          setting: {
            roomid: roomid,
            patterns: room.patterns || [],
            schedule: room.schedule || null,
            claimTrack: room.claimTrack || [],
          },
          allPlayersTickets: isHost ? allPlayersTickets : null,
        };
        
        console.log(`📤 Sending to ${player.name} (${player.socketid}), tickets:`, 
          Object.keys(player.assign_numbers || {}).length);
        
        io.to(player.socketid).emit("started_game", gameData);
      });
      
      console.log("✅ Game started successfully");
    } catch (err) {
      console.error("❌ Error in start_game:", err);
      socket.emit("error", "Server error starting game");
    }
  });

  // =============================================
  // CLAIM - Player claims a pattern
  // =============================================
  socket.on("claim", async (player, roomid, pattern, ticketIndex) => {
    try {
      if (!player || !roomid || !pattern || !ticketIndex) {
        socket.emit("error", "Invalid input");
        return;
      }
      let room = activeRooms.get(roomid);
      if (!room) {
        socket.emit("error", "Room not found in memory");
        return;
      }
      const res = await claimPoint(player, roomid, pattern, ticketIndex, io);
      if (res && res.success) {
        io.to(roomid).emit("claimListUpdate", room?.claimList || []);
        io.to(roomid).emit("claimed", pattern, player?.name);
      }
    } catch (err) {
      socket.emit("error", err?.message);
    }
  });

  // =============================================
  // PICK NUMBER - Host picks a number
  // =============================================
  socket.on("pick_number", (roomid, id) => {
    try {
      if (!roomid || !id) {
        socket.emit("error", "Invalid room ID");
        return;
      }
      let room = activeRooms.get(roomid);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      if (room?.host !== id) {
        socket.emit("error", "You are not authorized to pick a number");
        return;
      }

      if (room.drawno.length >= 90) {
        socket.emit("error", "All numbers are drawn");
        return;
      }

      let number;
      do {
        number = Math.floor(Math.random() * 90) + 1;
      } while (room.drawno.includes(number));

      room.drawno.push(number);
      io.to(roomid).emit("number_drawn", room.drawno);
    } catch (err) {
      console.error("Error in pick_number:", err);
      socket.emit("error", "Server error");
    }
  });

  // =============================================
  // REQUEST TICKET - Host approves ticket count
  // =============================================
  socket.on("requestTicket", (id, roomid, Tcount) => {
    try {
      let roomData = activeRooms.get(roomid);
      if (!roomData) {
        socket.emit("error", "Room not found in memory");
        return;
      }
      if (roomData?.players) {
        let foundIndex = roomData?.players?.findIndex(
          (player) => player.id == id
        );
        if (foundIndex !== -1) {
          roomData.players[foundIndex].ticketCount = Tcount;
          roomData.requestedTicketCount =
            roomData.requestedTicketCount.filter(
              (player) => player.id !== id
            );
          socket.emit("requestedTicket", roomData.requestedTicketCount);
        }
      }
    } catch (err) {
      console.error("Error in requestedTicket:", err);
      socket.emit("error", "Server error while requesting ticket");
    }
  });

  // =============================================
  // END GAME - Host ends the game
  // =============================================
  socket.on("end_game", async (roomid, id) => {
    try {
      if (!roomid || !activeRooms.has(roomid) || !id) {
        socket.emit("error", "Invalid credentials");
        return;
      }
      let room = activeRooms.get(roomid);
      if (room?.players) {
        let found = room?.host == id;
        if (!found) {
          socket.emit("error", "You are not authorized to end the game");
          return;
        }
      }
      const endRes = await storeRoom(roomid);
      if (typeof endRes === "string") {
        socket.emit("error", endRes);
        return;
      }
      const claimDataForLeaderboard = room?.claimData;

      io.to(roomid).emit("room_data_stored", claimDataForLeaderboard);
    } catch (err) {
      console.error("Error in end_game:", err);
      socket.emit("error", "Server error");
    }
  });

  // =============================================
  // RECONNECT PLAYER - Player reconnects
  // =============================================
  socket.on("reconnect_player", async (player, roomid) => {
    try {
      console.log("🔄 reconnect_player called:", { playerName: player?.name, playerId: player?.id, roomid });
      
      if (!player || !roomid) {
        socket.emit("error", "Invalid input");
        return;
      }
      const res = await reconnectPlayer(player, roomid);
      if (typeof res === "string") {
        socket.emit("error", res);
        return;
      }
      let room = activeRooms.get(roomid);
      if (!room) {
        socket.emit("error", "Room not found in memory");
        return;
      }
      
      // Join the socket room
      socket.join(roomid);
      console.log("✅ Player reconnected and joined socket room:", roomid);
      console.log("📋 Current playersList:", room.playersList);
      
      if (res === false) {
        socket.emit("reconnectToRoom", {
          roomid: roomid,
          publicId: room?.publicId || "",
        });
        // Send immediate player update to the reconnected player
        socket.emit("player_update", room?.playersList || []);
      } else if (res === true) {
        const assignNumber =
          room.players?.find((p) => p.id === player.id)?.assign_numbers || [];
        socket.emit("reconnectToGame", {
          drawno: room.drawno || 0,
          patterns: room.patterns || [],
          schedule: room.schedule || null,
          claimTrack: room.claimTrack || [],
          assign_numbers: assignNumber || [],
          ticketCount: room?.players?.find((p) => p.id === player.id)
            ?.ticketCount,
          roomid: roomid,
        });
        setTimeout(() => {
          socket.emit("number_drawn", room.drawno || []);
        }, 500);
        setTimeout(() => {
          socket.emit("reconnectedPlayer", room.drawno || []);
        }, 1000);
      }
      setTimeout(() => {
        io.to(roomid).emit("player_update", room?.playersList || []);
      }, 1000);
    } catch (err) {
      console.error("Error in reconnect_player:", err);
      socket.emit("error", "Server error");
    }
  });

  // =============================================
  // DISCONNECT - Handle player disconnection
  // =============================================
  socket.on("disconnect", async () => {
    try {
      console.log("❌ Socket disconnected:", socket.id);
      for (const [roomId, room] of activeRooms.entries()) {
        const players = room?.players || [];
        const playerIndex = players.findIndex(
          (player) => player.socketid === socket.id
        );

        if (playerIndex !== -1) {
          const disconnectedPlayer = players[playerIndex];
          // Remove player from the room if the room is not ongoing
          if (!room.isOngoing) {
            if (room.host !== disconnectedPlayer.id) {
              players.splice(playerIndex, 1);
              room.playersList = players.map((player) => player.name);
              room.players = players;
              io.to(roomId).emit("player_update", room.playersList);
              io.to(roomId).emit("updatePlayers", players);
            }
          } else {
            players[playerIndex].socketid = null; // Set socket ID to null for ongoing games
            room.playersList = players
              .filter((p) => p.socketid !== null)
              .map((player) => player.name);
            io.to(roomId).emit("player_update", room.playersList);
          }

          // If room is empty, schedule deletion
          const actualPlayers = room.players.filter(
            (player) => player.socketid !== null
          ).length;
          if (actualPlayers === 0) {
            const timeout = setTimeout(async () => {
              if (
                activeRooms
                  .get(roomId)
                  ?.players.filter((player) => player.socketid !== null)
                  .length === 0
              ) {
                // if room is in db, then save it and then delete it from memory
                const roomData = activeRooms.get(roomId);
                const roomInDb = await Room.findOne({ roomid: roomId });
                if (roomInDb) {
                  SaveExistingGameInDb(roomId, roomData);
                }

                activeRooms.delete(roomId);
                pendingRoomDeletions.delete(roomId);
              }
            }, 5 * 60 * 1000); // 5 minutes

            pendingRoomDeletions.set(roomId, timeout);
          }

          break;
        }
      }
    } catch (err) {
      console.error("Error in disconnect:", err);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

// Global error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
