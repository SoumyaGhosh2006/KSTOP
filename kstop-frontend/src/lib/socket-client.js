import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// Socket.IO connects to the backend root, not /api
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export function createChatSocket() {
  const token = localStorage.getItem("kstop_token");

  console.log("Socket URL:", SOCKET_URL);
  console.log("Token exists:", !!token);

  if (!token) {
    console.error("No kstop_token found.");
    return null;
  }

  const socket = io(SOCKET_URL, {
    auth: {
      token,
    },

    // Let Socket.IO use polling first and upgrade to WebSocket.
    // This is more reliable during local development.
    transports: ["polling", "websocket"],

    withCredentials: true,

    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  return socket;
}