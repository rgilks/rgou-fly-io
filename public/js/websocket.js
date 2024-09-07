// 
export const setupWebSocket = (updateGameState) => {
  const wsUrl =
    location.hostname === "rgou.fly.dev"
      ? "wss://rgou.fly.dev/ws"
      : "ws://localhost:9223/ws";

  const socket = new WebSocket(wsUrl);

  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection established");
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
  });

  return socket;
};
