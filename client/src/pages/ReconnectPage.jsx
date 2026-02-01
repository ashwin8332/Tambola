import { useEffect, useState, useContext } from "react";
import { useLocation, Outlet, useNavigate, useParams } from "react-router-dom";

// import components
import Header from "../components/Header";
import socket from "../utils/websocket";
import Loading from "../components/Loading";

// import context
import { GameContext } from "../context/GameContext";
import { PlayerContext } from "../context/PlayerContext";

// import toastify (for notifications)
import { toast } from "react-toastify";

const ReconnectPage = () => {
  // for importing environment variables
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // for context
  const { gameSettings, updateGameSettings, updateGameState } =
    useContext(GameContext);
  const { Player, updatePlayer } = useContext(PlayerContext);

  //for navigation
  const navigate = useNavigate();

  // for getting the current path
  const location = useLocation();

  // for storing the room id and ticket count
  const temproomid = useParams();

  // for storing room id and ticket count
  const [roomId] = useState(temproomid.roomid || "");
  const [ticketCount] = useState(1);

  // for loading state
  const [loading, setLoading] = useState(false);

  // handle room joined event
  const handleRoomJoined = (room) => {
    navigate(`/host/room/${room}`);
    setLoading(false);
  };

  // handle reconnecting to room and game
  const handleReconnectToRoom = (room) => {
    navigate(`/host/room/${room.roomid}`);
    updateGameState({
      publicId: room.publicId || "",
    });
    setLoading(false);
  };
  const handleReconnectToGame = (data) => {
    setLoading(false);

    updateGameState({
      roomid: data.roomid,
      patterns: data.patterns || [],
      schedule: data.schedule || null,
      assign_numbers: data.assign_numbers || [],
      ticketCount: data.ticketCount || 0,
      claimTrack: data.claimTrack || [],
      DrawNumbers: data.DrawNumbers || [],
      name: Player?.name || "Guest",
    });
    navigate("/game");
  };

  // handle socket events
  useEffect(() => {
    socket.on("room_joined", handleRoomJoined);
    socket.on("reconnectToRoom", handleReconnectToRoom);
    socket.on("reconnectToGame", handleReconnectToGame);

    socket.on("error", (message) => {
      setLoading(false);
      toast.error(message, {
        autoClose: 2000,
      });
    });

    // Cleanup
    return () => {
      socket.off("room_joined", handleRoomJoined);
      socket.off("reconnectToRoom", handleReconnectToRoom);
      socket.off("reconnectToGame", handleReconnectToGame);
      socket.off("error");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketCount, navigate]);

  useEffect(() => {
    updatePlayer({
      ticketCount: ticketCount,
    });
  }, [ticketCount, updatePlayer]);

  // handle join room button click
  const handleJoinRoom = async () => {
    setLoading(true);
    // for checking if player is invited or not
    const invitedRes = await fetch(`${apiBaseUrl}/api/game/invited`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: Player?.phone,
        roomid: roomId,
      }),
    });
    const invitedData = await invitedRes.json();
    setLoading(false);
    if (invitedRes.status === 200) {
      // console.log("the player is invited");
      socket.emit("reconnect_player", { ...Player, socketId: socket.id }, roomId);
      setLoading(true);
    } else {
      const message = invitedData?.message;
      setLoading(false);
      toast.error(message || "You are not joined the room", {
        autoClose: 2000,
      });
    }
  };
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Header />
          {location.pathname === "reconnect" ||
          location.pathname === `/reconnect/${roomId}` ? (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-8 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
              <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Reconnect to Room
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Enter your room ID to rejoin the game</p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="roomId">
                    🎯 Room ID
                  </label>
                  <input
                    type="text"
                    id="roomId"
                    value={roomId || gameSettings?.roomId}
                    onChange={(e) => {
                      updateGameSettings({ roomId: e.target.value });
                      updateGameState({ roomId: e.target.value });
                    }}
                    placeholder="Enter room ID..."
                    className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  🔄 Reconnect
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

export default ReconnectPage;
