import { createPieces } from "./pieces.js";

const DICE_COUNT = 4;
const DICE_SIZE = 0.3;

export const createScene = async (engine, canvas) => {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    15,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // Enable physics
  const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
  const physicsPlugin = new BABYLON.CannonJSPlugin();
  
  // Wait for the physics engine to be fully initialized
  await scene.enablePhysics(gravityVector, physicsPlugin);

  createBoard(scene);
  await createGround(scene);
  await createDice(scene);

  return scene;
};

const createBoard = (scene) => {
  const board = BABYLON.MeshBuilder.CreateBox("board", { width: 8, height: 0.2, depth: 3 }, scene);
  board.position.y = 0.1;
  const boardMaterial = new BABYLON.StandardMaterial("boardMaterial", scene);
  boardMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
  board.material = boardMaterial;

  createSquares(scene);
};

const createSquares = (scene) => {
  const squarePositions = [
    [0, 0], [1, 0], [2, 0], [3, 0], [6, 0], [7, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [6, 2], [7, 2],
  ];

  const rosettePositions = [[0, 0], [7, 0], [3, 1], [0, 2], [7, 2]];

  squarePositions.forEach(([x, z], index) => {
    const square = BABYLON.MeshBuilder.CreateBox(
      `square_${index}`,
      { width: 0.98, height: 0.05, depth: 0.98 },
      scene
    );
    square.index = index;
    square.position.set(x - 3.5, 0.23, z - 1);

    const squareMaterial = new BABYLON.StandardMaterial(`squareMat_${index}`, scene);
    if (rosettePositions.some((pos) => pos[0] === x && pos[1] === z)) {
      squareMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red color for rosettes
    } else {
      squareMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    }
    square.material = squareMaterial;
  });
};

const createGround = async (scene) => {
  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
  ground.position.y = 0;
  const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  ground.material = groundMaterial;
  
  await new Promise(resolve => {
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.5, friction: 0.1 },
      scene
    );
    resolve();
  });
};

const createDice = async (scene) => {
  const diceContainer = new BABYLON.TransformNode("diceContainer", scene);

  for (let i = 0; i < DICE_COUNT; i++) {
    const die = createTetrahedron(scene);
    die.position = new BABYLON.Vector3((i - 1.5) * 0.6, 5 + i * 0.5, -3);
    die.parent = diceContainer;

    await new Promise(resolve => {
      die.physicsImpostor = new BABYLON.PhysicsImpostor(
        die,
        BABYLON.PhysicsImpostor.ConvexHullImpostor,
        { mass: 1, restitution: 0.5, friction: 0.1 },
        scene
      );
      resolve();
    });
  }

  return diceContainer;
};

const createTetrahedron = (scene) => {
  const name = "tetrahedron";
  const vertexData = new BABYLON.VertexData();

  const sqrt3 = Math.sqrt(3);
  const vertices = [
    new BABYLON.Vector3(1, 0, -1 / sqrt3),
    new BABYLON.Vector3(-1, 0, -1 / sqrt3),
    new BABYLON.Vector3(0, 0, 2 / sqrt3),
    new BABYLON.Vector3(0, sqrt3, 0),
  ];

  vertices.forEach(v => v.scaleInPlace(DICE_SIZE));

  const positions = vertices.flatMap((v) => [v.x, v.y, v.z]);
  const indices = [
    0, 1, 2,
    0, 2, 3,
    0, 3, 1,
    1, 3, 2
  ];

  const normals = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);

  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;

  const tetrahedron = new BABYLON.Mesh(name, scene);
  vertexData.applyToMesh(tetrahedron);

  const material = new BABYLON.StandardMaterial("dieMaterial", scene);
  material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  tetrahedron.material = material;

  addCornerHighlights(tetrahedron, scene);

  return tetrahedron;
};

const addCornerHighlights = (tetrahedron, scene) => {
  const highlightMaterial = new BABYLON.StandardMaterial("highlightMaterial", scene);
  highlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
  highlightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  const sqrt3 = Math.sqrt(3);
  const cornerPositions = [
    new BABYLON.Vector3(1, 0, -1 / sqrt3),
    new BABYLON.Vector3(-1, 0, -1 / sqrt3),
    new BABYLON.Vector3(0, sqrt3, 0),
    new BABYLON.Vector3(0, 0, 2 / sqrt3),
  ];

  // Randomly select two corners to highlight
  const highlightIndices = [];
  while (highlightIndices.length < 2) {
    const index = Math.floor(Math.random() * 4);
    if (!highlightIndices.includes(index)) {
      highlightIndices.push(index);
    }
  }

  highlightIndices.forEach((index) => {
    const position = cornerPositions[index].scale(DICE_SIZE);
    const highlight = BABYLON.MeshBuilder.CreateSphere(`highlight${index}`, { diameter: 0.05 }, scene);
    highlight.material = highlightMaterial;
    highlight.parent = tetrahedron;
    highlight.position = position;
  });
};

export const rollDice = async (scene) => {
  console.log('Rolling dice...');
  const diceContainer = scene.getTransformNodeByName("diceContainer");
  console.log('Dice container:', diceContainer);
  const dice = diceContainer.getChildMeshes().filter(mesh => mesh.name === "tetrahedron");
  console.log('Number of dice found:', dice.length);

  for (const [index, die] of dice.entries()) {
    console.log(`Processing die ${index}:`, die);
    
    // Reset position and rotation
    die.position = new BABYLON.Vector3((index - 1.5) * 0.6, 5 + index * 0.5, -3);
    die.rotationQuaternion = BABYLON.Quaternion.Random();

    if (die.physicsImpostor) {
      die.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(Math.random() - 0.5, -5, Math.random() - 0.5).scale(5));
      die.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).scale(10));
    } else {
      console.error('Physics impostor not found for die:', die);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const result = determineDiceResult(dice);
      resolve(result);
    }, 3000);
  });
};

const determineDiceResult = (dice) => {
  let result = 0;
  dice.forEach((die, index) => {
    const upVector = die.getDirection(BABYLON.Axis.Y);
    const dotProducts = die.getChildMeshes().map(child => 
      BABYLON.Vector3.Dot(upVector, child.position.normalize())
    );
    const maxDotProduct = Math.max(...dotProducts);
    if (maxDotProduct > 0.9) {
      result |= (1 << index);
      die.getChildMeshes()[dotProducts.indexOf(maxDotProduct)].material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    } else {
      die.getChildMeshes().forEach(child => child.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2));
    }
  });
  return result;
};

export { createPieces };
