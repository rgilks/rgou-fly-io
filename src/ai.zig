const std = @import("std");
const engine = @import("engine.zig");

const DEFAULT_DEPTH = 1;
const INFINITY: i32 = 1000000;

const CacheEntry = struct {
    score: i32,
    best_move: ?engine.Move,
};

pub const AIPlayer = struct {
    allocator: std.mem.Allocator,
    debug_enabled: bool = false,
    cache: std.AutoHashMap(u64, CacheEntry),

    pub fn init(allocator: std.mem.Allocator) AIPlayer {
        return AIPlayer{
            .allocator = allocator,
            .cache = std.AutoHashMap(u64, CacheEntry).init(allocator),
        };
    }

    pub fn deinit(self: *AIPlayer) void {
        self.cache.deinit();
    }

    pub fn getBestMove(self: *AIPlayer, state: engine.GameState) !?engine.Move {
        return self.getBestMoveWithDepth(state, DEFAULT_DEPTH);
    }

    pub fn getBestMoveWithDepth(self: *AIPlayer, state: engine.GameState, max_depth: u32) !?engine.Move {
        var best_move: ?engine.Move = null;
        var best_score: i32 = -INFINITY;

        for (1..max_depth + 1) |depth| {
            const result = try self.minimax(state, @intCast(depth), -INFINITY, INFINITY, true);

            if (result.score > best_score) {
                best_score = result.score;
                best_move = result.best_move;
            }

            if (self.debug_enabled) {
                std.debug.print("Depth {}: Best move: {} -> {}, Score: {}\n", .{ depth, if (result.best_move) |move| move.from else 0, if (result.best_move) |move| move.to else 0, result.score });
            }

            // If we've found a winning move, no need to search deeper
            if (best_score >= INFINITY - 1) {
                break;
            }
        }

        return best_move;
    }

    fn getAdaptiveDepth(self: *AIPlayer, state: engine.GameState, base_depth: u32) u32 {
        const pieces_left = @as(i32, engine.getOffBoardPieces(state, .A)) + @as(i32, engine.getOffBoardPieces(state, .B));
        const depth = @max(1, @min(base_depth, base_depth + @as(u32, @intCast(@max(0, 14 - pieces_left)))));

        if (self.debug_enabled) {
            std.debug.print("Adaptive depth: {} (base: {}, pieces left: {})\n", .{ depth, base_depth, pieces_left });
        }

        return depth;
    }

    fn minimax(self: *AIPlayer, state: engine.GameState, depth: u32, alpha: i32, beta: i32, is_maximizing: bool) !struct { score: i32, best_move: ?engine.Move } {
        const cache_key = self.getCacheKey(state, depth, is_maximizing);
        if (self.cache.get(cache_key)) |entry| {
            return .{ .score = entry.score, .best_move = entry.best_move };
        }

        if (depth == 0 or engine.isGameOver(state)) {
            const score = self.evaluateState(state);
            try self.cache.put(cache_key, .{ .score = score, .best_move = null });
            return .{ .score = score, .best_move = null };
        }

        var moves = try engine.getPossibleMoves(state, self.allocator);
        defer moves.deinit();

        if (moves.items.len == 0) {
            var total_score: i32 = 0;
            for (0..5) |roll| {
                var new_state = state;
                engine.setDiceRoll(&new_state, @intCast(roll));
                const score = (try self.minimax(new_state, depth - 1, alpha, beta, !is_maximizing)).score;
                total_score += @divTrunc(score * getDiceRollProbability(roll), 16);
            }
            const avg_score = @divTrunc(total_score, 5);
            try self.cache.put(cache_key, .{ .score = avg_score, .best_move = null });
            return .{ .score = avg_score, .best_move = null };
        }

        try self.orderMoves(&moves, state);

        var best_score: i32 = if (is_maximizing) -INFINITY else INFINITY;
        var best_move: ?engine.Move = null;
        var current_alpha = alpha;
        var current_beta = beta;

        for (moves.items) |move| {
            var total_score: i32 = 0;
            for (0..5) |roll| {
                var new_state = state;
                engine.makeMove(&new_state, move);
                engine.setDiceRoll(&new_state, @intCast(roll));
                const score = (try self.minimax(new_state, depth - 1, current_alpha, current_beta, !is_maximizing)).score;
                total_score += @divTrunc(score * getDiceRollProbability(roll), 16);
            }
            const avg_score = @divTrunc(total_score, 5);

            if (is_maximizing) {
                if (avg_score > best_score) {
                    best_score = avg_score;
                    best_move = move;
                }
                current_alpha = @max(current_alpha, best_score);
            } else {
                if (avg_score < best_score) {
                    best_score = avg_score;
                    best_move = move;
                }
                current_beta = @min(current_beta, best_score);
            }

            if (current_beta <= current_alpha) {
                break;
            }
        }

        try self.cache.put(cache_key, .{ .score = best_score, .best_move = best_move });
        return .{ .score = best_score, .best_move = best_move };
    }

    fn orderMoves(self: *AIPlayer, moves: *std.ArrayList(engine.Move), state: engine.GameState) !void {
        _ = self;
        std.mem.sort(engine.Move, moves.items, state, compareMoves);
    }

    fn compareMoves(state: engine.GameState, a: engine.Move, b: engine.Move) bool {
        const player = engine.getCurrentPlayer(state);
        const a_score = scoreMoveHeuristic(a, player);
        const b_score = scoreMoveHeuristic(b, player);
        return a_score > b_score;
    }

    fn scoreMoveHeuristic(move: engine.Move, player: engine.Player) i32 {
        var score: i32 = 0;

        // Prioritize moves that land on rosettes
        if (engine.isRosette(move.to)) {
            score += 100;
        }

        // Prioritize captures
        if (move.captured != null) {
            score += 75;
        }

        // Prioritize moving pieces off the board
        if (move.to == engine.BOARD_SIZE) {
            score += 50;
        }

        // Slightly prioritize forward movement, but not as much as before
        const path = engine.getPlayerPath(player);
        const from_index = std.mem.indexOfScalar(u6, &path, move.from) orelse 0;
        const to_index = std.mem.indexOfScalar(u6, &path, move.to) orelse path.len;
        score += @as(i32, @intCast(to_index)) - @as(i32, @intCast(from_index));

        // Slightly deprioritize moves that put pieces in danger
        if (isMoveSafe(move, player)) {
            score += 25;
        }

        return score;
    }

    fn isMoveSafe(move: engine.Move, player: engine.Player) bool {
        const opponent = if (player == .A) engine.Player.B else engine.Player.A;
        const opponent_path = engine.getPlayerPath(opponent);

        // Check if the destination is in the opponent's next 4 moves
        for (opponent_path, 0..) |pos, i| {
            if (pos == move.to and i < 4) {
                return false;
            }
        }

        return true;
    }

    fn getCacheKey(self: *AIPlayer, state: engine.GameState, depth: u32, is_maximizing: bool) u64 {
        _ = self;
        return state ^ @as(u64, depth) << 32 ^ @as(u64, @intFromBool(is_maximizing)) << 63;
    }

    fn evaluateState(self: *AIPlayer, state: engine.GameState) i32 {
        _ = self;
        const current_player = engine.getCurrentPlayer(state);
        const opponent = if (current_player == .A) engine.Player.B else engine.Player.A;

        const player_score = scorePlayer(state, current_player);
        const opponent_score = scorePlayer(state, opponent);

        return player_score - opponent_score;
    }
};

fn getDiceRollProbability(roll: usize) i32 {
    return switch (roll) {
        0 => 1,
        1 => 4,
        2 => 6,
        3 => 4,
        4 => 1,
        else => unreachable,
    };
}

fn scorePlayer(state: engine.GameState, player: engine.Player) i32 {
    const completed = @as(i32, engine.getCompletedPieces(state, player));
    const off_board = @as(i32, engine.getOffBoardPieces(state, player));
    const on_board = 7 - completed - off_board;
    const rosettes = countPlayerRosettes(state, player);
    const pieces_ready_to_exit = countPiecesReadyToExit(state, player);
    const advanced_pieces = countAdvancedPieces(state, player);

    return completed * 100 +
        on_board * 10 +
        rosettes * 15 +
        pieces_ready_to_exit * 50 +
        off_board * 5 +
        advanced_pieces * 20;
}

fn countPlayerRosettes(state: engine.GameState, player: engine.Player) i32 {
    var count: i32 = 0;
    for (0..engine.BOARD_SIZE) |pos| {
        if (engine.isRosette(@intCast(pos)) and engine.getBoardPosition(state, @intCast(pos)) == @as(u2, @intFromEnum(player)) + 1) {
            count += 1;
        }
    }
    return count;
}

fn countPiecesReadyToExit(state: engine.GameState, player: engine.Player) i32 {
    const path = engine.getPlayerPath(player);
    const last_square = path[path.len - 1];
    return if (engine.getBoardPosition(state, last_square) == @as(u2, @intFromEnum(player)) + 1) 1 else 0;
}

fn countAdvancedPieces(state: engine.GameState, player: engine.Player) i32 {
    var count: i32 = 0;
    const path = engine.getPlayerPath(player);
    for (path[path.len / 2 ..], 0..) |pos, i| {
        if (engine.getBoardPosition(state, pos) == @as(u2, @intFromEnum(player)) + 1) {
            count += @intCast(i + 1);
        }
    }
    return count;
}
