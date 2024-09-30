// File: ./test/main.test.mjs

import { expect, test, describe, mock, beforeEach, spyOn } from "bun:test";
import * as mainModule from "../public/js/main.mjs";
import * as gameModule from "../public/js/game.mjs";
import * as boardModule from "../public/js/board.mjs";
import * as piecesModule from "../public/js/pieces.mjs";
import * as websocketModule from "../public/js/websocket.mjs";
import * as utilsModule from "../public/js/utils.mjs";

describe("main.mjs", () => {
  let mockCanvas,
    mockEngine,
    mockGameInfoDiv,
    mockDiceRollDiv,
    mockRestartButton,
    mockLocalStorage;
  let mockScene, mockSocket, mockBABYLON;
  let messageEventListener;
  let initGameSpy;

  beforeEach(() => {
    // Reset mocks and spies
    if (mockSocket && mockSocket.send) {
      mockSocket.send.mockReset();
    }
    if (gameModule.initGame && gameModule.initGame.mockReset) {
      gameModule.initGame.mockReset();
    }
    if (piecesModule.positionPieces && piecesModule.positionPieces.mockReset) {
      piecesModule.positionPieces.mockReset();
    }
    if (utilsModule.printStateBinary && utilsModule.printStateBinary.mockReset) {
      utilsModule.printStateBinary.mockReset();
    }
    if (piecesModule.highlightValidMoves && piecesModule.highlightValidMoves.mockReset) {
      piecesModule.highlightValidMoves.mockReset();
    }
    if (piecesModule.clearHighlights && piecesModule.clearHighlights.mockReset) {
      piecesModule.clearHighlights.mockReset();
    }
    if (gameModule.rollDice && gameModule.rollDice.mockReset) {
      gameModule.rollDice.mockReset();
    }
    if (console.error && console.error.mockReset) {
      console.error.mockReset();
    }

    // Mocks for DOM elements
    mockCanvas = {};
    mockGameInfoDiv = { textContent: "" };
    mockDiceRollDiv = { textContent: "" };
    mockRestartButton = {
      addEventListener: mock(),
    };

    // Mock localStorage
    let storage = {};
    mockLocalStorage = {
      setItem: (key, value) => {
        storage[key] = value;
      },
      getItem: (key) => storage[key],
      removeItem: (key) => {
        delete storage[key];
      },
    };

    // Mock BABYLON
    mockBABYLON = {
      Vector3: function (x, y, z) {
        return { x, y, z };
      },
    };

    global.BABYLON = mockBABYLON;

    // Mock engine
    mockEngine = {
      runRenderLoop: mock(),
    };

    // Mock scene
    mockScene = {
      activeCamera: {
        alpha: 0,
        beta: 0,
        radius: 0,
        target: { x: 0, y: 0, z: 0 },
      },
      render: mock(),
    };

    // Mock createScene to return mockScene
    spyOn(boardModule, "createScene").mockReturnValue(mockScene);

    // Mock createPieces
    spyOn(piecesModule, "createPieces").mockReturnValue();

    // Mock loadCameraPosition
    // Since loadCameraPosition is internal, we'll mock BABYLON.Vector3

    // Mock handlePieceClick
    spyOn(gameModule, "handlePieceClick").mockReturnValue();

    // Mock setupWebSocket
    mockSocket = {
      send: mock(),
      addEventListener: mock(),
      readyState: 1, // WebSocket.OPEN
    };
    mockSocket.addEventListener.mockImplementation((event, listener) => {
      if (event === "message") {
        messageEventListener = listener;
      } else if (event === "open") {
        // Simulate open event immediately
        setTimeout(() => listener(), 0);
      }
    });
    spyOn(websocketModule, "setupWebSocket").mockResolvedValue(mockSocket);

    // Spy on initGame
    initGameSpy = spyOn(gameModule, "initGame").mockResolvedValue();

    // Mock positionPieces
    spyOn(piecesModule, "positionPieces").mockReturnValue();

    // Mock printStateBinary
    spyOn(utilsModule, "printStateBinary").mockReturnValue();

    // Mock highlightValidMoves and clearHighlights
    spyOn(piecesModule, "highlightValidMoves").mockReturnValue();
    spyOn(piecesModule, "clearHighlights").mockReturnValue();

    // Mock rollDice
    spyOn(gameModule, "rollDice").mockResolvedValue();

    // Mock setTimeout
    global.setTimeout = mock((fn, ms) => fn());

    // Mock console.error to suppress error logs during testing
    spyOn(console, "error").mockReturnValue();
  });

  test("createGame returns an object with initialize and saveCameraPosition methods", () => {
    const deps = {
      canvas: mockCanvas,
      engine: mockEngine,
      gameInfoDiv: mockGameInfoDiv,
      diceRollDiv: mockDiceRollDiv,
      restartButton: mockRestartButton,
      localStorage: mockLocalStorage,
    };

    const game = mainModule.createGame(deps);

    expect(game).toHaveProperty("initialize");
    expect(game).toHaveProperty("saveCameraPosition");
  });

  test("initialize sets up the scene and event handlers", async () => {
    const deps = {
      canvas: mockCanvas,
      engine: mockEngine,
      gameInfoDiv: mockGameInfoDiv,
      diceRollDiv: mockDiceRollDiv,
      restartButton: mockRestartButton,
      localStorage: mockLocalStorage,
    };

    const game = mainModule.createGame(deps);

    await game.initialize();

    expect(boardModule.createScene).toHaveBeenCalledWith(
      mockEngine,
      mockCanvas
    );
    expect(piecesModule.createPieces).toHaveBeenCalledWith(mockScene);
    expect(typeof mockScene.onPointerDown).toBe("function");
    expect(mockEngine.runRenderLoop).toHaveBeenCalledWith(expect.any(Function));
    expect(mockRestartButton.addEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function)
    );
    expect(websocketModule.setupWebSocket).toHaveBeenCalledWith(
      expect.any(Function)
    );

    // Since localStorage is empty, initGame should be called
    expect(initGameSpy).toHaveBeenCalledTimes(1);
  });

  test("initialize restores saved game state if available", async () => {
    const savedGameState = { state: "saved_state" };
    mockLocalStorage.setItem("gameState", JSON.stringify(savedGameState));

    const deps = {
      canvas: mockCanvas,
      engine: mockEngine,
      gameInfoDiv: mockGameInfoDiv,
      diceRollDiv: mockDiceRollDiv,
      restartButton: mockRestartButton,
      localStorage: mockLocalStorage,
    };

    const game = mainModule.createGame(deps);

    await game.initialize();

    expect(mockSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "restore_game", state: savedGameState })
    );
    expect(initGameSpy).not.toHaveBeenCalled();
  });

//   test("updateGameState updates game state and UI", async () => {
//     const deps = {
//       canvas: mockCanvas,
//       engine: mockEngine,
//       gameInfoDiv: mockGameInfoDiv,
//       diceRollDiv: mockDiceRollDiv,
//       restartButton: mockRestartButton,
//       localStorage: mockLocalStorage,
//     };

//     const game = mainModule.createGame(deps);

//     await game.initialize();

//     // Simulate receiving a game_state message
//     const gameState = {
//       state: "12345", // Use a string instead of BigInt
//       current_player: "A",
//       dice_roll: 4,
//       moves: [],
//       game_over: false,
//     };

//     const event = {
//       data: JSON.stringify({ type: "game_state", ...gameState }),
//     };

//     // Call the message event listener
//     if (messageEventListener) {
//       messageEventListener(event);
//     }

//     // Check that gameState is updated, saveGameState is called, etc.
//     expect(piecesModule.positionPieces).toHaveBeenCalledWith(
//       gameState.state,
//       mockScene
//     );
//     expect(utilsModule.printStateBinary).toHaveBeenCalledWith(gameState.state);

//     expect(mockGameInfoDiv.textContent).toContain("Current player: A (You)");
//     expect(mockDiceRollDiv.textContent).toBe("Dice roll: 4");
//   });

//   test("makeMove sends correct message over the socket", async () => {
//     const deps = {
//       canvas: mockCanvas,
//       engine: mockEngine,
//       gameInfoDiv: mockGameInfoDiv,
//       diceRollDiv: mockDiceRollDiv,
//       restartButton: mockRestartButton,
//       localStorage: mockLocalStorage,
//     };

//     spyOn(mockSocket, "send").mockResolvedValue();

//     const game = mainModule.createGame(deps);

//     await game.initialize();

//     // Simulate a click on a move highlight
//     const pickResult = {
//       hit: true,
//       pickedMesh: {
//         name: "moveHighlight",
//         move: { from: 1, to: 2 },
//       },
//     };

//     // Set up gameState for the test
//     const gameState = {
//       current_player: "A",
//       dice_roll: 3,
//       moves: [{ from: 1, to: 2 }],
//     };

//     // Manually set gameState inside the game instance
//     game.gameState = gameState;

//     // Simulate onPointerDown event
//     mockScene.onPointerDown({}, pickResult);

//     // Check that socket.send was called with the correct data
//     expect(mockSocket.send).toHaveBeenCalledWith(
//       JSON.stringify({ type: "make_move", from: 1, to: 2 })
//     );
//   });

test("saveCameraPosition stores camera position in localStorage", () => {
    const deps = {
      canvas: mockCanvas,
      engine: mockEngine,
      gameInfoDiv: mockGameInfoDiv,
      diceRollDiv: mockDiceRollDiv,
      restartButton: mockRestartButton,
      localStorage: mockLocalStorage,
    };
  
    const game = mainModule.createGame(deps);
  
    // Mock the scene and activeCamera
    const mockScene = {
      activeCamera: {
        alpha: 0,
        beta: 0,
        radius: 0,
        target: { x: 0, y: 0, z: 0 },
      },
    };
  
    // Since `scene` is a closure variable inside `createGame`, we need a way to set it in the test.
    // We'll modify `createGame` to expose a `setScene` method for testing purposes.
  
    // Set the mockScene within the game instance
    game.setScene(mockScene);
  
    game.saveCameraPosition();
  
    const savedPosition = JSON.parse(
      mockLocalStorage.getItem("cameraPosition")
    );
    expect(savedPosition).toEqual({
      alpha: 0,
      beta: 0,
      radius: 0,
      target: { x: 0, y: 0, z: 0 },
    });
  });

  test("restartGame resets game state and calls initGame", async () => {
    const deps = {
      canvas: mockCanvas,
      engine: mockEngine,
      gameInfoDiv: mockGameInfoDiv,
      diceRollDiv: mockDiceRollDiv,
      restartButton: mockRestartButton,
      localStorage: mockLocalStorage,
    };

    const game = mainModule.createGame(deps);

    await game.initialize();

    // Get the restartGame function from the event listener
    const restartGameFunc =
      mockRestartButton.addEventListener.mock.calls[0][1];

    // Reset the call count for initGameSpy
    initGameSpy.mockReset();

    await restartGameFunc();

    expect(mockLocalStorage.getItem("gameState")).toBeUndefined();
    expect(initGameSpy).toHaveBeenCalledTimes(1); // Called once in restartGame
  });

  test("handles errors during initialization gracefully", async () => {
    websocketModule.setupWebSocket.mockRejectedValue(
      new Error("WebSocket error")
    );

    const deps = {
      canvas: mockCanvas,
      engine: mockEngine,
      gameInfoDiv: mockGameInfoDiv,
      diceRollDiv: mockDiceRollDiv,
      restartButton: mockRestartButton,
      localStorage: mockLocalStorage,
    };

    const game = mainModule.createGame(deps);

    await game.initialize();

    expect(console.error).toHaveBeenCalledWith(
      "Failed to setup WebSocket or initialize game:",
      expect.any(Error)
    );
  });
});
