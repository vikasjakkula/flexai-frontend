import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { io } from 'socket.io-client';

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// --- Socket.io Client Utility ---
let socket;
export const getSocket = () => {
  if (!socket) {
    socket = io('http://localhost:5000'); // Update if backend runs elsewhere
  }
  return socket;
};