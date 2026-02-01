import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";

const UnAuthorizePage = () => {
  // for user context
  const { Player } = useContext(PlayerContext);
  const displayRole = Player?.role || "guest";

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4 sm:p-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 sm:p-12 text-center max-w-lg w-full border border-white/50 transition-all duration-500 hover:shadow-3xl">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
            <span className="text-5xl">🚫</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
            403 Forbidden
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            You are currently logged in as a{" "}
            <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {displayRole.toUpperCase()}
            </span>
            .
          </p>
          <p className="text-md text-gray-700 font-bold mt-2">
            This page requires <span className="text-purple-600">{displayRole === "host" ? "USER" : "HOST"}</span> role for access.
          </p>
          <p className="text-md text-gray-500 mt-2">
            To change your role, please navigate to the home page.
          </p>

          <div className="mt-8">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              🏠 Return to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnAuthorizePage;
