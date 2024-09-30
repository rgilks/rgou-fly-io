import { expect, test, describe, mock, beforeEach, spyOn } from "bun:test";
import * as boardModule from "../public/js/board.mjs";

describe("board.mjs", () => {
  let mockScene,
    mockEngine,
    mockArcRotateCamera,
    mockHemisphericLight,
    mockMeshBuilder,
    mockStandardMaterial,
    mockColor3,
    mockVector3;

  beforeEach(() => {
    mockScene = {
      createDefaultCamera: mock(() => {}),
      createDefaultLight: mock(() => {}),
    };

    mockEngine = {
      getRenderingCanvas: mock(() => ({})),
    };

    mockArcRotateCamera = mock(function () {
      return {
        attachControl: mock(),
      };
    });

    mockHemisphericLight = mock(function () {});

    mockMeshBuilder = {
      CreateBox: mock(() => ({
        position: { set: mock() },
        material: null,
        index: 0,
      })),
    };

    mockStandardMaterial = mock(function () {
      return {
        diffuseColor: null,
      };
    });

    mockColor3 = mock(function () {
      return {};
    });

    mockVector3 = mock(function () {
      return { x: 0, y: 0, z: 0 };
    });

    global.BABYLON = {
      Scene: mock(() => mockScene),
      ArcRotateCamera: mockArcRotateCamera,
      Vector3: mockVector3,
      HemisphericLight: mockHemisphericLight,
      MeshBuilder: mockMeshBuilder,
      StandardMaterial: mockStandardMaterial,
      Color3: mockColor3,
    };
  });

  test("createScene creates a scene with camera and light", () => {
    const canvas = {};
    const scene = boardModule.createScene(mockEngine, canvas);

    expect(global.BABYLON.Scene.mock.calls.length).toBe(1);
    expect(global.BABYLON.Scene.mock.calls[0][0]).toBe(mockEngine);
    expect(global.BABYLON.ArcRotateCamera.mock.calls.length).toBe(1);
    expect(global.BABYLON.HemisphericLight.mock.calls.length).toBe(1);
    expect(scene).toBe(mockScene);
  });

  test("createBoard calls createSquares", () => {
    const createSquaresSpy = spyOn(boardModule, "createSquares");

    boardModule.createBoard(mockScene);

    expect(createSquaresSpy).toHaveBeenCalledTimes(1);
    expect(createSquaresSpy).toHaveBeenCalledWith(mockScene);

    createSquaresSpy.mockRestore();
  });

  test("createSquares creates correct number of squares", () => {
    boardModule.createSquares(mockScene);

    // 20 squares in total (14 normal squares + 6 rosettes)
    expect(global.BABYLON.MeshBuilder.CreateBox.mock.calls.length).toBe(20);
  });

  test("createSquares sets correct properties for squares", () => {
    boardModule.createSquares(mockScene);

    const createdBox = global.BABYLON.MeshBuilder.CreateBox.mock.calls[0][1];

    expect(createdBox.width).toBe(0.98);
    expect(createdBox.height).toBe(0.5);
    expect(createdBox.depth).toBe(0.98);
    expect(global.BABYLON.StandardMaterial.mock.calls.length).toBe(20);
  });

  test("createSquares creates rosettes with different color", () => {
    boardModule.createSquares(mockScene);

    // Check if Color3 was called with red color for rosettes
    const rosetteCalls = global.BABYLON.Color3.mock.calls.filter(
      (call) => call[0] === 0.8 && call[1] === 0.1 && call[2] === 0.1
    );
    expect(rosetteCalls.length).toBe(5); // 5 rosettes
  });
});
