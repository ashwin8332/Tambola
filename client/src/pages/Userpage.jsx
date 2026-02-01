import { useContext, useEffect, useState } from "react";
import { useLocation, useParams, Outlet, useNavigate } from "react-router-dom";

//import centralized socket connection
import socket from "../utils/websocket";

//import utilities functions
import { hashToText, textToHash } from "../utils/game.js";

//import components
import Header from "../components/Header";
import Loading from "../components/Loading";

//import context
import { PlayerContext } from "../context/PlayerContext";
import { GameContext } from "../context/GameContext";

//import toastify
import { toast } from "react-toastify";
import Authentication from "../components/Authentication.jsx";

const Userpage = () => {
  //for extracting roomid from params if present
  const { publicId } = useParams();
  
  // Try to decrypt publicId, if it fails (no ":" separator or invalid), use publicId as raw roomId
  const decryptedRoomId = hashToText(publicId || "");
  // If decryption returns empty but we have a publicId, use publicId directly as roomId (for direct room codes)
  let roomid = decryptedRoomId || publicId || "";

  //for context
  const { Player, updatePlayer } = useContext(PlayerContext);
  const { updateGameState } = useContext(GameContext);

  //for loading
  const [loading, setLoading] = useState(false);
  
  //for socket connection status
  const [isConnected, setIsConnected] = useState(socket.connected);

  //for navigating
  const navigate = useNavigate();

  //geeting path from url for conditional rendering(Oulet is used for nested routing)
  const location = useLocation();

  // Check for admin join room code from sessionStorage or location state
  const adminRoomCode = sessionStorage.getItem("adminJoinRoomCode") || location.state?.roomCode || "";
  
  //for joining room states - prioritize admin room code if present
  const [roomId, setRoomId] = useState(adminRoomCode || roomid || ""); //if params is present then set it to roomid else empty string
  const [requestTickets, setRequestTickets] = useState(1);
  
  // Clear admin room code from sessionStorage after reading
  useEffect(() => {
    if (adminRoomCode) {
      sessionStorage.removeItem("adminJoinRoomCode");
    }
  }, [adminRoomCode]);

  //for updating player state when user selects tickets
  useEffect(() => {
    updatePlayer({
      requestedTicketCount: requestTickets,
    });
  }, [requestTickets, updatePlayer]);
  
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

  //for handling join room
  const handleJoin = async () => {
    if (!roomId) {
      toast.warning("Please enter a Room ID");
      return;
    } else if (requestTickets < 1) {
      toast.warning("Please select at least 1 ticket");
      return;
    }
    if (Player) {
      // Check if socket is connected first
      if (!socket.connected) {
        toast.error("Not connected to server. Please wait...");
        socket.connect();
        return;
      }
      
      setLoading(true);
      // Use publicId from URL if available, otherwise generate from roomId
      const joinPublicId = publicId || textToHash(roomId);
      
      // Set a timeout to stop loading if no response
      const loadingTimeout = setTimeout(() => {
        setLoading(false);
        toast.error("Connection timeout. Please try again.");
      }, 15000);
      
      // Handle error - use once to avoid duplicate handlers
      const handleError = (message) => {
        clearTimeout(loadingTimeout);
        setLoading(false);
        toast.error(message || "Failed to join room");
      };
      
      socket.once("error", handleError);
      
      // Emit join_room - the room_joined event will be handled by the useEffect listener
      socket.emit("join_room", socket.id, Player, roomId, joinPublicId);
    } else {
      toast.warning("Please login to join a room");
      navigate("/auth");
    }
  };

  //for listening to socket events - room_joined navigation
  useEffect(() => {
    const handleRoomJoined = (room) => {
      // room is now an object with { id, publicId }
      const roomId = typeof room === 'string' ? room : room?.id;
      const roomPublicId = typeof room === 'string' ? '' : room?.publicId;
      
      // Update gameState with roomid before navigating
      updateGameState({ roomid: roomId, publicId: roomPublicId });
      // Navigate based on role - default to user room
      if (Player?.role === "host") {
        navigate(`/host/room/${roomId}`);
      } else {
        navigate(`/user/room/${roomId}`);
      }
      setLoading(false);
    };

    // Set up event listener for room_joined
    socket.on("room_joined", handleRoomJoined);

    // Cleanup
    return () => {
      socket.off("room_joined", handleRoomJoined);
    };
  }, [Player, navigate, updateGameState]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Header />
          {location.pathname === "/user" ||
          location.pathname === `/user/${publicId}` ? (
            <>
              {Player?.id ? (
                <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-8 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
                  <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                        <span className="text-3xl">🎯</span>
                      </div>
                      <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Join a Room
                      </h2>
                      <p className="text-gray-500 text-sm mt-1">Enter the room ID to join the game</p>
                    </div>

                    {/* Room ID Input */}
                    <div className="mb-5">
                      <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="roomId">
                        🎯 Room ID
                      </label>
                      <input
                        type="text"
                        id="roomId"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room ID..."
                        className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Tickets Selection */}
                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="tickets">
                        🎫 Number of Tickets (1-6)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setRequestTickets(prev => Math.max(1, prev - 1))}
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={requestTickets <= 1}
                        >
                          -
                        </button>
                        <div className="flex-1 border border-gray-200 rounded-xl py-3 px-4 text-center text-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 font-bold text-lg">
                          🎟️ {requestTickets} Ticket{requestTickets > 1 ? 's' : ''}
                        </div>
                        <button
                          onClick={() => setRequestTickets(prev => Math.min(6, prev + 1))}
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={requestTickets >= 6}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">Host will approve your ticket request</p>
                    </div>
                    
                    {/* Connection Status */}
                    <div className={`mb-4 flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {isConnected ? 'Connected to server' : 'Connecting to server...'}
                    </div>

                    {/* Join Button */}
                    <button
                      onClick={handleJoin}
                      disabled={!isConnected}
                      className={`w-full font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 ${
                        isConnected 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isConnected ? '🚀 Join Room' : '⏳ Connecting...'}
                    </button>
                  </div>
                </div>
              ) : (
                <Authentication />
              )}
            </>
          ) : (
            <Outlet />
          )}
        </>
      )}
    </>
  );
};

export default Userpage;
