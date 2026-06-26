import { io } from "socket.io-client"
import { API_ORIGIN } from "@/lib/api"

let socket = null
let activeToken = ""

export const getRealtimeSocket = (token) => {
  if (!token) return null

  if (socket && activeToken === token) {
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  activeToken = token
  socket = io(API_ORIGIN, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  })

  return socket
}

export const disconnectRealtime = () => {
  if (socket) socket.disconnect()
  socket = null
  activeToken = ""
}
