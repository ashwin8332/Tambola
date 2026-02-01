import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

// import centralized socket connection
import socket from "../utils/websocket";

//import context
import { GameContext } from "../context/GameContext";
import { PlayerContext } from "../context/PlayerContext";

// toastify
import { toast } from "react-toastify";

const Userroom = () => {
  //for navigation
  const navigate = useNavigate();

  // get roomid from URL params
  const params = useParams();

  //context state
  const { gameState, updateGameState } = useContext(GameContext);
  const { Player } = useContext(PlayerContext);

  // get roomid from params first, then fallback to gameState
  const roomid = params.roomid || gameState.roomid || "";

  //joined players list state
  const [playersList, setPLayersList] = useState([]);

  //socket event listeners for player updates and game start
  useEffect(() => {
    const handleUpdatePlayers = (players) => {
      setPLayersList(players);
    };

    const handleNumbersAssigned = (data) => {
      const setting = data?.setting || {};
      const player = data?.player || {};
      updateGameState({
        name: player?.name || "Guest",
        roomid: setting?.roomid,
        ticketCount: player?.ticketCount || 1,
        assign_numbers: player?.assign_numbers || {},
        patterns: setting?.patterns || [],
        schedule: setting?.schedule || null,
        claimTrack: setting?.claimTrack || [],
      });

      navigate(`/game`);
    };

    socket.on("player_update", handleUpdatePlayers);
    socket.on("started_game", handleNumbersAssigned);

    return () => {
      socket.off("player_update", handleUpdatePlayers);
      socket.off("started_game", handleNumbersAssigned);
    };
  }, [navigate, updateGameState]);

  //socket event listeners for disconnection check
  const [isDisconnected, setIsDisconnected] = useState(false);
  const hasConnectedOnceRef = useRef(false);
  const disconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Emit socket connection when the component mounts
    socket.connect();

    // Check if already connected on initial mount
    if (socket.connected) {
      setIsDisconnected(false);
      hasConnectedOnceRef.current = true;
      // Rejoin the room when already connected - pass current socket.id
      if (Player && roomid) {
        socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomid);
      }
    }

    // Handle connection establishment
    const handleConnect = () => {
      // Clear any pending disconnect timeout
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }
      setIsDisconnected(false);
      hasConnectedOnceRef.current = true;
      // Rejoin the room when connection is established - pass current socket.id
      if (Player && roomid) {
        socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomid);
      }
    };

    // Handle disconnection - only show warning if we had connected before
    // Add a small delay to avoid showing popup during brief disconnections
    const handleDisconnect = () => {
      if (hasConnectedOnceRef.current) {
        // Wait 2 seconds before showing disconnect popup
        disconnectTimeoutRef.current = setTimeout(() => {
          if (!socket.connected) {
            setIsDisconnected(true);
          }
        }, 2000);
      }
    };

    // Handle reconnect to game event from server (if game already started)
    const handleReconnectToGame = (data) => {
      updateGameState({
        patterns: data.patterns || [],
        schedule: data.schedule || null,
        claimTrack: data.claimTrack || [],
        assign_numbers: data.assign_numbers || [],
        ticketCount: data.ticketCount || 1,
        roomid: data.roomid,
      });
      navigate(`/game`);
    };

    // Handle errors from server
    const handleError = (message) => {
      console.error("Socket error:", message);
      toast.error(message);
      // If room not found, redirect to user page
      if (message === "Room not found in memory" || message === "Invalid input") {
        navigate("/user");
      }
    };

    // Listen to socket events
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnectToGame", handleReconnectToGame);
    socket.on("error", handleError);

    return () => {
      // Clean up socket event listeners on component unmount
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnectToGame", handleReconnectToGame);
      socket.off("error", handleError);
    };
  }, [Player, roomid, navigate, updateGameState]);

  //warning before leaving the page
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <>
      <div className="p-4 pt-20 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 min-h-screen">
        <div className="bg-white/80 backdrop-blur-lg border border-white/50 p-6 rounded-2xl shadow-xl flex flex-col items-center">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 pb-1 border-b-4 border-purple-500 block self-start md:self-center">
            👥 Players
          </h2>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 lg:gap-5 w-full overflow-y-auto max-h-[40vh]">
            {playersList?.map((player, index) => (
              <span
                key={index}
                className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-base md:text-lg font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-center min-w-[100px] text-center"
              >
                {player}
              </span>
            ))}
            {playersList?.length === 0 && (
              <p className="text-gray-500 italic">Waiting for players to join...</p>
            )}
          </div>
        </div>

        {/* Waiting Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-lg px-6 py-4 rounded-xl shadow-lg border border-white/50">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 font-medium">Waiting for host to start the game...</span>
          </div>
        </div>
      </div>
      {isDisconnected && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white/95 backdrop-blur-lg text-red-600 border border-red-100 shadow-2xl rounded-2xl p-8 w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Connection Lost</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your connection was lost. Please reconnect to continue the game.
            </p>

            <button
              onClick={() => {
                socket.connect();
                setTimeout(() => {
                  if (Player && roomid) {
                    socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomid);
                  }
                }, 100);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-95"
            >
              🔄 Reconnect to Game
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Userroom;
