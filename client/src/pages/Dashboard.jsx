import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Loading from "../components/Loading";
import { PlayerContext } from "../context/PlayerContext";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams(); // room ID from route

  const { Player, getAccessToken } = useContext(PlayerContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const accessToken = getAccessToken();

        const response = await fetch(`${apiBaseUrl}/api/game/rooms`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || ""}`,
          },
          credentials: "include",
        });
        const data = await response.json();
        if (response.status === 200) {
          setRooms(data.rooms || []);
        } else {
          console.error("Error fetching rooms:", data.message);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching rooms:", error);
      }
    };

    setLoading(true);
    setTimeout(() => {
      fetchRooms();
      setLoading(false);
    }, 500);
  }, [getAccessToken]);

  useEffect(() => {
    if (!Player || Player.role !== "host") {
      navigate("/auth");
    }
  }, [Player, navigate]);

  if (id) {
    // Detail page logic
    const selectedRoom = rooms.find((r) => r.roomid === id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4 pt-20">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50">
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🧾 Room Details
            </h1>
            <p className="text-center text-gray-500 text-lg">{id}</p>
          </div>

          {/* CLAIM DATA */}
          {selectedRoom?.claimData.length > 0 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                🎯 Claim Data
              </h2>
              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left rounded-tl-xl">Player Name</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-left rounded-tr-xl">Pattern</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50">
                    {selectedRoom?.claimData.map((claim, index) => (
                      <tr key={claim?._id || index} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {claim?.player?.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {claim?.player?.phone}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-medium capitalize">
                            {claim?.pattern}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOM INFO */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              ℹ️ Room Info
            </h2>
            <div className="flex flex-wrap gap-3">
              {selectedRoom?.isOngoing && (
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-2">
                  🔵 Ongoing
                </span>
              )}
              {selectedRoom?.isCompleted && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-2">
                  ✅ Completed
                </span>
              )}
              {selectedRoom?.finishTime && (
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium">
                  📅 {selectedRoom.finishTime}
                </span>
              )}
            </div>
          </div>

          {/* PLAYER DATA */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              👥 Players
            </h2>
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left rounded-tl-xl">Name</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Tickets</th>
                    <th className="px-4 py-3 text-left rounded-tr-xl">Claims</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50">
                  {selectedRoom?.players.map((player) => (
                    <tr key={player?._id} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {player?.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {player?.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {player?.ticketCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {player?.claims && player.claims.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {player.claims.map((claim, index) =>
                              claim.map((c) => (
                                <span
                                  key={c.name + index}
                                  className="inline-block px-2 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded text-xs font-medium"
                                >
                                  {c?.name} ({c?.ticketNo?.length})
                                </span>
                              ))
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-0.5 transition-all"
            >
              ⬅️ Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default dashboard (room list)
  return loading ? (
    <Loading />
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <Header />
      <div className="max-w-5xl mx-auto pt-20 px-4 pb-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 mb-6">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🏠 Room Dashboard
          </h1>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 border border-white/50 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No rooms available yet</p>
            <button
              onClick={() => navigate("/host")}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <div
                key={room.roomid}
                onClick={() => navigate(`/dashboard/${room.roomid}`)}
                className="bg-white/80 backdrop-blur-lg cursor-pointer rounded-2xl p-6 border border-white/50 hover:shadow-xl hover:shadow-purple-500/10 transform hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Room: <span className="text-purple-600">{room.roomid}</span>
                  </h2>
                  <span className="text-2xl group-hover:scale-125 transition-transform">🎯</span>
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    👥 {room.players.length} Players
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    🎮 {room.settings.patterns.length} Patterns
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/${room.roomid}`);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow hover:shadow-lg transition-all"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
