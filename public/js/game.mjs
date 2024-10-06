import { clearHighlights } from "./pieces.mjs";

export const initGame = async (socket) => {
  try {
    await socket.send(JSON.stringify({ type: "new_game" }));
  } catch (error) {
    console.error("Error starting new game:", error);
    throw error;
  }
};

export const handlePieceClick = (pickResult, gameState, scene, makeMove, xr) => {
  if (!scene) {
    console.error("Scene is undefined in handlePieceClick");
    return;
  }

  if (xr && xr.baseExperience) {
    // VR mode
    xr.input.onControllerAddedObservable.add((controller) => {
      controller.onMotionControllerInitObservable.add((motionController) => {
        motionController.onModelLoadedObservable.add(() => {
          const component = motionController.getComponent("trigger");
          component.onButtonStateChangedObservable.add((component) => {
            if (component.pressed) {
              const ray = controller.getWorldPointerRayToRef();
              const pick = scene.pickWithRay(ray);
              if (pick.hit && (pick.pickedMesh.name === "moveHighlight" || pick.pickedMesh.name.startsWith("exitSquare"))) {
                const move = pick.pickedMesh.move;
                if (move) {
                  makeMove(move.from, move.to);
                  clearHighlights(scene);
                }
              }
            }
          });
        });
      });
    });
  } else {
    // Non-VR mode
    if (pickResult.hit && (pickResult.pickedMesh.name === "moveHighlight" || pickResult.pickedMesh.name.startsWith("exitSquare"))) {
      const move = pickResult.pickedMesh.move;
      if (move) {
        makeMove(move.from, move.to);
        clearHighlights(scene);
      }
    }
  }
};

export const rollDice = async (socket) => {
  try {
    await socket.send(JSON.stringify({ type: "roll_dice" }));
  } catch (error) {
    console.error("Error rolling dice:", error);
    throw error;
  }
};
