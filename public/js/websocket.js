export const setupWebSocket = (updateGameState) => {
  return new Promise((resolve, reject) => {
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${
      location.hostname === "127.0.0.1" ? "127.0.0.1:9223" : location.host
    }/ws`;

    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", (event) => {
      console.log("WebSocket connection established");
      resolve(socket);
    });

    socket.addEventListener("message", (event) => {
      console.log("Received:", event.data);
      if (event?.data.startsWith("{")) {
        const message = JSON.parse(event.data);
        if (message.type === "game_state") {
          updateGameState(message);
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
