import { useState, useContext } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Loading from "./Loading.jsx";
import authApi from "../utils/authApi.js";

//toastify
import { toast } from "react-toastify";

//context
import { PlayerContext } from "../context/PlayerContext.jsx";

const Authentication = () => {
  // for context
  const { updatePlayer } = useContext(PlayerContext);

  // for navigation
  const navigate = useNavigate();

  // for form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // switch to register components
  const [switchToRegister, setSwitchToRegister] = useState(false);

  // url path
  const location = useLocation();
  const path = location.pathname;

  // form submission handlers
  const loginUser = async (e) => {
    e.preventDefault();
    // validate user input
    if (!phone || !password) {
      toast.warning("Please fill all the fields", {
        autoClose: 2000,
      });
      return;
    } else if (!/^\d{10}$/.test(phone)) {
      toast.warning("Please enter a valid 10-digit phone number", {
        autoClose: 2000,
      });
      return;
    } else if (password.length < 6 || password.length > 20) {
      toast.warning("Password should be between 6 and 20 characters long", {
        autoClose: 2000,
      });
      return;
    }
    setLoading(true);

    try {
      const res = await authApi.post("/login", { phone, password });

      toast.success("Successfully logged in");
      localStorage.setItem("sessionId", res.data.sessionId);
      localStorage.setItem("userid", res.data.user.id);
      updatePlayer({
        id: res.data.user.id,
        name: res.data.user.name,
        phone: res.data.user.phone,
        role: res.data.user.role,
      });
      // setAccessToken(res.data.accessToken);
      if (path === "/auth") {
        navigate("/users-dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.status === 400) {
        toast.error(err.message || "Invalid credentials");
      } else if (err.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }

    setLoading(false);
  };
  const registerUser = async (e) => {
    e.preventDefault();
    // validate user input
    if (!name || !phone || !password) {
      toast.warning("Please fill all the fields", {
        autoClose: 2000,
      });
      return;
    } else if (!/^\d{10}$/.test(phone)) {
      toast.warning("Please enter a valid 10-digit phone number", {
        autoClose: 2000,
      });
      return;
    } else if (password.length < 6) {
      toast.warning("Password should be at least 6 characters long", {
        autoClose: 2000,
      });
      return;
    } else if (
      name.length < 3 ||
      name.length > 20 ||
      !/^[a-zA-Z ]+$/.test(name)
    ) {
      toast.warning("Name: 3-20 characters, no special chars or numbers.", {
        autoClose: 2000,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.post("/register", { name, phone, password });

      toast.success("Successfully registered");
      localStorage.setItem("sessionId", res.data.sessionId);
      localStorage.setItem("userid", res.data.user.id);

      updatePlayer({
        id: res.data.user.id,
        name: res.data.user.name,
        phone: res.data.user.phone,
        role: res.data.user.role,
      });
      if (path === "/auth") {
        navigate("/users-dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err.status === 400) {
        toast.error(err.message || "Invalid data");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }

    setLoading(false);
  };

  // password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
      passwordInput.type = showPassword ? "password" : "text";
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : switchToRegister ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4">
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
            <div className="text-center mb-6">
              <span className="text-5xl mb-3 block">🎯</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Create Account</h1>
              <p className="text-gray-500 mt-2">Join the Tambola fun!</p>
            </div>
            <form className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50/50"
                  type="text"
                  required
                  name="name"
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50/50"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  name="phone"
                  id="phone"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all duration-300">
                  <input
                    className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none"
                    type="password"
                    required
                    name="password"
                    id="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="px-4 py-3 text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                onClick={registerUser}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Create Account 🚀
              </button>
              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setSwitchToRegister(false)}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4">
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
            <div className="text-center mb-6">
              <span className="text-5xl mb-3 block">🎯</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Welcome Back!</h1>
              <p className="text-gray-500 mt-2">Login to continue playing</p>
            </div>
            <form className="space-y-5">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50/50"
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all duration-300">
                  <input
                    className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none"
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="px-4 py-3 text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                onClick={loginUser}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Login 🎮
              </button>

              <div className="text-center">
                <p className="text-gray-600">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setSwitchToRegister(true)}
                    className="text-purple-600 font-semibold hover:underline"
                  >
                    Register
                  </button>
                </p>
              </div>

              {/* Admin Login Link */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors text-sm"
                >
                  <span>👑</span>
                  <span>Admin Login</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Authentication;
