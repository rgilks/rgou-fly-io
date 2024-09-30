import { expect, test, describe, spyOn } from "bun:test";
import { getPositionIndex, getPositionFromIndex, printStateBinary } from "../public/js/utils.mjs";

// Mock BABYLON.Vector3
class Vector3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

global.BABYLON = { Vector3 };

describe("utils", () => {
  test("getPositionIndex calculates correct index", () => {
    expect(getPositionIndex({ x: 0, z: 0 })).toBe(12);
    expect(getPositionIndex({ x: -3.5, z: -1 })).toBe(0);
    expect(getPositionIndex({ x: 4.5, z: 1 })).toBe(24);
  });

  test("getPositionFromIndex returns correct position", () => {
    const testCases = [
      { index: 0, expected: { x: -3.5, y: 0.2, z: -1 } },
      { index: 12, expected: { x: 0.5, y: 0.2, z: 0 } },
      { index: 23, expected: { x: 3.5, y: 0.2, z: 1 } },
    ];

    testCases.forEach(({ index, expected }) => {
      const position = getPositionFromIndex(index);
      expect(position.x).toBe(expected.x);
      expect(position.y).toBe(expected.y);
      expect(position.z).toBe(expected.z);
    });
  });

  test("printStateBinary outputs correct format", () => {
    const logSpy = spyOn(console, "log");
    
    const testState = BigInt("0b1111000011110000111100001111000011110000111100001111000011110000");
    printStateBinary(testState);

    expect(logSpy).toHaveBeenCalledTimes(2);

    expect(logSpy.mock.calls[0][0]).toBe("23 22 xx xx 19 18 17 16 15 14 13 12 11 10  9  8  7  6 xx ET  3  2  1  0 ROL C BC  AC  BOB AOB");
    expect(logSpy.mock.calls[1][0]).toBe("11 11 00 00 11 11 00 00 11 11 00 00 11 11 00 00 11 11 00 00 11 11 00 00 111 1 000 011 110 000");

    logSpy.mockRestore();
  });
});