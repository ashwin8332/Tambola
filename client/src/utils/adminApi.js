const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class AdminApi {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/admin`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    };

    // Add authorization header if we have a session
    const adminSessionId = localStorage.getItem("adminSessionId");
    if (adminSessionId) {
      config.headers["X-Admin-Session"] = adminSessionId;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, message: data.message || "Request failed" };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || "Network error" };
    }
  }

  // Auth
  async checkExists() {
    return this.request("/exists");
  }

  async login(data) {
    const result = await this.request("/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (result.sessionId) {
      localStorage.setItem("adminSessionId", result.sessionId);
    }
    return result;
  }

  async logout() {
    const sessionId = localStorage.getItem("adminSessionId");
    const result = await this.request("/logout", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
    localStorage.removeItem("adminSessionId");
    return result;
  }

  async getMe() {
    return this.request("/me");
  }

  // Dashboard
  async getDashboard() {
    return this.request("/dashboard");
  }

  // Game Settings
  async updateGameSettings(settings) {
    return this.request("/settings/game", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async updateDividends(dividends) {
    return this.request("/settings/dividends", {
      method: "PUT",
      body: JSON.stringify({ dividends }),
    });
  }

  // Announcements
  async createAnnouncement(data) {
    return this.request("/announcement", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id) {
    return this.request(`/announcement/${id}`, {
      method: "DELETE",
    });
  }

  // Tickets
  async getBookedTickets() {
    return this.request("/tickets");
  }

  async bookTicket(data) {
    return this.request("/ticket/book", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelTicket(ticketId) {
    return this.request(`/ticket/${ticketId}`, {
      method: "DELETE",
    });
  }

  // Game Control
  async shuffleTickets() {
    return this.request("/game/shuffle", {
      method: "POST",
    });
  }

  async startGame(roomId) {
    return this.request("/game/start", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    });
  }

  async resetGame() {
    return this.request("/game/reset", {
      method: "POST",
    });
  }

  // Theme
  async updateTheme(theme) {
    return this.request("/theme", {
      method: "PUT",
      body: JSON.stringify(theme),
    });
  }

  // Admin Info
  async updateInfo(info) {
    return this.request("/info", {
      method: "PUT",
      body: JSON.stringify(info),
    });
  }

  // ============ USER MANAGEMENT ============
  async getAllUsers() {
    return this.request("/users");
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  async changeUserRole(userId, role) {
    return this.request(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  // ============ ROOM MANAGEMENT ============
  async getAllRooms() {
    return this.request("/rooms");
  }

  async getRoomDetails(roomId) {
    return this.request(`/rooms/${roomId}`);
  }

  async deleteRoom(roomId) {
    return this.request(`/rooms/${roomId}`, {
      method: "DELETE",
    });
  }

  async forceEndRoom(roomId) {
    return this.request(`/rooms/${roomId}/end`, {
      method: "POST",
    });
  }

  // ============ SYSTEM LOGS ============
  async getSystemLogs() {
    return this.request("/logs");
  }

  async addSystemLog(action, details) {
    return this.request("/logs", {
      method: "POST",
      body: JSON.stringify({ action, details }),
    });
  }

  async clearSystemLogs() {
    return this.request("/logs", {
      method: "DELETE",
    });
  }

  // ============ STATISTICS ============
  async getStats() {
    return this.request("/stats");
  }

  // ============ BULK OPERATIONS ============
  async clearAllRooms(onlyCompleted = false) {
    return this.request("/bulk/clear-rooms", {
      method: "POST",
      body: JSON.stringify({ onlyCompleted }),
    });
  }

  async clearAllTickets() {
    return this.request("/bulk/clear-tickets", {
      method: "POST",
    });
  }

  async exportTickets() {
    return this.request("/export/tickets");
  }
}

const adminApi = new AdminApi();
export default adminApi;
