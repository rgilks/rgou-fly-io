// 
export const getPositionIndex = (position) => {
  const row = Math.round(position.z + 1);
  const col = Math.round(position.x + 3.5);
  return row * 8 + col;
};

export const getPositionFromIndex = (index) => {
  const row = Math.floor(index / 8);
  const col = index % 8;
  return new BABYLON.Vector3(col - 3.5, 0.2, row - 1);
};

export const animateDiceRoll = (roll, diceRollDiv) => {
  let frames = 20;
  let interval = setInterval(() => {
    if (frames > 0) {
      diceRollDiv.textContent = `Dice roll: ${Math.floor(Math.random() * 5)}`;
      frames--;
    } else {
      clearInterval(interval);
      diceRollDiv.textContent = `Dice roll: ${roll}`;
    }
  }, 50);
};
