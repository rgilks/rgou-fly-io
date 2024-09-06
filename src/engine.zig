const std = @import("std");

pub const GameState = u64;

pub const Player = enum(u1) {
    A = 0,
    B = 1,
};

pub const MAX_ROLL = 4;
pub const BOARD_SIZE = 24;
pub const PIECES_PER_PLAYER = 7;
pub const CENTER_ROSETTE = 11; // B4 is at position 11

pub const Move = struct {
    from: u6,
    to: u6,
    captured: ?Player,
    player: Player,
};

pub fn getOffBoardPieces(state: GameState, player: Player) u3 {
    return @truncate(state >> (@as(u6, @intFromEnum(player)) * 3));
}

pub fn getCompletedPieces(state: GameState, player: Player) u3 {
    return @truncate((state >> (6 + @as(u6, @intFromEnum(player)) * 3)) & 0b111);
}

pub fn getCurrentPlayer(state: GameState) Player {
    return @enumFromInt(@as(u1, @truncate(state >> 12)));
}

pub fn getDiceRoll(state: GameState) u3 {
    return @truncate(state >> 13);
}

pub fn getBoardPosition(state: GameState, position: u6) u2 {
    return @truncate(state >> (16 + position * 2));
}

pub fn setOffBoardPieces(state: *GameState, player: Player, pieces: u3) void {
    const shift = @as(u6, @intFromEnum(player)) * 3;
    const mask = @as(GameState, 0b111) << shift;
    state.* = (state.* & ~mask) | (@as(GameState, pieces) << shift);
}

pub fn setCurrentPlayer(state: *GameState, player: Player) void {
    const mask = @as(GameState, 1) << 12;
    state.* = (state.* & ~mask) | (@as(GameState, @intFromEnum(player)) << 12);
}

pub fn setDiceRoll(state: *GameState, roll: u3) void {
    const mask = @as(GameState, 0b111) << 13;
    state.* = (state.* & ~mask) | (@as(GameState, roll) << 13);
}

pub fn setBoardPosition(state: *GameState, position: u6, value: u2) void {
    const shift = 16 + position * 2;
    const mask = @as(GameState, 0b11) << shift;
    state.* = (state.* & ~mask) | (@as(GameState, value) << shift);
}

pub fn isRosette(position: u6) bool {
    return position == 0 or position == 6 or position == CENTER_ROSETTE or position == 16 or position == 22;
}

pub fn isExcluded(position: u6) bool {
    return position == 4 or position == 5 or position == 20 or position == 21;
}

pub fn rollDice(rng: *std.rand.DefaultPrng) u3 {
    var roll: u3 = 0;
    for (0..4) |_| {
        roll += @as(u3, @intFromBool(rng.random().boolean()));
    }
    return roll;
}

pub fn getPlayerPath(player: Player) [14]u6 {
    return switch (player) {
        .A => .{ 3, 2, 1, 0, 8, 9, 10, 11, 12, 13, 14, 15, 7, 6 },
        .B => .{ 19, 18, 17, 16, 8, 9, 10, 11, 12, 13, 14, 15, 23, 22 },
    };
}

fn findNextPosition(path: []const u6, from: u6, roll: u3) ?u6 {
    const start_index = for (path, 0..) |pos, i| {
        if (pos == from) break i;
    } else return null;

    return if (start_index + roll < path.len) path[start_index + roll] else null;
}

fn movePiece(state: GameState, player: Player, from: u6, roll: u3) ?Move {
    if (roll == 0) return null;

    const path = getPlayerPath(player);
    const steps_to_end = if (from == BOARD_SIZE) path.len else blk: {
        const start_index = for (path, 0..) |pos, i| {
            if (pos == from) break i;
        } else return null;
        break :blk path.len - start_index;
    };

    if (from != BOARD_SIZE and roll == steps_to_end) {
        return Move{ .from = from, .to = BOARD_SIZE, .captured = null, .player = player };
    }

    const new_pos = if (from == BOARD_SIZE)
        path[roll - 1]
    else
        findNextPosition(&path, from, roll) orelse return null;

    const target = getBoardPosition(state, new_pos);
    return switch (target) {
        0 => Move{ .from = from, .to = new_pos, .captured = null, .player = player },
        1 => if (player == .A or new_pos == CENTER_ROSETTE) null else Move{ .from = from, .to = new_pos, .captured = .A, .player = player },
        2 => if (player == .B or new_pos == CENTER_ROSETTE) null else Move{ .from = from, .to = new_pos, .captured = .B, .player = player },
        else => unreachable,
    };
}

pub fn getPossibleMoves(state: GameState, allocator: std.mem.Allocator) !std.ArrayList(Move) {
    var moves = std.ArrayList(Move).init(allocator);
    errdefer moves.deinit();

    const player = getCurrentPlayer(state);
    const roll = getDiceRoll(state);
    if (roll == 0) return moves;

    const path = getPlayerPath(player);
    const entry_point = path[roll - 1];

    const can_enter = getOffBoardPieces(state, player) > 0 and getBoardPosition(state, entry_point) == 0;
    if (can_enter) {
        if (movePiece(state, player, BOARD_SIZE, roll)) |move| {
            try moves.append(move);
        }
    }

    for (path) |pos| {
        if (getBoardPosition(state, pos) == @as(u2, @intFromEnum(player)) + 1) {
            if (movePiece(state, player, pos, roll)) |move| {
                try moves.append(move);
            }
        }
    }

    return moves;
}

pub fn makeMove(state: *GameState, move: Move) void {
    const player = getCurrentPlayer(state.*);
    const opponent = if (player == .A) Player.B else Player.A;

    if (move.from == BOARD_SIZE) {
        setOffBoardPieces(state, player, getOffBoardPieces(state.*, player) - 1);
    } else {
        setBoardPosition(state, move.from, 0);
    }

    if (move.to == BOARD_SIZE) {
        const completed = @as(u3, @truncate((state.* >> (6 + @as(u6, @intFromEnum(player)) * 3)) & 0b111));
        const mask = @as(GameState, 0b111) << (6 + @as(u6, @intFromEnum(player)) * 3);
        state.* = (state.* & ~mask) | (@as(GameState, completed + 1) << (6 + @as(u6, @intFromEnum(player)) * 3));
    } else {
        setBoardPosition(state, move.to, @as(u2, @intFromEnum(player)) + 1);
    }

    if (move.captured) |captured_player| {
        const current_off_board = getOffBoardPieces(state.*, captured_player);
        if (current_off_board < PIECES_PER_PLAYER) {
            setOffBoardPieces(state, captured_player, current_off_board + 1);
        }
    }

    // Only grant an extra turn if the piece lands on a rosette
    if (move.to != BOARD_SIZE and !isRosette(move.to)) {
        setCurrentPlayer(state, opponent);
    }
}

pub fn isGameOver(state: GameState) bool {
    const player = getCurrentPlayer(state);
    const completed = @as(u3, @truncate((state >> (6 + @as(u6, @intFromEnum(player)) * 3)) & 0b111));
    return completed == PIECES_PER_PLAYER;
}

pub fn initGame(rng: *const std.rand.Random) GameState {
    var state: GameState = 0;
    setOffBoardPieces(&state, .A, PIECES_PER_PLAYER);
    setOffBoardPieces(&state, .B, PIECES_PER_PLAYER);
    
    // Randomly set the starting player
    const starting_player = if (rng.boolean()) Player.A else Player.B;
    setCurrentPlayer(&state, starting_player);
    
    return state;
}