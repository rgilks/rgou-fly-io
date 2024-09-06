const std = @import("std");
const engine = @import("engine.zig");
const ai = @import("ai.zig");

pub const SimulationResult = struct {
    player_a_wins: u32,
    player_b_wins: u32,
    draws: u32,
    total_moves: u64,
    player_a_first_wins: u32,
    player_b_first_wins: u32,
    player_a_first_count: u32,
    player_b_first_count: u32,

    pub fn toJson(self: *const SimulationResult, allocator: std.mem.Allocator) ![]const u8 {
        return std.fmt.allocPrint(allocator, "{{\"player_a_wins\": {}, \"player_b_wins\": {}, \"draws\": {}, \"total_moves\": {}, \"player_a_first_wins\": {}, \"player_b_first_wins\": {}, \"player_a_first_count\": {}, \"player_b_first_count\": {}}}", .{ self.player_a_wins, self.player_b_wins, self.draws, self.total_moves, self.player_a_first_wins, self.player_b_first_wins, self.player_a_first_count, self.player_b_first_count });
    }
};

pub const SimulationConfig = struct {
    num_games: u32,
    player_a_depth: u32,
    player_b_depth: u32,
    num_threads: u32,
};

fn simulateGames(result: *SimulationResult, config: SimulationConfig, games_per_thread: u32, thread_id: u32) !void {
    const allocator = std.heap.page_allocator;
    var player_a = ai.AIPlayer.init(allocator);
    var player_b = ai.AIPlayer.init(allocator);

    var prng = std.rand.DefaultPrng.init(@as(u64, @intCast(std.time.milliTimestamp())) + thread_id);
    const random = prng.random();

    var local_result = SimulationResult{
        .player_a_wins = 0,
        .player_b_wins = 0,
        .draws = 0,
        .total_moves = 0,
        .player_a_first_wins = 0,
        .player_b_first_wins = 0,
        .player_a_first_count = 0,
        .player_b_first_count = 0,
    };

    for (0..games_per_thread) |_| {
        var state = engine.initGame(&random);
        const first_player = engine.getCurrentPlayer(state);

        if (first_player == .A) {
            local_result.player_a_first_count += 1;
        } else {
            local_result.player_b_first_count += 1;
        }

        var moves: u32 = 0;

        while (!engine.isGameOver(state)) {
            const roll = engine.rollDice(&prng);
            engine.setDiceRoll(&state, roll);

            const current_player = engine.getCurrentPlayer(state);
            const depth = if (current_player == .A) config.player_a_depth else config.player_b_depth;

            const best_move = try (if (current_player == .A)
                player_a.getBestMoveWithDepth(state, depth)
            else
                player_b.getBestMoveWithDepth(state, depth));

            if (best_move) |move| {
                engine.makeMove(&state, move);
                moves += 1;
            } else {
                engine.setCurrentPlayer(&state, if (current_player == .A) .B else .A);
            }
        }

        local_result.total_moves += moves;

        const final_player = engine.getCurrentPlayer(state);
        if (final_player == .A) {
            local_result.player_b_wins += 1;
            if (first_player == .B) {
                local_result.player_b_first_wins += 1;
            }
        } else {
            local_result.player_a_wins += 1;
            if (first_player == .A) {
                local_result.player_a_first_wins += 1;
            }
        }
    }

    // Update the global result atomically
    _ = @atomicRmw(u32, &result.player_a_wins, .Add, local_result.player_a_wins, .seq_cst);
    _ = @atomicRmw(u32, &result.player_b_wins, .Add, local_result.player_b_wins, .seq_cst);
    _ = @atomicRmw(u32, &result.draws, .Add, local_result.draws, .seq_cst);
    _ = @atomicRmw(u64, &result.total_moves, .Add, local_result.total_moves, .seq_cst);
    _ = @atomicRmw(u32, &result.player_a_first_wins, .Add, local_result.player_a_first_wins, .seq_cst);
    _ = @atomicRmw(u32, &result.player_b_first_wins, .Add, local_result.player_b_first_wins, .seq_cst);
    _ = @atomicRmw(u32, &result.player_a_first_count, .Add, local_result.player_a_first_count, .seq_cst);
    _ = @atomicRmw(u32, &result.player_b_first_count, .Add, local_result.player_b_first_count, .seq_cst);

    std.debug.print("Thread {d}: A wins: {d}, B wins: {d}, Draws: {d}, Moves: {d}\n", .{
        thread_id,
        local_result.player_a_wins,
        local_result.player_b_wins,
        local_result.draws,
        local_result.total_moves,
    });
}

pub fn runSimulation(allocator: std.mem.Allocator, config: SimulationConfig) !SimulationResult {
    var result = SimulationResult{
        .player_a_wins = 0,
        .player_b_wins = 0,
        .draws = 0,
        .total_moves = 0,
        .player_a_first_wins = 0,
        .player_b_first_wins = 0,
        .player_a_first_count = 0,
        .player_b_first_count = 0,
    };

    // Start timing the simulation
    const start_time = std.time.milliTimestamp();

    const games_per_thread = @divTrunc(config.num_games, config.num_threads);
    const extra_games = config.num_games % config.num_threads;

    const threads = try allocator.alloc(std.Thread, config.num_threads);
    defer allocator.free(threads);

    for (threads, 0..) |*thread, i| {
        const thread_games = if (i < extra_games) games_per_thread + 1 else games_per_thread;
        thread.* = try std.Thread.spawn(.{}, simulateGames, .{ &result, config, thread_games, @as(u32, @intCast(i)) });
    }

    for (threads) |thread| {
        thread.join();
    }

    // End timing the simulation
    const end_time = std.time.milliTimestamp();
    const elapsed_time = end_time - start_time;

    // Print the elapsed time
    std.debug.print("Simulation completed in {d} milliseconds.\n", .{elapsed_time});

    return result;
}

pub fn printSimulationResult(result: SimulationResult, config: SimulationConfig) !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("\nSimulation Results:\n", .{});
    try stdout.print("-------------------\n", .{});
    try stdout.print("Games played: {d}\n", .{config.num_games});
    try stdout.print("Number of threads: {d}\n", .{config.num_threads});
    try stdout.print("Player A (depth {d}) wins: {d}\n", .{ config.player_a_depth, result.player_a_wins });
    try stdout.print("Player B (depth {d}) wins: {d}\n", .{ config.player_b_depth, result.player_b_wins });
    try stdout.print("Draws: {d}\n", .{result.draws});
    try stdout.print("Total moves: {d}\n", .{result.total_moves});
    try stdout.print("Average moves per game: {d:.2}\n", .{@as(f64, @floatFromInt(result.total_moves)) / @as(f64, @floatFromInt(config.num_games))});
    try stdout.print("\nFirst player statistics:\n", .{});
    try stdout.print("Player A went first: {d} times\n", .{result.player_a_first_count});
    try stdout.print("Player B went first: {d} times\n", .{result.player_b_first_count});
    try stdout.print("Player A wins when going first: {d}\n", .{result.player_a_first_wins});
    try stdout.print("Player B wins when going first: {d}\n", .{result.player_b_first_wins});

    const a_second_wins = result.player_a_wins - result.player_a_first_wins;
    const b_second_wins = result.player_b_wins - result.player_b_first_wins;
    try stdout.print("Player A wins when going second: {d}\n", .{a_second_wins});
    try stdout.print("Player B wins when going second: {d}\n", .{b_second_wins});

    const first_player_win_rate = @as(f64, @floatFromInt(result.player_a_first_wins + result.player_b_first_wins)) / @as(f64, @floatFromInt(config.num_games)) * 100.0;
    try stdout.print("First player win rate: {d:.2}%\n", .{first_player_win_rate});
}
