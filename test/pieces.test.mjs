import { expect, test, describe, mock, beforeEach, spyOn } from "bun:test";
import * as piecesModule from "../public/js/pieces.mjs";

describe("pieces.mjs", () => {
  let mockScene, mockMeshBuilder, mockStandardMaterial, mockColor3, mockVector3;

  beforeEach(() => {
    mockScene = {
      meshes: [],
    };

    mockMeshBuilder = {
      CreateCylinder: mock(() => ({
        material: null,
        position: { y: 0 },
        isPickable: false,
      })),
    };

    mockStandardMaterial = mock(function () {
      return {
        diffuseColor: null,
        alpha: 1,
      };
    });

    mockColor3 = mock(function () {
      return {};
    });

    mockVector3 = mock(function () {
      return { x: 0, y: 0, z: 0 };
    });

    global.BABYLON = {
      MeshBuilder: mockMeshBuilder,
      StandardMaterial: mockStandardMaterial,
      Color3: mockColor3,
      Vector3: mockVector3,
    };
  });

  describe("createPieces", () => {
    test("creates correct number of pieces for each player", () => {
      const pieces = piecesModule.createPieces(mockScene);
      expect(Object.keys(pieces).length).toBe(14); // 7 pieces per player
      expect(mockMeshBuilder.CreateCylinder).toHaveBeenCalledTimes(14);
    });

    test("sets correct properties for pieces", () => {
      piecesModule.createPieces(mockScene);
      const createdPiece = mockMeshBuilder.CreateCylinder.mock.calls[0][1];
      expect(createdPiece.height).toBe(0.7);
      expect(createdPiece.diameter).toBe(0.8);
    });

    test("sets different colors for each player's pieces", () => {
      piecesModule.createPieces(mockScene);
      expect(mockColor3).toHaveBeenCalledWith(0.7, 0, 0); // Player A color
      expect(mockColor3).toHaveBeenCalledWith(0, 0, 0.7); // Player B color
    });
  });

  describe("getPiecePositions", () => {
    test("correctly parses state into piece positions", () => {
      const testState = BigInt(
        "0b0101010101010101010101010101010101010101010101010101010101010101"
      );
      const positions = piecesModule.getPiecePositions(testState);
      expect(positions).toEqual([
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
      ]);
    });
  });

  describe("positionPieces", () => {
    test("positions pieces correctly based on state", () => {
      const testState =
        BigInt("0b0101010101010101010101010101010101010101010101010101010101010101");
      const getMeshByNameMock = mock((name) => ({
        position: { x: 0, y: 0, z: 0 },
        visibility: 0,
      }));
      mockScene.getMeshByName = getMeshByNameMock;

      piecesModule.positionPieces(testState, mockScene);

      expect(getMeshByNameMock).toHaveBeenCalledTimes(50);
    });

    test("handles off-board and completed pieces", () => {
      const testState =
        BigInt("0b0101010101010101010101010101010101010101010101010101010101111111");
      const getMeshByNameMock = mock((name) => ({
        position: { x: 0, y: 0, z: 0 },
        visibility: 0,
      }));
      mockScene.getMeshByName = getMeshByNameMock;

      piecesModule.positionPieces(testState, mockScene);

      expect(getMeshByNameMock).toHaveBeenCalledWith("piece_A_0");
      expect(getMeshByNameMock).toHaveBeenCalledWith("piece_A_1");
      expect(getMeshByNameMock).toHaveBeenCalledWith("piece_A_2");
    });
  });

  describe("highlightValidMoves", () => {
    test("creates highlight meshes for valid moves", () => {
      const gameState = {
        moves: [
          { from: 0, to: 3 },
          { from: 1, to: 4 },
        ],
        current_player: "A",
      };

      piecesModule.highlightValidMoves(mockScene, gameState);

      expect(mockMeshBuilder.CreateCylinder).toHaveBeenCalledTimes(2);
      expect(mockStandardMaterial).toHaveBeenCalledTimes(2);
    });

    test("handles exit square highlighting", () => {
      const gameState = {
        moves: [{ from: 20, to: 24 }],
        current_player: "A",
      };

      piecesModule.highlightValidMoves(mockScene, gameState);

      expect(mockMeshBuilder.CreateCylinder).toHaveBeenCalledTimes(1);
      const highlightPosition = mockMeshBuilder.CreateCylinder.mock.calls[0][1];
      expect(highlightPosition.diameter).toBe(0.5); // Exit square highlight is smaller
    });
  });

  describe("getPiecePositions", () => {
    test("correctly parses state into piece positions", () => {
      const testState = BigInt(
        "0b0101010101010101010101010101010101010101010101010101010101111111"
      );
      const positions = piecesModule.getPiecePositions(testState);
      expect(positions).toEqual([
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
        "01",
      ]);
    });
  });
});
