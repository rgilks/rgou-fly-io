//
export const createScene = (engine, canvas) => {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 8,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 0.1, 0),
    scene
  );

  createBoard(scene);

  return scene;
};

const createBoard = (scene) => {
  const boardWidth = 8;
  const boardHeight = 3;
  const squareSize = 1;

  createSquares(scene);
};

const createSquares = (scene) => {
  const squarePositions = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [6, 0],
    [7, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [7, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [6, 2],
    [7, 2],
  ];

  const rosettePositions = [
    [0, 0],
    [7, 0],
    [3, 1],
    [0, 2],
    [7, 2],
  ];

  squarePositions.forEach(([x, z], index) => {
    const square = BABYLON.MeshBuilder.CreateBox(
      `square_${index}`,
      { width: 0.98, height: 0.5, depth: 0.98 },
      scene
    );
    square.index = index;
    square.position.set(x - 3.5, 0.05, z - 1);

    const squareMaterial = new BABYLON.StandardMaterial(
      `squareMat_${index}`,
      scene
    );
    if (rosettePositions.some((pos) => pos[0] === x && pos[1] === z)) {
      squareMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red color for rosettes
    }
    square.material = squareMaterial;
  });
};
