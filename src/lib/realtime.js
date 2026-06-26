import { io } from "socket.io-client"
import { SOCKET_URL } from "@/lib/api"

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
  socket = io(SOCKET_URL, {
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
