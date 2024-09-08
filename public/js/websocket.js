export const setupWebSocket = (updateGameState) => {
  return new Promise((resolve, reject) => {
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${location.host}/ws`;

    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", (event) => {
      console.log("WebSocket connection established");
      resolve(socket);
    });

    socket.addEventListener("message", (event) => {
      console.log("Message received:", event.data);
      const message = JSON.parse(event.data);

      if (message.type === "game_state") {
        updateGameState(message);
      } else {
        console.log("Received:", message);
      }
    });

    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      reject(error);
    });
  });
};
