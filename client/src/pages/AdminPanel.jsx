import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../context/AdminContext";
import adminApi from "../utils/adminApi";
import { toast } from "react-toastify";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { admin, isAuthenticated, loading, logout, fetchDashboard } = useContext(AdminContext);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTheme, setSidebarTheme] = useState("dark"); // dark, light, gradient
  const sidebarPosition = "left"; // left, right (currently fixed, can be made stateful if needed)

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    hostUsers: 0,
    regularUsers: 0,
    activeRooms: 0,
    completedRooms: 0,
    totalRooms: 0,
    totalGamesPlayed: 0,
    bookedTickets: 0,
    gameActive: false,
  });

  // Game Settings
  const [gameSettings, setGameSettings] = useState({
    gameDate: "",
    gameTime: "",
    totalTicketLimit: 50,
    ticketPrice: 50,
    websiteStatus: "open",
    bookingStatus: "open",
    callingInterval: 10,
  });

  // Dividends
  const [dividends, setDividends] = useState([]);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");

  // Booked Tickets
  const [bookedTickets, setBookedTickets] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    ticketId: "",
    playerName: "",
    playerPhone: "",
  });

  // Users list
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  // Rooms list
  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");

  // System Logs
  const [logs, setLogs] = useState([]);

  // Join Game Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState("");

  // Mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [loading, isAuthenticated, navigate]);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      if (data) {
        if (data.gameSettings) {
          setGameSettings({
            ...data.gameSettings,
            gameDate: data.gameSettings.gameDate
              ? new Date(data.gameSettings.gameDate).toISOString().split("T")[0]
              : "",
          });
        }
        if (data.dividends) setDividends(data.dividends);
        if (data.announcements) setAnnouncements(data.announcements);
        if (data.bookedTickets) setBookedTickets(data.bookedTickets);
      }
      // Load stats
      const statsData = await adminApi.getStats();
      if (statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    }
  }, [fetchDashboard]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
      loadUsers();
      loadRooms();
    }
  }, [isAuthenticated, loadDashboard]);

  // Load users
  const loadUsers = async () => {
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  // Load rooms
  const loadRooms = async () => {
    try {
      const data = await adminApi.getAllRooms();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };

  // Load system logs
  const loadLogs = async () => {
    try {
      const data = await adminApi.getSystemLogs();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to load logs:", error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab === "users") loadUsers();
    if (tab === "rooms") loadRooms();
    if (tab === "logs") loadLogs();
  };

  // Save game settings
  const handleSaveSettings = async () => {
    try {
      await adminApi.updateGameSettings(gameSettings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  // Save dividends
  const handleSaveDividends = async () => {
    try {
      await adminApi.updateDividends(dividends);
      toast.success("Prize settings saved!");
    } catch (error) {
      toast.error(error.message || "Failed to save dividends");
    }
  };

  // Create announcement
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim()) {
      toast.warning("Please enter announcement text");
      return;
    }
    try {
      await adminApi.createAnnouncement({ text: newAnnouncement });
      setNewAnnouncement("");
      await loadDashboard();
      toast.success("Announcement created!");
    } catch (error) {
      toast.error(error.message || "Failed to create announcement");
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id) => {
    try {
      await adminApi.deleteAnnouncement(id);
      await loadDashboard();
      toast.success("Announcement deleted!");
    } catch (error) {
      toast.error(error.message || "Failed to delete announcement");
    }
  };

  // Book ticket
  const handleBookTicket = async () => {
    if (!bookingForm.ticketId || !bookingForm.playerName || !bookingForm.playerPhone) {
      toast.warning("Please fill all fields");
      return;
    }
    try {
      await adminApi.bookTicket(bookingForm);
      setBookingForm({ ticketId: "", playerName: "", playerPhone: "" });
      await loadDashboard();
      toast.success("Ticket booked successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to book ticket");
    }
  };

  // Cancel ticket
  const handleCancelTicket = async (ticketId) => {
    try {
      await adminApi.cancelTicket(ticketId);
      await loadDashboard();
      toast.success("Ticket cancelled!");
    } catch (error) {
      toast.error(error.message || "Failed to cancel ticket");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await adminApi.deleteUser(userId);
      await loadUsers();
      await loadDashboard();
      toast.success("User deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  // Change user role
  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await adminApi.changeUserRole(userId, newRole);
      await loadUsers();
      toast.success(`Role changed to ${newRole}`);
    } catch (error) {
      toast.error(error.message || "Failed to change role");
    }
  };

  // Delete room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await adminApi.deleteRoom(roomId);
      await loadRooms();
      toast.success("Room deleted!");
    } catch (error) {
      toast.error(error.message || "Failed to delete room");
    }
  };

  // Force end room
  const handleForceEndRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to force end this room?")) return;
    try {
      await adminApi.forceEndRoom(roomId);
      await loadRooms();
      toast.success("Room ended!");
    } catch (error) {
      toast.error(error.message || "Failed to end room");
    }
  };

  // Shuffle tickets
  const handleShuffleTickets = async () => {
    try {
      await adminApi.shuffleTickets();
      toast.success("Tickets shuffled successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to shuffle tickets");
    }
  };

  // Clear all rooms
  const handleClearAllRooms = async (onlyCompleted = false) => {
    const confirmMsg = onlyCompleted 
      ? "Clear all completed rooms?" 
      : "Clear ALL rooms? This cannot be undone!";
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const result = await adminApi.clearAllRooms(onlyCompleted);
      await loadRooms();
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message || "Failed to clear rooms");
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (!window.confirm("Clear all system logs?")) return;
    try {
      await adminApi.clearSystemLogs();
      setLogs([]);
      toast.success("Logs cleared!");
    } catch (error) {
      toast.error(error.message || "Failed to clear logs");
    }
  };

  // Join game as admin - navigate to user page to properly join the room
  const handleJoinGame = () => {
    if (!joinRoomCode.trim()) {
      toast.warning("Please enter a room code");
      return;
    }
    // Store the room code and navigate to user page
    // The user page will handle the actual socket connection and room joining
    sessionStorage.setItem("adminJoinRoomCode", joinRoomCode.trim());
    toast.info("Redirecting to join room. Please ensure you are logged in.");
    navigate("/user", { state: { roomCode: joinRoomCode.trim() } });
    setShowJoinModal(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.phone?.includes(userSearch);
    const matchesFilter = userFilter === "all" || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomid?.toLowerCase().includes(roomSearch.toLowerCase()) ||
      room.publicId?.toLowerCase().includes(roomSearch.toLowerCase());
    const matchesFilter = roomFilter === "all" || 
      (roomFilter === "active" && room.isOngoing && !room.isCompleted) ||
      (roomFilter === "completed" && room.isCompleted);
    return matchesSearch && matchesFilter;
  });


  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥", badge: stats.totalUsers },
    { id: "rooms", label: "Rooms", icon: "🏠", badge: stats.activeRooms },
    { id: "settings", label: "Game Settings", icon: "⚙️" },
    { id: "dividends", label: "Prizes", icon: "💰" },
    { id: "announcements", label: "Announcements", icon: "📢" },
    { id: "tickets", label: "Tickets", icon: "🎫" },
    { id: "logs", label: "System Logs", icon: "📝" },
  ];

  // Sidebar theme classes
  const getSidebarThemeClasses = () => {
    switch (sidebarTheme) {
      case 'light':
        return 'bg-white/95 border-gray-200 text-gray-800';
      case 'gradient':
        return 'bg-gradient-to-br from-purple-600/90 via-blue-600/90 to-indigo-700/90 border-white/20 text-white';
      default:
        return 'bg-black/40 border-white/10 text-white';
    }
  };

  const getSidebarWidth = () => {
    if (sidebarCollapsed) return 'w-16';
    return sidebarOpen ? 'w-64' : 'w-20';
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {(sidebarOpen && !sidebarCollapsed) && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-purple-300 truncate bg-purple-500/20 px-2 py-1 rounded-full">{admin?.username}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-all hidden lg:block group"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="block group-hover:scale-110 transition-transform">
                {sidebarCollapsed ? "▶" : "◀"}
              </span>
            </button>
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-white/10 text-white transition-all hidden lg:block group"
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <span className="block group-hover:scale-110 transition-transform">
                {sidebarOpen ? "⚊" : "☰"}
              </span>
            </button>
          </div>
        </div>
        
        {/* Sidebar Customization Options */}
        {(sidebarOpen && !sidebarCollapsed) && (
          <div className="mt-4 p-3 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-400 mb-2">Customize</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSidebarTheme('dark')}
                className={`w-6 h-6 rounded-full bg-gray-800 border-2 ${sidebarTheme === 'dark' ? 'border-purple-400' : 'border-gray-600'}`}
                title="Dark Theme"
              />
              <button
                onClick={() => setSidebarTheme('light')}
                className={`w-6 h-6 rounded-full bg-white border-2 ${sidebarTheme === 'light' ? 'border-purple-400' : 'border-gray-300'}`}
                title="Light Theme"
              />
              <button
                onClick={() => setSidebarTheme('gradient')}
                className={`w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border-2 ${sidebarTheme === 'gradient' ? 'border-white' : 'border-gray-600'}`}
                title="Gradient Theme"
              />
            </div>
          </div>
        )}
      </div>

      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative group">
            <button
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className={`${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center transition-all ${
                activeTab === tab.id 
                  ? "bg-white/20 shadow-lg" 
                  : "bg-transparent group-hover:bg-white/10"
              }`}>
                <span className={sidebarCollapsed ? 'text-lg' : 'text-xl'}>{tab.icon}</span>
              </div>
              
              {((sidebarOpen && !sidebarCollapsed) || mobileMenuOpen) && (
                <>
                  <span className="flex-1 text-left font-medium">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id 
                        ? "bg-white/30 text-white" 
                        : "bg-purple-500/20 text-purple-400"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </>
              )}
            </button>
            
            {/* Tooltip for collapsed mode */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-500 rounded-full text-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {((sidebarOpen && !sidebarCollapsed) || mobileMenuOpen) && (
        <div className="p-4 border-t border-white/10">
          <div className="mb-4 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎮</span>
                <div>
                  <p className="text-sm font-medium text-green-400">Join Game</p>
                  <p className="text-xs text-green-300/70">Enter room code</p>
                </div>
              </div>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/50 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
      
      {/* Collapsed Bottom Actions */}
      {sidebarCollapsed && (
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <div className="relative group">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all flex items-center justify-center"
            >
              <span className="text-xl">🎮</span>
            </button>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
              Join Game
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={handleLogout}
              className="w-full p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all flex items-center justify-center"
            >
              <span className="text-xl">🚪</span>
            </button>
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
              Logout
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 lg:flex relative">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-black/50 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">👑</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-purple-300">{admin?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${stats.gameActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-xs text-gray-300">{stats.gameActive ? 'Live' : 'Off'}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-72 h-full bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {sidebarOpen && (
        <aside className={`hidden lg:flex flex-col ${getSidebarWidth()} ${getSidebarThemeClasses()} backdrop-blur-xl border-r transition-all duration-300 fixed h-full z-40 ${sidebarPosition === 'right' ? 'right-0' : 'left-0'}`}>
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : 'lg:ml-0'} ${sidebarPosition === 'right' && sidebarOpen ? (sidebarCollapsed ? 'lg:mr-16 lg:ml-0' : 'lg:mr-64 lg:ml-0') : ''}`}>
        
        {/* Top Header - Desktop Only */}
        <header className="hidden lg:block bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30 shadow-lg">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-xs text-gray-400">Manage your Tambola platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button>
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shadow-lg ${stats.gameActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium ${stats.gameActive ? 'text-green-400' : 'text-red-400'}">
                    {stats.gameActive ? 'Game Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-white/50 text-xs">|
                </div>
                <div className="text-xs text-gray-300">
                  {stats.totalUsers} users
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="group bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-4 lg:p-6 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg">👥</span>
                        </div>
                        <p className="text-purple-300 text-xs lg:text-sm font-semibold">Total Users</p>
                      </div>
                      <p className="text-2xl lg:text-4xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{stats.totalUsers}</p>
                      <p className="text-xs text-purple-400 hidden sm:block">
                        <span className="bg-purple-500/20 px-2 py-1 rounded-full">
                          {stats.hostUsers} hosts
                        </span>
                        <span className="mx-1">•</span>
                        <span className="bg-purple-500/20 px-2 py-1 rounded-full">
                          {stats.regularUsers} players
                        </span>
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl opacity-80">👥</span>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-4 lg:p-6 border border-blue-500/30 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🏠</span>
                        </div>
                        <p className="text-blue-300 text-xs lg:text-sm font-semibold">Active Rooms</p>
                      </div>
                      <p className="text-2xl lg:text-4xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{stats.activeRooms}</p>
                      <p className="text-xs text-blue-400 hidden sm:block">
                        <span className="bg-blue-500/20 px-2 py-1 rounded-full">
                          {stats.completedRooms} completed
                        </span>
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl opacity-80">🏠</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-4 lg:p-6 border border-green-500/30 hover:border-green-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-xs lg:text-sm">Total Rooms</p>
                      <p className="text-2xl lg:text-4xl font-bold text-white mt-1">{stats.totalRooms}</p>
                      <p className="text-xs text-green-400 mt-1 lg:mt-2 hidden sm:block">All time</p>
                    </div>
                    <span className="text-3xl lg:text-5xl opacity-50">🎯</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-2xl p-4 lg:p-6 border border-amber-500/30 hover:border-amber-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-300 text-xs lg:text-sm">Booked Tickets</p>
                      <p className="text-2xl lg:text-4xl font-bold text-white mt-1">{bookedTickets.length}</p>
                      <p className="text-xs text-amber-400 mt-1 lg:mt-2 hidden sm:block">
                        / {stats.ticketLimit || 50} limit
                      </p>
                    </div>
                    <span className="text-3xl lg:text-5xl opacity-50">🎫</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">🚀 Quick Actions</h3>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="p-3 lg:p-4 bg-green-600/20 rounded-xl text-green-300 hover:bg-green-600/30 transition-all flex flex-col items-center gap-1 lg:gap-2"
                  >
                    <span className="text-xl lg:text-2xl">🎮</span>
                    <span className="text-xs lg:text-sm font-medium text-center">Join Game</span>
                  </button>
                  <button
                    onClick={handleShuffleTickets}
                    className="p-3 lg:p-4 bg-purple-600/20 rounded-xl text-purple-300 hover:bg-purple-600/30 transition-all flex flex-col items-center gap-1 lg:gap-2"
                  >
                    <span className="text-xl lg:text-2xl">🔀</span>
                    <span className="text-xs lg:text-sm font-medium text-center">Shuffle</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("users")}
                    className="p-3 lg:p-4 bg-blue-600/20 rounded-xl text-blue-300 hover:bg-blue-600/30 transition-all flex flex-col items-center gap-1 lg:gap-2"
                  >
                    <span className="text-xl lg:text-2xl">👥</span>
                    <span className="text-xs lg:text-sm font-medium text-center">Users</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("rooms")}
                    className="p-3 lg:p-4 bg-indigo-600/20 rounded-xl text-indigo-300 hover:bg-indigo-600/30 transition-all flex flex-col items-center gap-1 lg:gap-2"
                  >
                    <span className="text-xl lg:text-2xl">🏠</span>
                    <span className="text-xs lg:text-sm font-medium text-center">Rooms</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("settings")}
                    className="p-3 lg:p-4 bg-amber-600/20 rounded-xl text-amber-300 hover:bg-amber-600/30 transition-all flex flex-col items-center gap-1 lg:gap-2"
                  >
                    <span className="text-xl lg:text-2xl">⚙️</span>
                    <span className="text-xs lg:text-sm font-medium text-center">Settings</span>
                  </button>
                  <button
                    onClick={() => handleTabChange("announcements")}
                    className="p-3 lg:p-4 bg-pink-600/20 rounded-xl text-pink-300 hover:bg-pink-600/30 transition-all flex flex-col items-center gap-1 lg:gap-2"
                  >
                    <span className="text-xl lg:text-2xl">📢</span>
                    <span className="text-xs lg:text-sm font-medium text-center">Announce</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base lg:text-lg font-bold text-white">👥 Recent Users</h3>
                    <button
                      onClick={() => handleTabChange("users")}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user._id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm lg:text-base">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm lg:text-base">{user.name}</p>
                            <p className="text-gray-400 text-xs lg:text-sm">{user.phone}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "host" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No users yet</p>
                    )}
                  </div>
                </div>

                {/* Active Rooms */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base lg:text-lg font-bold text-white">🏠 Active Rooms</h3>
                    <button
                      onClick={() => handleTabChange("rooms")}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {rooms.filter(r => r.isOngoing && !r.isCompleted).slice(0, 5).map((room) => (
                      <div key={room._id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                        <div>
                          <p className="text-white font-medium text-sm lg:text-base">{room.roomid}</p>
                          <p className="text-gray-400 text-xs lg:text-sm">{room.players?.length || 0} players</p>
                        </div>
                        <button
                          onClick={() => navigate(`/host/room/${room.roomid}`)}
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-xs lg:text-sm"
                        >
                          Join
                        </button>
                      </div>
                    ))}
                    {rooms.filter(r => r.isOngoing && !r.isCompleted).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No active rooms</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name or phone..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setUserFilter("all")}
                      className={`px-4 py-2 rounded-xl transition-all text-sm ${
                        userFilter === "all" ? "bg-purple-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      All ({users.length})
                    </button>
                    <button
                      onClick={() => setUserFilter("host")}
                      className={`px-4 py-2 rounded-xl transition-all text-sm ${
                        userFilter === "host" ? "bg-purple-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Hosts ({users.filter(u => u.role === "host").length})
                    </button>
                    <button
                      onClick={() => setUserFilter("user")}
                      className={`px-4 py-2 rounded-xl transition-all text-sm ${
                        userFilter === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Players ({users.filter(u => u.role === "user").length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Users List - Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.phone}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        user.role === "host" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleChangeUserRole(user._id, user.role === "host" ? "user" : "host")}
                        className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm"
                      >
                        Make {user.role === "host" ? "Player" : "Host"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Users Table - Desktop */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-4 px-6 text-gray-400 font-medium">User</th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium">Phone</th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium">Role</th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium">Joined</th>
                        <th className="text-left py-4 px-6 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-white font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-300">{user.phone}</td>
                          <td className="py-4 px-6">
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeUserRole(user._id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium bg-transparent border cursor-pointer ${
                                user.role === "host" 
                                  ? "border-purple-500 text-purple-400" 
                                  : "border-blue-500 text-blue-400"
                              }`}
                            >
                              <option value="host" className="bg-slate-800">Host</option>
                              <option value="user" className="bg-slate-800">Player</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-sm">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No users found</p>
                )}
              </div>
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Search rooms..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setRoomFilter("all")}
                      className={`px-4 py-2 rounded-xl transition-all text-sm ${
                        roomFilter === "all" ? "bg-purple-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setRoomFilter("active")}
                      className={`px-4 py-2 rounded-xl transition-all text-sm ${
                        roomFilter === "active" ? "bg-green-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setRoomFilter("completed")}
                      className={`px-4 py-2 rounded-xl transition-all text-sm ${
                        roomFilter === "completed" ? "bg-gray-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => handleClearAllRooms(true)}
                      className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all text-sm"
                    >
                      Clear Completed
                    </button>
                  </div>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <div key={room._id} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-bold text-base lg:text-lg">{room.roomid}</h3>
                        <p className="text-gray-400 text-xs lg:text-sm">Public: {room.publicId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        room.isCompleted 
                          ? "bg-gray-500/20 text-gray-400" 
                          : room.isOngoing 
                            ? "bg-green-500/20 text-green-400 animate-pulse" 
                            : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {room.isCompleted ? "Completed" : room.isOngoing ? "🔴 Live" : "Waiting"}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <p className="text-gray-400">
                        👥 Players: <span className="text-white">{room.players?.length || 0}</span>
                      </p>
                      <p className="text-gray-400">
                        🎫 Claims: <span className="text-white">{room.claimData?.length || 0}</span>
                      </p>
                      {room.host && (
                        <p className="text-gray-400">
                          👑 Host: <span className="text-white">{room.host.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {room.isOngoing && !room.isCompleted && (
                        <>
                          <button
                            onClick={() => navigate(`/host/room/${room.roomid}`)}
                            className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm"
                          >
                            🎮 Join
                          </button>
                          <button
                            onClick={() => handleForceEndRoom(room._id)}
                            className="px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all text-sm"
                          >
                            ⏹️
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-6xl">🏠</span>
                  <p className="text-gray-500 mt-4">No rooms found</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">⚙️ Game Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Game Date</label>
                  <input
                    type="date"
                    value={gameSettings.gameDate}
                    onChange={(e) => setGameSettings({ ...gameSettings, gameDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Game Time</label>
                  <input
                    type="time"
                    value={gameSettings.gameTime}
                    onChange={(e) => setGameSettings({ ...gameSettings, gameTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Total Ticket Limit</label>
                  <input
                    type="number"
                    value={gameSettings.totalTicketLimit}
                    onChange={(e) => setGameSettings({ ...gameSettings, totalTicketLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Ticket Price (₹)</label>
                  <input
                    type="number"
                    value={gameSettings.ticketPrice}
                    onChange={(e) => setGameSettings({ ...gameSettings, ticketPrice: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Website Status</label>
                  <select
                    value={gameSettings.websiteStatus}
                    onChange={(e) => setGameSettings({ ...gameSettings, websiteStatus: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  >
                    <option value="open" className="bg-slate-800">Open</option>
                    <option value="closed" className="bg-slate-800">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Booking Status</label>
                  <select
                    value={gameSettings.bookingStatus}
                    onChange={(e) => setGameSettings({ ...gameSettings, bookingStatus: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  >
                    <option value="open" className="bg-slate-800">Open</option>
                    <option value="closed" className="bg-slate-800">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Calling Interval (seconds)</label>
                  <input
                    type="number"
                    value={gameSettings.callingInterval}
                    onChange={(e) => setGameSettings({ ...gameSettings, callingInterval: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveSettings}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all w-full lg:w-auto"
              >
                💾 Save Settings
              </button>
            </div>
          )}

          {/* Dividends Tab */}
          {activeTab === "dividends" && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">💰 Prize Settings</h3>
              <div className="space-y-3 lg:space-y-4">
                {dividends.map((div, index) => (
                  <div key={index} className="flex items-center gap-3 lg:gap-4 bg-white/5 p-3 lg:p-4 rounded-xl hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={div.isActive}
                      onChange={(e) => {
                        const updated = [...dividends];
                        updated[index].isActive = e.target.checked;
                        setDividends(updated);
                      }}
                      className="w-5 h-5 accent-purple-600 flex-shrink-0"
                    />
                    <span className="text-white flex-1 font-medium text-sm lg:text-base">{div.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 hidden sm:inline">₹</span>
                      <input
                        type="number"
                        value={div.amount}
                        onChange={(e) => {
                          const updated = [...dividends];
                          updated[index].amount = parseInt(e.target.value) || 0;
                          setDividends(updated);
                        }}
                        placeholder="Amount"
                        className="w-20 lg:w-32 px-2 lg:px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSaveDividends}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all w-full lg:w-auto"
              >
                💾 Save Prize Settings
              </button>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">📢 Announcements</h3>
              <div className="flex flex-col lg:flex-row gap-3 mb-6">
                <input
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Enter announcement text..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateAnnouncement()}
                />
                <button
                  onClick={handleCreateAnnouncement}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  📤 Send
                </button>
              </div>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann._id} className="flex items-start lg:items-center justify-between gap-4 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all">
                    <div className="flex-1">
                      <p className="text-white text-sm lg:text-base">{ann.text}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(ann.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann._id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex-shrink-0"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No announcements yet</p>
                )}
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">📝 Book New Ticket</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="number"
                    value={bookingForm.ticketId}
                    onChange={(e) => setBookingForm({ ...bookingForm, ticketId: e.target.value })}
                    placeholder="Ticket ID"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  />
                  <input
                    type="text"
                    value={bookingForm.playerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, playerName: e.target.value })}
                    placeholder="Player Name"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  />
                  <input
                    type="tel"
                    value={bookingForm.playerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, playerPhone: e.target.value })}
                    placeholder="Phone Number"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
                  />
                  <button
                    onClick={handleBookTicket}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    📝 Book
                  </button>
                </div>
              </div>

              {/* Tickets List - Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {bookedTickets.map((ticket) => (
                  <div key={ticket.ticketId} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-white">#{ticket.ticketId}</span>
                      <button
                        onClick={() => handleCancelTicket(ticket.ticketId)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-white">{ticket.playerName}</p>
                    <p className="text-gray-400 text-sm">{ticket.playerPhone}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(ticket.bookedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tickets Table - Desktop */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">🎫 Booked Tickets ({bookedTickets.length})</h3>
                    <button
                      onClick={async () => {
                        if (window.confirm("Clear all booked tickets?")) {
                          await adminApi.clearAllTickets();
                          await loadDashboard();
                          toast.success("All tickets cleared!");
                        }
                      }}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-3 px-6 text-gray-400 font-medium">Ticket ID</th>
                        <th className="text-left py-3 px-6 text-gray-400 font-medium">Player Name</th>
                        <th className="text-left py-3 px-6 text-gray-400 font-medium">Phone</th>
                        <th className="text-left py-3 px-6 text-gray-400 font-medium">Booked At</th>
                        <th className="text-left py-3 px-6 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookedTickets.map((ticket) => (
                        <tr key={ticket.ticketId} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-3 px-6 text-white font-medium">{ticket.ticketId}</td>
                          <td className="py-3 px-6 text-white">{ticket.playerName}</td>
                          <td className="py-3 px-6 text-gray-300">{ticket.playerPhone}</td>
                          <td className="py-3 px-6 text-gray-400 text-sm">
                            {new Date(ticket.bookedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-6">
                            <button
                              onClick={() => handleCancelTicket(ticket.ticketId)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bookedTickets.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No tickets booked yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg lg:text-xl font-bold text-white">📝 System Logs</h3>
                <button
                  onClick={handleClearLogs}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  🗑️ Clear Logs
                </button>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4 bg-white/5 p-4 rounded-xl">
                    <div className="flex-shrink-0">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        log.action?.includes("DELETE") ? "bg-red-500/20 text-red-400" :
                        log.action?.includes("CREATE") ? "bg-green-500/20 text-green-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm lg:text-base">{log.details}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No system logs yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Join Game Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">🎮 Join Game</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ <strong>Note:</strong> You will be redirected to the join room page. 
                  Make sure you are logged in as a player/host to join the game.
                </p>
              </div>
              <p className="text-gray-400 mb-4">
                Enter the room code to join an active game.
              </p>
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value)}
                placeholder="Enter Room Code"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGame}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
