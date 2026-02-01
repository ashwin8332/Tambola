import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

//import components
import Authentication from "./components/Authentication.jsx";

//imported host, user, and game pages
import Hostroom from "./pages/Hostroom.jsx";
import Userroom from "./pages/Userroom.jsx";
import Userpage from "./pages/Userpage.jsx";
import Hostpage from "./pages/Hostpage.jsx";
import ReconnectPage from "./pages/ReconnectPage.jsx";
import Game from "./pages/Game.jsx";
import GameOver from "./pages/GameOver.jsx";

//imported extra pages
import Dashboard from "./pages/Dashboard.jsx";
import UsersDashboard from "./pages/UsersDashboard.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import Landing from "./pages/Landing.jsx";

// Admin pages
import AdminPanel from "./pages/AdminPanel.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

//imported context
import { PlayerProvider } from "./context/PlayerContext.jsx";
import { GameContextProvider } from "./context/GameContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UnAuthorizePage from "./pages/UnAuthorizePage.jsx";

//tostify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bounce } from "react-toastify";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/users-dashboard",
    element: (
      <ProtectedRoute allowedRoles={["user", "host"]}>
        <UsersDashboard />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute allowedRoles={["user", "host"]}>
        <UsersDashboard />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/auth",
    element: <Authentication />,
  },
  // Admin routes
  {
    path: "/admin",
    element: <AdminPanel />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["host"]}>
        <Dashboard />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ":id",
        element: (
          <ProtectedRoute allowedRoles={["host"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/reconnect/:roomid",
    element: <ReconnectPage />,
  },
  {
    path: "unauthorized",
    element: <UnAuthorizePage />,
  },
  {
    path: "/user",
    element: (
      // <ProtectedRoute allowedRoles={["user"]}>
      <Userpage />
      // </ProtectedRoute>
    ),
    children: [
      {
        path: "room/:roomid",
        element: (
          <ProtectedRoute allowedRoles={["user", "host"]}>
            <Userroom />
          </ProtectedRoute>
        ),
      },
      //this /user/:roomid is when user is invited to join a room by host to extract roomid from url
      {
        path: ":publicId",
        element: (
          // <ProtectedRoute allowedRoles={["user"]}>
          <Userpage />
          // </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/host",
    element: (
      <ProtectedRoute allowedRoles={["host"]}>
        <Hostpage />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "room/:roomid",
        element: (
          <ProtectedRoute allowedRoles={["host", "user"]}>
            <Hostroom />
          </ProtectedRoute>
        ),
      },
      {
        // Redirect /host/:roomid to /host/room/:roomid for direct URL access
        path: ":roomid",
        element: (
          <ProtectedRoute allowedRoles={["host"]}>
            <Hostroom />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/game",
    element: <Game />,
    children: [
      {
        path: "gameover",
        element: <GameOver />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PlayerProvider>
      <GameContextProvider>
        <AdminProvider>
          <RouterProvider router={router}></RouterProvider>
        </AdminProvider>
      </GameContextProvider>
    </PlayerProvider>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      limit={5}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      transition={Bounce}
      className="app-toast-container"
    />
  </StrictMode>
);
