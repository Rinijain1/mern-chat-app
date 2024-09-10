import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthContext();

	useEffect(() => {
		if (authUser) {
			// Create socket connection when user is authenticated
			const socket = io("http://localhost:5000", {
				query: {
					userId: authUser._id,
				},
				reconnection: true,  // Enable reconnection by default
				reconnectionAttempts: 5,  // Retry connection 5 times before giving up
				reconnectionDelay: 1000,  // Time between reconnection attempts (1 second)
			});

			// Set the socket instance in state
			setSocket(socket);

			// Listen for online users update
			socket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			// Handle connection errors
			socket.on("connect_error", (error) => {
				console.error("Socket connection error:", error.message);
			});

			// Optionally, handle reconnection attempts and successes
			socket.on("reconnect_attempt", () => {
				console.log("Attempting to reconnect...");
			});

			socket.on("reconnect", (attemptNumber) => {
				console.log(`Reconnected after ${attemptNumber} attempts`);
			});

			// Clean up the socket connection when the component unmounts
			return () => {
				socket.close();
				setSocket(null);
			};
		} else {
			// If the user is not authenticated, close the socket connection
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
	}, [authUser]);

	return (
		<SocketContext.Provider value={{ socket, onlineUsers }}>
			{children}
		</SocketContext.Provider>
	);
};
