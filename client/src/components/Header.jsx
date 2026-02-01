import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import { PlayerContext } from "../context/PlayerContext";
import authApi from "../utils/authApi.js";

import { toast } from "react-toastify";

const Header = () => {
  //for context
  const { Player, updatePlayer, logout } = useContext(PlayerContext);

  // for navigation
  const navigate = useNavigate();

  //loading
  const [loading, setLoading] = useState(false);

  // toggle menu state and handler
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // logout handler
  const logoutClick = async () => {
    try {
      setLoading(true);
      const res = await authApi.post("/logout", {
        sessionId: localStorage.getItem("sessionId"),
      });
      if (res.status === 200) {
        toast.success("Logged out successfully", {
          autoClose: 2000,
        });
        logout();
      } else {
        toast.error("Error logging out");
        navigate("/auth");
      }
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  // switching between host and user roles state and handler
  const [changeClick, setChangeClick] = useState(false);
  const changeClickHandler = () => {
    setChangeClick(!changeClick);
  };
  const handleRoleChange = async () => {
    let newRole;
    if (Player) {
      newRole = Player.role === "host" ? "user" : "host";
    }
    setLoading(true);
    const res = await authApi.post("/change-role", { role: newRole });
    if (res.status === 200) {
      toast.success(`Role changed to ${newRole}`);
      updatePlayer(res.data.user);
      toggleMenu();
    } else {
      console.error("Error changing role:", res.data.message);
      alert("Error changing role. Please try again.");
    }
    setLoading(false);
    changeClickHandler();
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <nav className="w-full py-3 flex justify-between items-center px-4 md:px-8 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 fixed shadow-lg z-50 border-b border-white/10">
            {/* Logo Section */}
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
                <span className="text-xl">🎯</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Tambola
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate("/")}
                className="text-gray-300 hover:text-white font-medium transition-colors duration-300"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-gray-300 hover:text-white font-medium transition-colors duration-300"
              >
                About
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="text-gray-300 hover:text-white font-medium transition-colors duration-300"
              >
                Contact
              </button>
              <button
                onClick={() => navigate("/users-dashboard")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={toggleMenu}
                className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-full shadow hover:bg-white/20 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => navigate("/users-dashboard")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={toggleMenu}
                className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-full shadow hover:bg-white/20 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>
          {isMenuOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
              <div
                className={`bg-gradient-to-b from-slate-800 to-slate-900 relative w-80 h-full shadow-2xl p-6 ${
                  window.innerHeight < 350 ? "overflow-y-auto" : ""
                } border-l border-white/10`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">🎯</span>
                    </div>
                    <span className="text-xl font-bold text-white">Menu</span>
                  </div>
                  <button 
                    onClick={toggleMenu}
                    className="bg-red-500/20 text-red-400 p-2 rounded-full hover:bg-red-500/30 transition duration-300"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.293 4.293a1 1 0 011.414 0L10 10.586l5.293-5.293a1 1 0 111.414 1.414L11.414 12l5.293 5.293a1 1 0 01-1.414 1.414L10 13.414 4.707 18.707a1 1 0 01-1.414-1.414L8.586 12 3.293 6.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* User Profile Card */}
                {Player?.id && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {Player?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{Player?.name || "User"}</h3>
                        <p className="text-gray-400 text-sm">{Player?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        Player?.role === "host" 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        {Player?.role === "host" ? "🎤 Host" : "🎮 Player"}
                      </span>
                      <button
                        onClick={changeClickHandler}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                      >
                        Switch Role →
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2 mb-6">
                  <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-3">Navigation</p>
                  
                  <button
                    onClick={() => { navigate("/"); toggleMenu(); }}
                    className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span className="text-xl">🏠</span>
                    <span>Home</span>
                  </button>
                  
                  <button
                    onClick={() => { navigate("/users-dashboard"); toggleMenu(); }}
                    className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span className="text-xl">📊</span>
                    <span>Dashboard</span>
                  </button>
                  
                  <button
                    onClick={() => { navigate("/user"); toggleMenu(); }}
                    className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span className="text-xl">🎮</span>
                    <span>Join Room</span>
                  </button>
                  
                  {Player?.role === "host" && (
                    <button
                      onClick={() => { navigate("/dashboard"); toggleMenu(); }}
                      className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-300"
                    >
                      <span className="text-xl">➕</span>
                      <span>Host a Game</span>
                    </button>
                  )}
                </div>

                {/* Info Links */}
                <div className="space-y-2 mb-6">
                  <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-3">Information</p>
                  
                  <button
                    onClick={() => { navigate("/about"); toggleMenu(); }}
                    className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span className="text-xl">ℹ️</span>
                    <span>About Us</span>
                  </button>
                  
                  <button
                    onClick={() => { navigate("/contact"); toggleMenu(); }}
                    className="w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <span className="text-xl">📬</span>
                    <span>Contact Us</span>
                  </button>
                </div>

                {/* Logout Button */}
                {Player && (
                  <button
                    onClick={logoutClick}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-3 rounded-xl transition-all duration-300 font-medium border border-red-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
          {changeClick && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-white/10">
                {/* Close Button */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Switch Role</h3>
                  <button
                    onClick={changeClickHandler}
                    className="bg-red-500/20 text-red-400 p-2 rounded-full hover:bg-red-500/30 transition duration-300"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.293 4.293a1 1 0 011.414 0L10 10.586l5.293-5.293a1 1 0 111.414 1.414L11.414 12l5.293 5.293a1 1 0 01-1.414 1.414L10 13.414 4.707 18.707a1 1 0 01-1.414-1.414L8.586 12 3.293 6.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Role Switch Content */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className={`p-4 rounded-xl ${Player?.role === "host" ? "bg-red-500/20 border-2 border-red-500" : "bg-white/5"}`}>
                      <span className="text-3xl">🎤</span>
                      <p className="text-gray-300 text-sm mt-1">Host</p>
                    </div>
                    <span className="text-gray-500 text-2xl">→</span>
                    <div className={`p-4 rounded-xl ${Player?.role === "user" ? "bg-blue-500/20 border-2 border-blue-500" : "bg-white/5"}`}>
                      <span className="text-3xl">🎮</span>
                      <p className="text-gray-300 text-sm mt-1">Player</p>
                    </div>
                  </div>
                  <p className="text-gray-400">
                    Switch from{" "}
                    <span className="font-semibold text-white">{Player?.role === "host" ? "Host" : "Player"}</span>
                    {" "}to{" "}
                    <span className="font-semibold text-white">{Player?.role === "host" ? "Player" : "Host"}</span>?
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={changeClickHandler}
                    className="flex-1 bg-white/10 text-gray-300 px-4 py-3 rounded-xl hover:bg-white/20 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRoleChange}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Header;
