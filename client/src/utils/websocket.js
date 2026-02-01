import { io } from "socket.io-client";

//import env
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const socket = io(apiBaseUrl, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  autoConnect: true,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

// Log connection events
socket.on("connect", () => {
  console.log(`Connected with ID: ${socket.id}`);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  if (reason === "io server disconnect") {
    // Server disconnected, try to reconnect
    socket.connect();
  }
});

socket.on("reconnect", (attemptNumber) => {
  console.log("Reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log("Reconnection attempt", attemptNumber);
});

socket.on("reconnect_error", (error) => {
  console.error("Reconnection error:", error.message);
});

socket.on("reconnect_failed", () => {
  console.error("Failed to reconnect after all attempts");
});

export default socket;
