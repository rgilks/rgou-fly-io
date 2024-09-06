# Game State Bit Layout

The game state is represented as a 64-bit integer, with different bits or groups of bits representing various aspects of the game. Here's the detailed layout, starting from the least significant bit (LSB):

## Bit Layout Table

| Bits   | Name | Purpose                                             |
|--------|------|-----------------------------------------------------|
| 0-2    | AOB  | Player A off-board pieces (3 bits, values 0-7)      |
| 3-5    | BOB  | Player B off-board pieces (3 bits, values 0-7)      |
| 6-8    | AC   | Player A completed pieces (3 bits, values 0-7)      |
| 9-11   | BC   | Player B completed pieces (3 bits, values 0-7)      |
| 12     | C    | Current player (0 for A, 1 for B)                   |
| 13-15  | ROL  | Dice roll (3 bits, values 0-4)                      |
| 16-63  | -    | Board state (24 positions * 2 bits each = 48 bits)  |

## Board State Details

The board state uses 2 bits per position, with the following encoding:
- 00: Empty
- 01: Player A
- 10: Player B

### Special Board Positions

- Position 4 (bits 24-25): Extra turn flag
- Positions 5 (bits 26-27), 20 (bits 56-57), and 21 (bits 58-59) are not used

## Board Layout

The board positions are laid out in reverse order in the bit representation:

```
23 22 xx xx 19 18 17 16 15 14 13 12 11 10  9  8  7  6 XX ET  3  2  1  0 ROL C BC  AC  BOB AOB
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 000 0 000 000 000 000
```

Where:
- `xx`: Unused positions (5, 20, 21)
- `ET`: Extra turn flag (position 4)
- `ROL`: Dice roll
- `C`: Current player
- `BC`: Player B completed pieces
- `AC`: Player A completed pieces
- `BOB`: Player B off-board pieces
- `AOB`: Player A off-board pieces

## Usage Notes

1. To access a specific board position, shift right by `(16 + 2 * position)` and mask with 3.
2. Remember that positions 4, 5, 20, and 21 are special cases and should be handled accordingly.
3. The extra turn flag is stored in the bits for board position 4.
4. When manipulating the state, always use bitwise operations to ensure the integrity of the entire state.

This layout allows for efficient storage and manipulation of the game state using bitwise operations.