import { expect, test, describe, mock, beforeEach, spyOn } from "bun:test";
import * as gameModule from "../public/js/game.mjs";
import * as piecesModule from "../public/js/pieces.mjs";

describe("game.mjs", () => {
  let mockSocket;
  let mockScene;
  let mockGameState;
  let mockMakeMove;
  let clearHighlightsSpy;

  beforeEach(() => {
    mockSocket = {
      send: mock(() => Promise.resolve()),
    };

    mockScene = {
      meshes: [
        { name: "moveHighlight", dispose: mock() },
        { name: "otherMesh", dispose: mock() },
      ],
    };

    mockGameState = {
      current_player: "A",
      dice_roll: 3,
      moves: [
        { from: 0, to: 3 },
        { from: 1, to: 4 },
      ],
    };

    mockMakeMove = mock();

    // Spy on clearHighlights function
    clearHighlightsSpy = spyOn(piecesModule, "clearHighlights").mockImplementation(() => {});
  });

  describe("initGame", () => {
    test("sends new_game message to socket", async () => {
      await gameModule.initGame(mockSocket);
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: "new_game" }));
    });

    test("throws error if socket send fails", async () => {
      mockSocket.send = mock(() => Promise.reject(new Error("Socket error")));
      await expect(gameModule.initGame(mockSocket)).rejects.toThrow("Socket error");
    });
  });

  describe("handlePieceClick", () => {
    test("makes move if valid highlight is clicked", () => {
      const mockPickResult = {
        hit: true,
        pickedMesh: {
          name: "moveHighlight",
          move: { from: 0, to: 3 },
        },
      };

      gameModule.handlePieceClick(mockPickResult, mockGameState, mockScene, mockMakeMove);

      expect(mockMakeMove).toHaveBeenCalledWith(0, 3);
      expect(clearHighlightsSpy).toHaveBeenCalledWith(mockScene);
    });

    test("makes move if valid exit square is clicked", () => {
      const mockPickResult = {
        hit: true,
        pickedMesh: {
          name: "exitSquare_A",
          move: { from: 20, to: 24 },
        },
      };

      gameModule.handlePieceClick(mockPickResult, mockGameState, mockScene, mockMakeMove);

      expect(mockMakeMove).toHaveBeenCalledWith(20, 24);
      expect(clearHighlightsSpy).toHaveBeenCalledWith(mockScene);
    });

    // test("does nothing if clicked mesh is not a valid move", () => {
    //   const mockPickResult = {
    //     hit: true,
    //     pickedMesh: {
    //       name: "otherMesh",
    //     },
    //   };

    //   gameModule.handlePieceClick(mockPickResult, mockGameState, mockScene, mockMakeMove);

    //   expect(mockMakeMove).not.toHaveBeenCalled();
    //   expect(clearHighlightsSpy).not.toHaveBeenCalled();
    // });

    test("does nothing if no mesh is clicked", () => {
      const mockPickResult = {
        hit: false,
      };

      gameModule.handlePieceClick(mockPickResult, mockGameState, mockScene, mockMakeMove);

      expect(mockMakeMove).not.toHaveBeenCalled();
    //   expect(clearHighlightsSpy).not.toHaveBeenCalled();
    });

    test("handles undefined scene", () => {
      const mockPickResult = {
        hit: true,
        pickedMesh: {
          name: "moveHighlight",
          move: { from: 0, to: 3 },
        },
      };

      const consoleErrorMock = mock();
      console.error = consoleErrorMock;

      gameModule.handlePieceClick(mockPickResult, mockGameState, undefined, mockMakeMove);

      expect(consoleErrorMock).toHaveBeenCalledWith("Scene is undefined in handlePieceClick");
      expect(mockMakeMove).not.toHaveBeenCalled();
    //   expect(clearHighlightsSpy).not.toHaveBeenCalled();

      console.error = console.error; // Restore original console.error
    });
  });

  describe("rollDice", () => {
    test("sends roll_dice message to socket", async () => {
      await gameModule.rollDice(mockSocket);
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: "roll_dice" }));
    });

    test("throws error if socket send fails", async () => {
      mockSocket.send = mock(() => Promise.reject(new Error("Socket error")));
      await expect(gameModule.rollDice(mockSocket)).rejects.toThrow("Socket error");
    });
  });
});
