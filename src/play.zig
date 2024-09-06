const std = @import("std");
const engine = @import("engine.zig");
const view = @import("view.zig");
const ai = @import("ai.zig");

pub fn run() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var prng = std.rand.DefaultPrng.init(@as(u64, @intCast(std.time.milliTimestamp())));
    const random = prng.random();

    try view.printWelcome();
    const start_input = try readSingleChar();
    if (start_input == 'q') return;

    var state = engine.initGame(&random);
    var ai_player = ai.AIPlayer.init(allocator);
    defer ai_player.deinit();

    const stdout = std.io.getStdOut().writer();

    try stdout.print("Starting player: {s}\n", .{@tagName(engine.getCurrentPlayer(state))});
    try stdout.print("Press any key to continue...\n", .{});
    _ = try readSingleChar();

    game_loop: while (!engine.isGameOver(state)) {
        try view.clearScreen();

        const roll = engine.rollDice(&prng);
        engine.setDiceRoll(&state, roll);

        const moves = try engine.getPossibleMoves(state, allocator);
        defer moves.deinit();

        try view.printBoard(state, moves.items);

        if (moves.items.len == 0) {
            try view.printNoMoves();
            engine.setCurrentPlayer(&state, if (engine.getCurrentPlayer(state) == .A) .B else .A);
            try stdout.print("Press any key to continue...\n", .{});
            _ = try readSingleChar();
            continue :game_loop;
        }

        const selected_move = if (engine.getCurrentPlayer(state) == .A)
            try getUserMove(moves.items)
        else
            try getAIMove(&ai_player, state);

        if (selected_move) |move| {
            engine.makeMove(&state, move);
            try view.printMove(move);
            
            // Add a small delay after AI moves
            if (engine.getCurrentPlayer(state) == .A) {
                try stdout.print("Press any key to continue...\n", .{});
                _ = try readSingleChar();
            }
        } else {
            break :game_loop;
        }
    }

    try view.printGameOver(engine.getCurrentPlayer(state));
}

fn readSingleChar() !u8 {
    const stdin = std.io.getStdIn().reader();
    var buf: [1]u8 = undefined;
    _ = try stdin.read(&buf);
    return buf[0];
}

fn getUserMove(moves: []const engine.Move) !?engine.Move {
    const stdout = std.io.getStdOut().writer();
    try stdout.print("\n   ", .{});

    while (true) {
        const input = try readSingleChar();
        if (input == 'q') return null;

        const choice = std.fmt.parseInt(usize, &[_]u8{input}, 10) catch null;
        if (choice) |c| {
            if (c > 0 and c <= moves.len) {
                return moves[c - 1];
            }
        }

        try stdout.print("Invalid input. Please enter a number between 1 and {d} or 'q' to quit: ", .{moves.len});
    }
}

fn getAIMove(ai_player: *ai.AIPlayer, state: engine.GameState) !?engine.Move {
    return ai_player.getBestMove(state);
}
