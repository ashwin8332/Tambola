import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Loading from "../components/Loading";
import { PlayerContext } from "../context/PlayerContext";
import socket from "../utils/websocket.js";
import authApi from "../utils/authApi.js";
import { toast } from "react-toastify";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const UsersDashboard = () => {
  const navigate = useNavigate();
  const { Player, updatePlayer, loading, setLoading, getAccessToken } = useContext(PlayerContext);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [invites, setInvites] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [gameHistory, setGameHistory] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [announcements, setAnnouncements] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalClaims: 0,
  });

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await authApi.get("/get-invites");
        if (res.status === 200) {
          setInvites(res.data?.invites || []);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching data:", error);
      }
    };

    if (Player?.phone) {
      fetchData();
    }
  }, [Player, setLoading]);

  // Socket event handling
  useEffect(() => {
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      setLoading(false);
    });

    return () => {
      socket.off("error");
    };
  }, [setLoading]);

  // Handle role change
  const handleRoleChange = async (role) => {
    setLoading(true);
    const res = await authApi.post("/change-role", { role });
    if (res.status === 200) {
      updatePlayer(res.data.user);
      toast.success(`Role changed to ${role === "host" ? "Host" : "Player"}`);
    } else {
      toast.error("Error changing role. Please try again.");
    }
    setLoading(false);
  };

  // Handle room join
  const handleRoomJoinClick = (roomId) => {
    navigate(`/${Player?.role}/${roomId}`);
  };

  // Handle invite decline
  const handleDeclineInvite = async (inviteId) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/game/invite/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      setLoading(false);

      if (res.status === 200) {
        setInvites(data?.invites || []);
        toast.success("Invite declined");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error:", error);
    }
  };

  // Tambola Rules
  const tambolaRules = [
    {
      title: "🎯 Objective",
      description: "Mark off numbers on your ticket as they are called. Complete patterns to win prizes!"
    },
    {
      title: "🎫 Tickets",
      description: "Each ticket has 15 numbers arranged in 3 rows and 9 columns. Each row has exactly 5 numbers."
    },
    {
      title: "📢 Number Calling",
      description: "Numbers from 1 to 90 are called randomly. Listen carefully and mark matching numbers on your ticket."
    },
    {
      title: "🏆 Winning Patterns",
      items: [
        { name: "Early Five", desc: "First to mark any 5 numbers" },
        { name: "Top Line", desc: "Complete the first row" },
        { name: "Middle Line", desc: "Complete the second row" },
        { name: "Bottom Line", desc: "Complete the third row" },
        { name: "Four Corners", desc: "Mark all four corners of the ticket" },
        { name: "Full House", desc: "Mark all 15 numbers on the ticket" },
      ]
    },
    {
      title: "✋ Claiming",
      description: "Click the claim button immediately when you complete a pattern. Late claims may be invalid!"
    },
    {
      title: "⚠️ Important",
      description: "False claims will result in warnings. Multiple false claims may lead to disqualification."
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "play", label: "Play Game", icon: "🎮" },
    { id: "invites", label: "Invitations", icon: "📩", badge: invites.length },
    { id: "history", label: "Game History", icon: "📜" },
    { id: "rules", label: "How to Play", icon: "📖" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, {Player?.name || "Guest"}! 👋
                </h1>
                <p className="text-purple-100 text-lg">
                  Ready to play some Tambola? Let&apos;s win some prizes!
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    Player?.role === "host" 
                      ? "bg-amber-400/20 text-amber-200 border border-amber-400/30" 
                      : "bg-green-400/20 text-green-200 border border-green-400/30"
                  }`}>
                    {Player?.role === "host" ? "👑 Host" : "🎮 Player"}
                  </span>
                  {Player?.phone && (
                    <span className="text-purple-200 text-sm">📱 {Player.phone}</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {Player?.role === "host" ? (
                  <button
                    onClick={() => navigate("/host")}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    🎮 Host a Game
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/user")}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    🔗 Join a Game
                  </button>
                )}
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="px-6 py-3 bg-white/20 backdrop-blur rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  📖 How to Play
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Current Role</p>
                <p className="text-2xl font-bold text-gray-800 capitalize">{Player?.role || "Guest"}</p>
              </div>
              <span className="text-4xl">{Player?.role === "host" ? "👑" : "🎮"}</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Game Invites</p>
                <p className="text-2xl font-bold text-purple-600">{invites.length}</p>
              </div>
              <span className="text-4xl">📩</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Games Played</p>
                <p className="text-2xl font-bold text-blue-600">{stats.gamesPlayed}</p>
              </div>
              <span className="text-4xl">🎯</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl shadow-lg p-6 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Wins</p>
                <p className="text-2xl font-bold text-green-600">{stats.gamesWon}</p>
              </div>
              <span className="text-4xl">🏆</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Tabs Navigation */}
          <div className="md:col-span-1">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-4 border border-white/50 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Navigation</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </span>
                    {tab.badge > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeTab === tab.id ? "bg-white text-purple-600" : "bg-red-500 text-white"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Role Switch */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3 px-2">Switch Role</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRoleChange("host")}
                    disabled={Player?.role === "host"}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      Player?.role === "host"
                        ? "bg-purple-100 text-purple-600 border-2 border-purple-500"
                        : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                    }`}
                  >
                    👑 Host
                  </button>
                  <button
                    onClick={() => handleRoleChange("user")}
                    disabled={Player?.role === "user"}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      Player?.role === "user"
                        ? "bg-green-100 text-green-600 border-2 border-green-500"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50"
                    }`}
                  >
                    🎮 Player
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tab Content */}
          <div className="md:col-span-2">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Announcements */}
                {announcements.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                      📢 Announcements
                    </h3>
                    <div className="space-y-3">
                      {announcements.map((ann, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-gray-700">{ann.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/50">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">🚀 Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Player?.role === "host" && (
                      <>
                        <button
                          onClick={() => navigate("/host")}
                          className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                          <span className="text-3xl block mb-2">🎮</span>
                          Create New Game
                        </button>
                        <button
                          onClick={() => navigate("/dashboard")}
                          className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                          <span className="text-3xl block mb-2">📊</span>
                          Host Dashboard
                        </button>
                      </>
                    )}
                    {Player?.role === "user" && (
                      <>
                        <button
                          onClick={() => navigate("/user")}
                          className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                          <span className="text-3xl block mb-2">🔗</span>
                          Join Game
                        </button>
                        <button
                          onClick={() => setActiveTab("invites")}
                          className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all relative"
                        >
                          <span className="text-3xl block mb-2">📩</span>
                          View Invitations
                          {invites.length > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {invites.length}
                            </span>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowRulesModal(true)}
                      className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                      <span className="text-3xl block mb-2">📖</span>
                      Game Rules
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="p-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                      <span className="text-3xl block mb-2">⚙️</span>
                      Settings
                    </button>
                  </div>
                </div>

                {/* Recent Invites Preview */}
                {invites.length > 0 && (
                  <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">📩 Pending Invitations</h3>
                      <button
                        onClick={() => setActiveTab("invites")}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {invites.slice(0, 3).map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between bg-purple-50 rounded-xl p-4">
                          <div>
                            <p className="font-medium text-gray-800">Room: {invite.id}</p>
                            <p className="text-sm text-gray-500">
                              {invite?.schedule ? `Scheduled: ${invite.schedule}` : "Ready to join"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRoomJoinClick(invite.id)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Play Game Tab */}
            {activeTab === "play" && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8 border border-white/50">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">🎮 Start Playing</h3>
                
                <div className="space-y-6">
                  {Player?.role === "host" ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
                        <h4 className="text-2xl font-bold mb-4">Create a New Game</h4>
                        <p className="text-green-100 mb-6">
                          Set up a new Tambola room, invite players, and start the fun!
                        </p>
                        <button
                          onClick={() => navigate("/host")}
                          className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                          🎯 Create Game Room
                        </button>
                      </div>

                      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                        <h4 className="text-lg font-bold text-blue-800 mb-2">💡 Host Tips</h4>
                        <ul className="text-blue-700 space-y-2 list-disc list-inside">
                          <li>Share the room code with players to let them join</li>
                          <li>Set up prize patterns before starting the game</li>
                          <li>Use the dashboard to track all your games</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white">
                        <h4 className="text-2xl font-bold mb-4">Join a Game</h4>
                        <p className="text-purple-100 mb-6">
                          Enter a room code or accept an invitation to start playing!
                        </p>
                        <button
                          onClick={() => navigate("/user")}
                          className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                          🔗 Enter Room Code
                        </button>
                      </div>

                      <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                        <h4 className="text-lg font-bold text-purple-800 mb-2">💡 Player Tips</h4>
                        <ul className="text-purple-700 space-y-2 list-disc list-inside">
                          <li>Stay alert - numbers are called quickly!</li>
                          <li>Claim immediately when you complete a pattern</li>
                          <li>Double-check your ticket before claiming</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invitations Tab */}
            {activeTab === "invites" && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/50">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📩 Game Invitations</h3>
                
                {invites.length > 0 ? (
                  <div className="space-y-4">
                    {invites.map((invite) => (
                      <div key={invite.id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-bold text-gray-800">🏠 Room: {invite.id}</p>
                            <p className="text-gray-500 mt-1">
                              {invite?.schedule ? `📅 Scheduled: ${invite.schedule}` : "🟢 Ready to join now"}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleRoomJoinClick(invite.id)}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                            >
                              ✅ Join Game
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(invite.id)}
                              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            >
                              ❌ Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <span className="text-6xl block mb-4">📭</span>
                    <h4 className="text-xl font-bold text-gray-700 mb-2">No Invitations</h4>
                    <p className="text-gray-500 mb-6">You don&apos;t have any game invitations at the moment.</p>
                    <button
                      onClick={() => navigate("/user")}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all"
                    >
                      Join Game with Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/50">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📜 Game History</h3>
                
                {gameHistory.length > 0 ? (
                  <div className="space-y-4">
                    {gameHistory.map((game, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{game.roomId}</p>
                            <p className="text-gray-500 text-sm">{game.date}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            game.won ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {game.won ? "🏆 Won" : "Played"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <span className="text-6xl block mb-4">🎮</span>
                    <h4 className="text-xl font-bold text-gray-700 mb-2">No Games Yet</h4>
                    <p className="text-gray-500 mb-6">Join or host a game to start building your history!</p>
                    <button
                      onClick={() => setActiveTab("play")}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all"
                    >
                      Start Playing
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === "rules" && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/50">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📖 How to Play Tambola</h3>
                
                <div className="space-y-6">
                  {tambolaRules.map((rule, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                      <h4 className="text-lg font-bold text-gray-800 mb-3">{rule.title}</h4>
                      {rule.description && (
                        <p className="text-gray-600">{rule.description}</p>
                      )}
                      {rule.items && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {rule.items.map((item, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="font-semibold text-purple-700">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/50">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Settings</h3>
                
                <div className="space-y-6">
                  {/* Profile Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">👤 Profile Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Name</label>
                        <p className="font-medium text-gray-800">{Player?.name || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="font-medium text-gray-800">{Player?.phone || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Role</label>
                        <p className="font-medium text-gray-800 capitalize">{Player?.role || "Guest"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role Settings */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">🎭 Switch Role</h4>
                    <p className="text-gray-500 mb-4">Change your role to host games or join as a player.</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleRoleChange("host")}
                        disabled={Player?.role === "host"}
                        className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all ${
                          Player?.role === "host"
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-500"
                        }`}
                      >
                        👑 Host Mode
                      </button>
                      <button
                        onClick={() => handleRoleChange("user")}
                        disabled={Player?.role === "user"}
                        className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all ${
                          Player?.role === "user"
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-white text-gray-600 border-2 border-gray-200 hover:border-green-500"
                        }`}
                      >
                        🎮 Player Mode
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                    <h4 className="text-lg font-bold text-red-800 mb-2">🚪 Logout</h4>
                    <p className="text-red-600 mb-4">Sign out of your account.</p>
                    <button
                      onClick={() => navigate("/auth")}
                      className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">📖 Tambola Rules</h3>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="text-white/80 hover:text-white text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {tambolaRules.map((rule, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{rule.title}</h4>
                  {rule.description && (
                    <p className="text-gray-600">{rule.description}</p>
                  )}
                  {rule.items && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {rule.items.map((item, i) => (
                        <div key={i} className="bg-purple-50 rounded-lg p-3">
                          <p className="font-semibold text-purple-700">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Got it! 🎯
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersDashboard;
