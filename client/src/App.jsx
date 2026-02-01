import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// import centralized socket connection
import socket from "./utils/websocket.js";

//import components
import Header from "./components/Header.jsx";
import Loading from "./components/Loading.jsx";

//import context
import { PlayerContext } from "./context/PlayerContext.jsx";

import authApi from "./utils/authApi.js";
import { toast } from "react-toastify";

//import env
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const App = () => {
  //context state
  const {
    Player,
    updatePlayer,
    loading,
    setLoading,
    getAccessToken,
  } = useContext(PlayerContext);


  // for navigation
  const navigate = useNavigate();

  // handle click events
  const handleHostClick = () => {
    navigate("/host");
  };
  const handleJoinClick = () => {
    navigate("/user");
  };

  // socket event handling
  useEffect(() => {
    socket.on("error", (error) => {
      console.error("Socket error:", error);
      setLoading(false);
    });

    return () => {
      socket.off("error");
    };
  }, [setLoading]);

  // invitation or norification state
  const [invites, setInvites] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const handleNotificationCloseClick = () => {
    setShowNotifications(false);
  };
  const handleNotificationClick = async () => {
    setLoading(true);
    const res = await authApi.get("/get-invites");
    setLoading(false);
    if (res.status === 200) {
      setInvites(res.data?.invites);
    } else if (res.status === 401) {
      navigate("/auth");
    } else {
      console.log("Error fetching invites:", res.data?.message);
    }
    // setShowNotifications(true);
  };
  useEffect(() => {
    // handleNotificationClick();
    RoleWindowClickHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //change role state (popup for role change)
  const [showRoleWindow, setShowRoleWindow] = useState(false);
  const RoleWindowClickHandler = () => {
    setShowRoleWindow(!showRoleWindow);
  };
  const handleRoleChange = async (role) => {
    setLoading(true);
    const res = await authApi.post("/change-role", { role });
    if(res.status === 200) {
      updatePlayer(res.data.user);
      toast.success(`Role changed to ${role}`);
    }else{
      console.error("Error changing role:", res.data.message);
      toast.error("Error changing role. Please try again.");
    }
    setLoading(false);
    RoleWindowClickHandler();
  };

  //reconnection state
  const [showReconnect, setShowReconnect] = useState(false);
  const handleReconnectionCloseClick = () => {
    setShowReconnect(false);
  };
  const handleReconnectClick = async () => {
    handleNotificationClick();
  };

  //handle room join click
  const handleRoomJoinClick = (room) => {
    navigate(`/${Player?.role}/${room}`);
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Header />
          <div className="w-full pt-10 h-screen flex flex-col gap-4 items-start justify-center bg-gradient-to-tr from-rose-300 via-blue-200 to-purple-300 p-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-black mb-6">
              Welcome,{" "}
              {Player?.phone ? (
                <span className="font-bold">{Player?.name}</span>
              ) : (
                <span className="font-bold">Guest</span>
              )}{" "}
              👋
            </h1>

            {/* Buttons Container */}
            <div className="flex flex-wrap gap-6">
              {Player?.role == "user" || Player?.role == "host" ? (
                <>
                  {Player?.role == "host" && (
                    <button
                      className="bg-green-500 text-white w-44 py-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300"
                      onClick={handleHostClick}
                    >
                      🎮 Host a Game
                    </button>
                  )}
                  {Player?.role == "user" && (
                    <button
                      className="bg-yellow-500 text-white w-44 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
                      onClick={handleJoinClick}
                    >
                      🔗 Join a Game
                    </button>
                  )}
                  {Player?.role === "user" && (
                    <button
                      className="hidden relative bg-red-400 text-white w-44 py-3 rounded-lg shadow-md hover:bg-red-500 transition duration-300"
                      onClick={() => {
                        setShowNotifications(true);
                        handleNotificationClick();
                      }}
                    >
                      <span
                        className={`absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold ${
                          invites?.length > 0 ? "block" : "hidden"
                        }`}
                      >
                        {invites?.length > 0 ? invites.length : ""}
                      </span>
                      📩 Invitations
                    </button>
                  )}

                  {
                    <button
                      className="bg-blue-500 text-white w-44 py-3 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
                      onClick={() => {
                        setShowReconnect(true);
                        handleReconnectClick();
                      }}
                    >
                      🔄 Reconnect
                    </button>
                  }
                  {Player?.role === "host" && (
                    <button
                      className="bg-red-400 text-white w-44 py-3 rounded-lg shadow-md hover:bg-red-500 transition duration-300"
                      onClick={() => {
                        navigate("/dashboard");
                      }}
                    >
                      🏢 Dashboard
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="bg-green-500 text-white w-44 py-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300"
                    onClick={() => {
                      navigate("/auth");
                    }}
                  >
                    📝 Register / Login
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications Modal */}
          {showNotifications && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white px-2  rounded-lg shadow-lg relative w-[320px] max-h-[450px] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-black fixed w-[290px] py-4 bg-white">
                  <h2 className="text-2xl font-bold">📩 Invitations</h2>
                  <button
                    className="text-white text-2xl bg-red-500 rounded-full flex justify-center items-start px-2 hover:bg-red-700 transition"
                    onClick={handleNotificationCloseClick}
                  >
                    <span className="flex justify-start items-start">
                      &times;
                    </span>
                  </button>
                </div>
                <div className="pt-16">
                  {invites?.length > 0 ? (
                    <div className="space-y-3">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm"
                        >
                          <div className="mb-2">
                            <p className="text-base font-medium text-gray-800 break-words">
                              Room ID: {invite.id}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {invite?.schedule
                                ? `Scheduled: ${invite.schedule}`
                                : "Not scheduled"}
                            </p>
                          </div>
                          <div className="flex justify-between gap-2">
                            <button
                              onClick={() => handleRoomJoinClick(invite.id)}
                              className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-md hover:bg-green-600 transition"
                            >
                              ✅ Join
                            </button>
                            <button
                              onClick={async () => {
                                const accessToken = getAccessToken();
                                if (!accessToken) {
                                  console.error("Access token not found");
                                  return;
                                }
                                try {
                                  setLoading(true);
                                  console.log("Deleting invite:", accessToken);
                                  const res = await fetch(
                                    `${apiBaseUrl}/api/game/invite/${invite.id}`, // fixed route
                                    {
                                      method: "DELETE",
                                      credentials: "include",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${accessToken}`,
                                      },
                                    }
                                  );
                                  setTimeout(() => {
                                    setLoading(false);
                                  }, 2000);
                                  const data = await res.json();
                                  if (res.status === 200) {
                                    setInvites(data?.invites);
                                  } else {
                                    console.error(
                                      "Error deleting invite:",
                                      data
                                    );
                                  }
                                } catch (error) {
                                  setLoading(false);
                                  console.error("Error:", error);
                                }
                              }}
                              className="flex-1 bg-gray-100 text-gray-600 text-sm py-1.5 rounded-md hover:bg-gray-200 transition"
                            >
                              ❌ Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4 text-lg">
                      No invitations available 😕
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Reconnection Modal */}
          {showReconnect && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white px-2  rounded-lg shadow-lg relative w-[320px] max-h-[450px] overflow-y-auto">
                <div className="flex justify-between items-center border-b-2 border-black fixed w-[290px] py-4 bg-white">
                  <h2 className="text-2xl font-bold">🔄 Reconnect</h2>
                  <button
                    className="text-white text-2xl bg-red-500 rounded-full flex justify-center items-start px-2 hover:bg-red-700 transition"
                    onClick={handleReconnectionCloseClick}
                  >
                    <span className="flex justify-start items-start">
                      &times;
                    </span>
                  </button>
                </div>
                <div className="pt-16">
                  {invites?.length > 0 ? (
                    <div className="space-y-3">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-3 rounded-lg border border-gray-200 bg-white shadow-sm"
                        >
                          <div className="mb-2">
                            <p className="text-base font-medium text-gray-800 break-words">
                              Room ID: {invite.id}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {invite?.schedule
                                ? `Scheduled: ${invite.schedule}`
                                : "Not scheduled"}
                            </p>
                          </div>
                          <div className="flex justify-between gap-2">
                            <button
                              onClick={() => {
                                navigate(`/reconnect/${invite.id}`);
                              }}
                              className="flex-1 bg-green-500 text-white text-sm py-1.5 rounded-md hover:bg-green-600 transition"
                            >
                              ✅ Join
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const accessToken = getAccessToken();
                                  if (!accessToken) {
                                    console.error("Access token not found");
                                    return;
                                  }
                                  setLoading(true);
                                  const res = await fetch(
                                    `${apiBaseUrl}/api/game/invite/${invite.id}`, // fixed route
                                    {
                                      method: "DELETE",
                                      credentials: "include",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${accessToken}`,
                                      },
                                    }
                                  );
                                  setTimeout(() => {
                                    setLoading(false);
                                  }, 2000);
                                  const data = await res.json();
                                  if (res.status === 200) {
                                    setInvites(data?.invites);
                                  } else {
                                    console.error(
                                      "Error deleting invite:",
                                      data
                                    );
                                  }
                                } catch (error) {
                                  setLoading(false);
                                  console.error("Error:", error);
                                }
                              }}
                              className="flex-1 bg-gray-100 text-gray-600 text-sm py-1.5 rounded-md hover:bg-gray-200 transition"
                            >
                              ❌ Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4 text-lg">
                      No Rooms available 😕
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Role Change Modal */}
          {showRoleWindow && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-sm max-h-[90vh] overflow-y-auto relative">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    🤔 Choose your role
                  </h2>
                  <button
                    onClick={RoleWindowClickHandler}
                    className="text-gray-700 hover:text-red-600 transition"
                    aria-label="Close"
                  >
                    <span className="text-4xl rounded-full leading-none">
                      &times;
                    </span>
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6">
                  <button
                    onClick={() => handleRoleChange("host")}
                    className="w-full py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Host
                  </button>
                  <button
                    onClick={() => handleRoleChange("user")}
                    className="w-full py-3 text-lg font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700 transition"
                  >
                    Player
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

export default App;
