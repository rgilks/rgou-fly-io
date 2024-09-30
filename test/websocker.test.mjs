import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { setupWebSocket } from "../public/js/websocket.mjs";

describe("setupWebSocket", () => {
  let mockWebSocket;
  let mockUpdateGameState;
  let realSetInterval;
  let realClearInterval;
  let realConsoleLog;
  let realConsoleError;
  let intervalCallbacks;

  beforeEach(() => {
    mockWebSocket = {
      addEventListener: mock((event, callback) => {
        if (event === "open") setTimeout(callback, 0);
      }),
      send: mock(),
      readyState: WebSocket.OPEN,
    };

    global.WebSocket = mock(() => mockWebSocket);

    global.location = {
      protocol: "http:",
      hostname: "example.com",
      host: "example.com",
    };

    realConsoleLog = console.log;
    realConsoleError = console.error;
    global.console.log = mock();
    global.console.error = mock();

    mockUpdateGameState = mock();

    realSetInterval = global.setInterval;
    realClearInterval = global.clearInterval;
    intervalCallbacks = [];

    global.setInterval = mock((callback, interval) => {
      const id = intervalCallbacks.length + 1;
      intervalCallbacks.push({ callback, interval, id });
      return id;
    });

    global.clearInterval = mock((id) => {
      intervalCallbacks = intervalCallbacks.filter((cb) => cb.id !== id);
    });
  });

  afterEach(() => {
    global.setInterval = realSetInterval;
    global.clearInterval = realClearInterval;
    global.console.log = realConsoleLog;
    global.console.error = realConsoleError;
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
    const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call) => call[0] === "message"
    )[1];

    const gameStateMessage = { type: "game_state", data: "test" };
    messageCallback({ data: JSON.stringify(gameStateMessage) });

    expect(mockUpdateGameState).toHaveBeenCalledWith(gameStateMessage);
  });

  test("logs WebSocket close event", async () => {
    await setupWebSocket(mockUpdateGameState);
    const closeCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call) => call[0] === "close"
    )[1];

    closeCallback({ reason: "test close" });
    expect(console.log).toHaveBeenCalledWith("WebSocket connection closed:", {
      reason: "test close",
    });
  });

  test("rejects on WebSocket error", async () => {
    const errorPromise = setupWebSocket(mockUpdateGameState);
    const errorCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call) => call[0] === "error"
    )[1];

    const testError = new Error("test error");
    errorCallback(testError);

    await expect(errorPromise).rejects.toThrow("test error");
  });

  test("implements ping mechanism", async () => {
    await setupWebSocket(mockUpdateGameState);

    expect(global.setInterval).toHaveBeenCalledWith(
      expect.any(Function),
      20000
    );

    const pingCallback = intervalCallbacks[0].callback;
    pingCallback();

    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "ping" })
    );

    mockWebSocket.readyState = WebSocket.CLOSED;
    pingCallback();

    expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
  });

  test("clears ping interval on WebSocket close", async () => {
    await setupWebSocket(mockUpdateGameState);

    const closeCallback = mockWebSocket.addEventListener.mock.calls.find(
      (call) => call[0] === "close"
    )[1];
    closeCallback();

    expect(intervalCallbacks.length).toBe(1);
  });
});
