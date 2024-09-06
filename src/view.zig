const std = @import("std");
const engine = @import("engine.zig");

const Symbol = struct {
    A: []const u8,
    B: []const u8,
    rosette: []const u8,
    empty: []const u8,
    blank: []const u8,
    arrow: []const u8,
    dice_filled: []const u8,
    dice_empty: []const u8,
    border: []const u8,
    top_border: []const u8,
    bottom_border: []const u8,
};

const fancy_symbols = Symbol{
    .A = "●",
    .B = "■",
    .rosette = "✧",
    .empty = "·",
    .blank = "  ",
    .arrow = " → ",
    .dice_filled = "▲",
    .dice_empty = "△",
    .border = "│",
    .top_border = "┌───────────────────┐",
    .bottom_border = "└───────────────────┘",
};

const simple_symbols = Symbol{
    .A = "O",
    .B = "X",
    .rosette = "+",
    .empty = "-",
    .blank = "  ",
    .arrow = " > ",
    .dice_filled = "1",
    .dice_empty = "0",
    .border = " ",
    .top_border = " ------------------ ",
    .bottom_border = " ------------------ ",
};

var use_fancy_symbols: bool = false;

pub fn toggleSymbols() void {
    use_fancy_symbols = !use_fancy_symbols;
}

pub fn getSymbols() Symbol {
    return if (use_fancy_symbols) fancy_symbols else simple_symbols;
}

pub fn getPositionName(pos: u6) []const u8 {
    if (pos == engine.BOARD_SIZE) return "   ";
    const row = pos / 8;
    const col = pos % 8 + 1;
    return switch (row) {
        0 => switch (col) {
            1 => "A1",
            2 => "A2",
            3 => "A3",
            4 => "A4",
            7 => "A7",
            8 => "A8",
            else => unreachable,
        },
        1 => switch (col) {
            1 => "B1",
            2 => "B2",
            3 => "B3",
            4 => "B4",
            5 => "B5",
            6 => "B6",
            7 => "B7",
            8 => "B8",
            else => unreachable,
        },
        2 => switch (col) {
            1 => "C1",
            2 => "C2",
            3 => "C3",
            4 => "C4",
            7 => "C7",
            8 => "C8",
            else => unreachable,
        },
        else => unreachable,
    };
}

pub fn printBoard(state: engine.GameState, moves: []const engine.Move) !void {
    const stdout = std.io.getStdOut().writer();
    const symbols = getSymbols();

    try stdout.print("\n     1 2 3 4 5 6 7 8\n", .{});
    try stdout.print(" {s}\n", .{symbols.top_border});

    const rows = [_]u8{ 'A', 'B', 'C' };
    for (rows, 0..) |row, i| {
        try stdout.print(" {s}{c}  ", .{ symbols.border, row });

        for (0..8) |col| {
            const pos = i * 8 + col;
            if (engine.isExcluded(@intCast(pos))) {
                try stdout.print("{s}", .{symbols.blank});
                continue;
            }
            const cell = engine.getBoardPosition(state, @intCast(pos));
            const char: []const u8 = switch (cell) {
                0 => if (engine.isRosette(@intCast(pos))) symbols.rosette else symbols.empty,
                1 => symbols.A,
                2 => symbols.B,
                else => unreachable,
            };
            try stdout.print("{s} ", .{char});
        }
        try stdout.print("{s}\n", .{symbols.border});
    }
    try stdout.print(" {s}\n", .{symbols.bottom_border});

    const player_a_off = engine.getOffBoardPieces(state, .A);
    const player_b_off = engine.getOffBoardPieces(state, .B);
    const player_a_completed = @as(u3, @truncate((state >> 6) & 0b111));
    const player_b_completed = @as(u3, @truncate((state >> 9) & 0b111));
    const roll = engine.getDiceRoll(state);

    try stdout.print("   {d}{s}{d} ", .{ player_a_off, symbols.arrow, player_a_completed });
    for (0..4) |i| {
        if (i < roll) {
            try stdout.print("{s}", .{symbols.dice_filled});
        } else {
            try stdout.print("{s}", .{symbols.dice_empty});
        }
    }
    try stdout.print(" {d}{s}{d}\n\n", .{ player_b_off, symbols.arrow, player_b_completed });

    for (moves, 1..) |move, i| {
        const from = getPositionName(move.from);
        const to = if (move.to == engine.BOARD_SIZE) "off" else getPositionName(move.to);

        try stdout.print("  {d: >2} {s: >3}{s}{s: <3}", .{ i, from, symbols.arrow, to });
        
        if (move.captured) |_| {
            try stdout.print(" capture", .{});
        }
        try stdout.print("\n", .{});
    }

    // try stdout.print("\nCurrent player: {s}\n", .{if (engine.getCurrentPlayer(state) == .A) "A" else "B"});
}

pub fn printMove(move: engine.Move) !void {
    const stdout = std.io.getStdOut().writer();
    const symbols = getSymbols();

    const from = getPositionName(move.from);
    const to = if (move.to == engine.BOARD_SIZE) "off" else getPositionName(move.to);

    try stdout.print("Move: {s: >3}{s}{s: <3}", .{ from, symbols.arrow, to });
    if (move.captured) |_| {
        try stdout.print(" capture", .{});
    }
    try stdout.print("\n", .{});
}

pub fn printWelcome() !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.print("\nWelcome to the Royal Game of Ur!\n", .{});
    try stdout.print("Press any key to start, or 'q' to quit.\n", .{});
}

pub fn printGameOver(winner: engine.Player) !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.print("\nGame over! Player {s} wins!\n", .{@tagName(winner)});
}

pub fn printNoMoves() !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.print("No legal moves. Passing turn.\n", .{});
}

pub fn clearScreen() !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.writeAll("\x1B[2J\x1B[H");
}

