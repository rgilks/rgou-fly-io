export const setupWebSocket = (updateGameState) => {
  return new Promise((resolve, reject) => {
    const wsProtocol = location.hostname === "localhost" ? "ws:" : "wss:";
    const wsUrl = `${wsProtocol}//${
      location.hostname === "localhost" ? "127.0.0.1:9223" : location.host
    }/ws`;

    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", (event) => {
      console.log("WebSocket connection established");
      resolve(socket);
    });

    socket.addEventListener("message", (event) => {
      console.log("Received:", event.data);
      if (event?.data.startsWith("{")) {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "game_state") {
            // Convert the state to BigInt before updating the game state
            if (message.state) {
              message.state = BigInt(message.state);
            }
            updateGameState(message);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    });

    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      reject(error);
    });

    // Implement ping mechanism
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 20000); // Send a ping every 20 seconds

    socket.addEventListener("close", () => {
      clearInterval(pingInterval);
    });
  });
};
