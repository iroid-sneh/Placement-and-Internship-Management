import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";
let socket: Socket | null = null;
let socketToken = "";

export function getChatSocket(token: string): Socket {
  if (!socket) {
    socketToken = token;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true
    });
  } else if (socketToken !== token) {
    socket.disconnect();
    socketToken = token;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketToken = "";
}
