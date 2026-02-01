import { useState, useEffect, useContext, useRef } from "react";
import { useLocation, Outlet } from "react-router-dom";
//import components and utils
import AssignTicket from "../components/AssignTicket";
import DrawNumbers from "../components/DrawNumbers";
import Loading from "../components/Loading";
import socket from "../utils/websocket";
//import context
import { GameContext } from "../context/GameContext";
import { PlayerContext } from "../context/PlayerContext";

// import toastify
import { toast } from "react-toastify";

const Game = () => {
  //for context
  const { gameState, updateGameState } = useContext(GameContext);
  const { Player } = useContext(PlayerContext);

  //for getting current path
  const location = useLocation();

  //for storing drawn numbers and timer
  const [drawNumber, setDrawNumber] = useState([]);
  const timervalue = gameState.timer || 3;
  const [timerToggled, setTimerToggled] = useState(false);
  const timeoutRef = useRef(null);

  // for getting roomid from gameState
  const roomid = gameState.roomid || "";

  // for loading state
  const [loading, setLoading] = useState(false);

  // for game state
  const [recentClaim, setRecentClaim] = useState(false);

  // for host view toggle - to see all players' tickets
  const [showAllPlayersTickets, setShowAllPlayersTickets] = useState(false);
  const [selectedPlayerTicket, setSelectedPlayerTicket] = useState(null);

  // for handle the pick number button click
  const handlePickNumberClick = () => {
    if (Player.role === "host") {
      if (timerToggled || recentClaim) {
        toast.warning("Please wait for the timer to finish or claim to reset!");
        return;
      }
      setTimerToggled(!timerToggled);
      handleTimer();
      if (drawNumber.length >= 90) {
        toast.warning("All numbers are drawn!");
        socket.emit("end_game", roomid, Player.id);
        return;
      } else if (drawNumber.length < 90) {
        socket.emit("pick_number", roomid, Player.id);
      }
    } else {
      toast.warning("Only the host can pick numbers!");
    }
  };

  // for handle end game click(for warning before ending the game)
  const [endMenu, setEndMenu] = useState(false);
  const endGameClick = () => {
    if (Player.role === "host") {
      setEndMenu(true);
    }
  };
  const endGame = () => {
    if (Player.role === "host") {
      socket.emit("end_game", roomid, Player.id);
    }
    setEndMenu(false);
  };

  //for development
  // const [timer, setTimer] = useState(0);
  // for production
  const [timer, setTimer] = useState(timervalue);
  const handleTimer = () => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setTimerToggled(false);
          // for production
          return timervalue;

          // for development
          // return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    updateGameState({ drawnNumbers: drawNumber });
  }, [drawNumber, updateGameState]);

  // socket event handlers, functions and states (drawn numbers, error messages)
  useEffect(() => {
    socket.on("error", (message) => {
      toast.error(message);
      setLoading(false);
    });
    const pickedNumber = (number) => {
      if (number.length === 90) {
        setTimerToggled(false);
        toast.success("All numbers are drawn!");
        toast.info("Game will over in 5 seconds", {
          autoClose: 5000,
          onClose: () => {
            socket.emit("end_game", roomid, Player.id);
          },
        });
      }
      setDrawNumber(number);
    };

    const handleClaim = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setRecentClaim(true);

      timeoutRef.current = setTimeout(() => {
        setRecentClaim(false);
      }, 5000);
    };
    socket.on("number_drawn", pickedNumber);
    socket.on("pattern_claimed", handleClaim);

    return () => {
      socket.off("number_drawn", pickedNumber);
      socket.off("error");
      socket.off("pattern_claimed", handleClaim);
    };
  }, [roomid, Player.id]);

  // connection and disconnection handling
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
      socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomid);
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
      socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomid);
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

    // Handle reconnect to game event from server
    const handleReconnectToGame = (data) => {
      if (data.drawno) {
        setDrawNumber(data.drawno);
      }
      updateGameState({
        patterns: data.patterns || [],
        schedule: data.schedule || null,
        claimTrack: data.claimTrack || [],
        assign_numbers: data.assign_numbers || [],
        ticketCount: data.ticketCount || 1,
        roomid: data.roomid,
      });
      setIsDisconnected(false);
      hasConnectedOnceRef.current = true;
    };

    // Handle reconnected player confirmation
    const handleReconnectedPlayer = (drawnNumbers) => {
      if (drawnNumbers && Array.isArray(drawnNumbers)) {
        setDrawNumber(drawnNumbers);
      }
    };

    // Listen to socket events
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnectToGame", handleReconnectToGame);
    socket.on("reconnectedPlayer", handleReconnectedPlayer);

    return () => {
      // Clean up socket event listeners on component unmount
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnectToGame", handleReconnectToGame);
      socket.off("reconnectedPlayer", handleReconnectedPlayer);
    };
  }, [Player, roomid, updateGameState]);

  // avoid refreshing the page on reload
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
      {loading ? (
        <Loading />
      ) : location.pathname === "/game" ? (
        <div className="container flex flex-col items-center p-3 min-w-full min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
          <div className="relative w-full max-w-lg md:max-w-2xl max-h-screen flex flex-col items-center gap-3">
            {Player?.role === "host" && (
              <div className="w-full flex gap-3 items-center bg-white/80 backdrop-blur-lg p-3 rounded-2xl shadow-xl border border-white/50">
                <button
                  onClick={
                    drawNumber.length >= 90 || timerToggled
                      ? null
                      : handlePickNumberClick
                  }
                  className={`w-full font-bold py-4 rounded-xl shadow-lg transition-transform transform ${
                    drawNumber.length >= 90 || timerToggled || recentClaim
                      ? "cursor-not-allowed bg-gray-400 text-gray-600"
                      : "cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white active:scale-95"
                  }`}
                >
                  {drawNumber.length >= 90
                    ? "🎉 All numbers drawn!"
                    : timerToggled
                    ? `⏳ ${timer}s remaining...`
                    : "🎱 Pick Number"}
                </button>

                <button
                  onClick={endGameClick}
                  className="w-[40%] bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform transform active:scale-95"
                >
                  🛑 End
                </button>
              </div>
            )}

            {/* Host View Toggle - Only visible to host */}
            {Player?.role === "host" && gameState.allPlayersTickets && (
              <div className="w-full flex gap-2">
                <button
                  onClick={() => setShowAllPlayersTickets(false)}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all ${
                    !showAllPlayersTickets
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  🎫 My Tickets
                </button>
                <button
                  onClick={() => setShowAllPlayersTickets(true)}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all ${
                    showAllPlayersTickets
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  👥 All Players ({gameState.allPlayersTickets.length})
                </button>
              </div>
            )}

            {/* Drawn Numbers Section */}
            <div className="w-full top-0 flex flex-col bg-white/80 backdrop-blur-lg p-3 rounded-2xl items-center shadow-xl border border-white/50">
              <DrawNumbers />
            </div>

            {/* Tickets Section */}
            <div className="w-full bg-white/80 backdrop-blur-lg p-3 rounded-2xl shadow-xl h-full overflow-y-auto border border-white/50">
              {showAllPlayersTickets && Player?.role === "host" && gameState.allPlayersTickets ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-center text-gray-800 mb-4">
                    👥 All Players&apos; Tickets
                  </h2>
                  {/* Player selection buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gameState.allPlayersTickets.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayerTicket(
                          selectedPlayerTicket === player.id ? null : player.id
                        )}
                        className={`px-3 py-2 rounded-lg font-medium transition-all ${
                          selectedPlayerTicket === player.id
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {player.name} ({player.ticketCount} tickets)
                      </button>
                    ))}
                  </div>
                  {/* Show selected player's tickets */}
                  {selectedPlayerTicket && (
                    <div className="border-t pt-4">
                      {gameState.allPlayersTickets
                        .filter((p) => p.id === selectedPlayerTicket)
                        .map((player) => (
                          <div key={player.id}>
                            <h3 className="text-md font-semibold text-gray-700 mb-2">
                              {player.name}&apos;s Tickets:
                            </h3>
                            <AssignTicket 
                              data={player.assign_numbers} 
                              isHostView={true}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                  {!selectedPlayerTicket && (
                    <p className="text-center text-gray-500 py-4">
                      Click on a player above to view their tickets
                    </p>
                  )}
                </div>
              ) : (
                <AssignTicket data={gameState.assign_numbers} />
              )}
            </div>

            {endMenu && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                <div className="w-full max-w-md flex flex-col items-center gap-6 bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/50">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
                      <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">End Game?</h2>
                    <p className="text-gray-500 text-sm">
                      Are you sure you want to end the game? All your progress will be stored in the database.
                    </p>
                  </div>
                  <div className="w-full flex flex-col gap-3">
                    <button
                      onClick={endGame}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      ✓ Confirm End Game
                    </button>
                    <button
                      onClick={() => setEndMenu(false)}
                      className="w-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                        socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomid);
                      }, 100);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    🔄 Reconnect to Game
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default Game;
