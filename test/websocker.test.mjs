import { expect, test, describe, mock, beforeEach } from "bun:test";
import { setupWebSocket } from "../public/js/websocket.mjs";

describe("setupWebSocket", () => {
  let mockWebSocket;
  let mockUpdateGameState;

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      addEventListener: mock((event, callback) => {
        if (event === 'open') setTimeout(callback, 0);
      }),
      send: mock(),
      readyState: WebSocket.OPEN,
    };

    global.WebSocket = mock(() => mockWebSocket);

    // Mock location
    global.location = {
      protocol: "http:",
      hostname: "example.com",
      host: "example.com",
    };

    // Mock console methods
    global.console.log = mock();
    global.console.error = mock();

    // Mock updateGameState
    mockUpdateGameState = mock();
  });

  test("establishes WebSocket connection", async () => {
    const socket = await setupWebSocket(mockUpdateGameState);
    expect(socket).toBe(mockWebSocket);
    expect(global.WebSocket).toHaveBeenCalledWith("ws://example.com/ws");
  });

  test("resolves with socket on open event", async () => {
    const socketPromise = setupWebSocket(mockUpdateGameState);
    const socket = await socketPromise;
    expect(socket).toBe(mockWebSocket);
  });

  test("handles incoming messages", async () => {
    await setupWebSocket(mockUpdateGameState);
    const messageCallback = mockWebSocket.addEventListener.mock.calls.find(call => call[0] === 'message')[1];
    
    const gameStateMessage = { type: "game_state", data: "test" };
    messageCallback({ data: JSON.stringify(gameStateMessage) });
    
    expect(mockUpdateGameState).toHaveBeenCalledWith(gameStateMessage);
  });

  test("logs WebSocket close event", async () => {
    await setupWebSocket(mockUpdateGameState);
    const closeCallback = mockWebSocket.addEventListener.mock.calls.find(call => call[0] === 'close')[1];
    
    closeCallback({ reason: "test close" });
    expect(console.log).toHaveBeenCalledWith("WebSocket connection closed:", { reason: "test close" });
  });

  test("rejects on WebSocket error", async () => {
    const errorPromise = setupWebSocket(mockUpdateGameState);
    const errorCallback = mockWebSocket.addEventListener.mock.calls.find(call => call[0] === 'error')[1];
    
    const testError = new Error("test error");
    errorCallback(testError);

    await expect(errorPromise).rejects.toThrow("test error");
  });

  test("implements ping mechanism", async () => {
    const { mock } = await import("bun:test");
    const realSetInterval = global.setInterval;
    const mockSetInterval = mock((callback) => {
      callback();
      return 123;
    });
    global.setInterval = mockSetInterval;

    await setupWebSocket(mockUpdateGameState);

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: "ping" }));

    global.setInterval = realSetInterval;
  });
});
