import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
// import components
import Header from "../components/Header";
import socket from "../utils/websocket";
import Loading from "../components/Loading";
import PatternMenu from "../components/PatternMenu";
// import context
import { GameContext } from "../context/GameContext";
import { PlayerContext } from "../context/PlayerContext";

// import toastify (for notifications)
import { toast } from "react-toastify";

const Hostpage = () => {
  //for context
  const { gameSettings, updateGameSettings, updateGameState } =
    useContext(GameContext);
  const { Player, updatePlayer } =
    useContext(PlayerContext);

  //for navigation
  const navigate = useNavigate();

  // for getting the current path
  const location = useLocation();

  // for storing all the room states
  const [roomId, setRoomId] = useState("");
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hostPlay, setHostPlay] = useState(false);
  
  // for socket connection status
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  // Socket connection monitoring
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // for ensuring the new state
  useEffect(() => {
    if (location.pathname === "/host") {
      setRoomId("");
      setTicketCount(0);
    } else if (location.pathname === `/host/${roomId}`) {
      setRoomId(roomId);
    }
  }, [location.pathname, roomId]);

  // for handling the create room button click
  const handleCreateRoom = () => {
    // Check socket connection first
    if (!socket.connected) {
      toast.error("Not connected to server. Please wait...");
      socket.connect();
      return;
    }
    
    if (!gameSettings?.roomId || gameSettings?.roomId?.length < 3) {
      toast.warning("Please enter a valid Room ID (at least 3 characters).");
      return;
    }
    // there should be no space in roomId or special characters because it is used in URL
    // use all url friendly characters
    if (/[^a-zA-Z0-9_-]/.test(gameSettings?.roomId)) {
      toast.warning("No spaces or special characters in Room ID.");
      return;
    }
    if (gameSettings?.pattern?.length === 0) {
      toast.warning("Please select at least one pattern.");
      return;
    }
    setLoading(true);
    
    // Set a timeout to stop loading if no response
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      toast.error("Connection timeout. Please try again.");
    }, 10000);
    
    try {
      socket.emit("create_room", { ...Player }, { ...gameSettings });
      
      // Clear timeout on response
      socket.once("room_created", () => clearTimeout(loadingTimeout));
      socket.once("error", () => clearTimeout(loadingTimeout));
    } catch {
      clearTimeout(loadingTimeout);
      toast.error("Failed to create room. Please try again.");
      setLoading(false);
    }
  };

  // handle room joined event
  const handleRoomJoined = useCallback((room) => {
    // Handle both object format { id, publicId } and string format (backward compatibility)
    const roomId = typeof room === 'string' ? room : room?.id;
    const roomPublicId = typeof room === 'string' ? '' : room?.publicId;
    
    setRoomId("");
    updateGameSettings({
      roomId: "",
      isScheduled: false,
      schedule: null,
      pattern: [],
    });
    setTicketCount(0);
    setHostPlay(false);
    setLoading(false);
    navigate(`/host/room/${roomId}`);
    updateGameState({
      publicId: roomPublicId,
    });
  }, [navigate, updateGameSettings, updateGameState]);

  // handle the socket events
  useEffect(() => {
    socket.on("room_created", handleRoomJoined);
    socket.on("room_joined", handleRoomJoined);

    socket.on("error", (message) => {
      setLoading(false);
      toast.error(message);
    });

    // Cleanup
    return () => {
      socket.off("room_created", handleRoomJoined);
      socket.off("room_joined", handleRoomJoined);
      socket.off("error");
    };
  }, [ticketCount, navigate, handleRoomJoined]);

  // for ensuring the player state is updated
  useEffect(() => {
    updatePlayer({
      ticketCount: ticketCount,
    });
  }, [ticketCount, updatePlayer]);

  // for generating a random room ID (6 characters long)
  const generateRandomRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    updateGameSettings({ roomId: randomId });
  };

  // Handle click on datetime input to open the date/time picker
  const datetimeRef = useRef(null);
  useEffect(() => {
    const container = datetimeRef.current?.parentElement;
    const openPicker = () => {
      datetimeRef.current?.focus();
      datetimeRef.current?.showPicker();
    };
    container?.addEventListener("click", openPicker);
    return () => container?.removeEventListener("click", openPicker);
  }, []);

  // handle the Edit Patterns
  const [editPatterns, setEditPatterns] = useState(false);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Header />
          {location.pathname === "/host" ||
          location.pathname === `/host/${roomId}` ? (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-8 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
              <div className="bg-white/80 backdrop-blur-lg relative py-6 px-6 rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
                {/* Header with gradient */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Create or Join a Room
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Set up your Tambola game room</p>
                </div>

                {/* Room ID Input */}
                <div className="mb-5">
                  <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="roomId">
                    🎯 Room ID
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="roomId"
                      value={roomId || gameSettings?.roomId || ""}
                      onChange={(e) => {
                        updateGameSettings({ roomId: e.target.value });
                        updateGameState({ roomId: e.target.value });
                      }}
                      placeholder="Enter room ID..."
                      className="flex-1 border border-gray-200 rounded-l-xl py-3 px-4 text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={generateRandomRoomId}
                      className="px-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-r-xl font-bold shadow-md hover:from-purple-600 hover:to-blue-700 transition-all active:scale-95"
                      title="Generate Random ID"
                    >
                      🎲
                    </button>
                  </div>
                </div>

                {/* Host Play Option */}
                <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hostPlay"
                      checked={hostPlay}
                      onChange={(e) => setHostPlay(e.target.checked)}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="hostPlay" className="ml-3 text-sm font-medium text-gray-800 cursor-pointer">
                      🎮 Host can also play
                    </label>
                  </div>

                  {hostPlay && (
                    <div className="mt-4">
                      <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="ticketCount">
                        🎫 Number of Tickets
                      </label>
                      <select
                        id="ticketCount"
                        value={ticketCount}
                        onChange={(e) => setTicketCount(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all cursor-pointer"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    className="relative flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95"
                    onClick={() => setEditPatterns(!editPatterns)}
                  >
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full text-xs w-6 h-6 flex items-center justify-center shadow-lg">
                      {gameSettings?.pattern?.length}
                    </span>
                    🎨 Patterns
                  </button>
                  <button
                    className={`flex-1 ${
                      gameSettings.isScheduled 
                        ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" 
                        : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    } text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95`}
                    onClick={() => updateGameSettings({ isScheduled: !gameSettings.isScheduled })}
                  >
                    ⏰ Schedule
                  </button>
                </div>

                {editPatterns && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 border border-white/50">
                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => setEditPatterns(false)}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all text-white shadow-lg active:scale-95"
                        aria-label="Close pattern selection"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        🎨 Select Patterns
                      </h3>

                      {/* PatternMenu Component */}
                      <PatternMenu />

                      <button
                        onClick={() => setEditPatterns(false)}
                        className="mt-6 w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95"
                      >
                        ✓ Done
                      </button>
                    </div>
                  </div>
                )}

                {/* Schedule Picker */}
                <div className={`${gameSettings.isScheduled ? 'block' : 'hidden'} mb-4`}>
                  <div className="relative">
                    <input
                      ref={datetimeRef}
                      type="datetime-local"
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        updateGameSettings({
                          schedule: date.toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }),
                        });
                      }}
                      className="w-full border border-gray-200 rounded-xl py-3 px-4 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all cursor-pointer"
                      required
                    />
                    {!gameSettings.schedule && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-purple-300 text-gray-500 font-medium pointer-events-none">
                        📅 Click to select date/time
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Connection Status */}
                <div className={`mb-4 flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  {isConnected ? 'Connected to server' : 'Connecting to server...'}
                </div>

                {/* Create Room Button */}
                <button
                  onClick={handleCreateRoom}
                  disabled={!isConnected || !gameSettings?.roomId || gameSettings?.pattern?.length === 0}
                  className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                    isConnected && gameSettings?.roomId && gameSettings?.pattern?.length > 0
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isConnected ? '🚀 Create Room' : '⏳ Connecting...'}
                </button>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </>
      )}
    </>
  );
};

export default Hostpage;
