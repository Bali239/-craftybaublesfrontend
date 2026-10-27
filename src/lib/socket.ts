"use client";

import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";
import { readSession } from "./session";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket?.connected) return socket;
  const session = readSession();
  if (!session?.token) return null;
  socket = io(API_URL, {
    auth: { token: session.token },
    transports: ["websocket"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
