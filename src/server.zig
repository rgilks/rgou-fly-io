const std = @import("std");
const websocket = @import("websocket");
const engine = @import("engine.zig");
const ai = @import("ai.zig");
const view = @import("view.zig");

const Allocator = std.mem.Allocator;

const Conn = websocket.Conn;
const Message = websocket.Message;
const Handshake = websocket.Handshake;

pub const io_mode = .evented;

pub fn main() !void {
    var general_purpose_allocator = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = general_purpose_allocator.detectLeaks();

    const allocator = general_purpose_allocator.allocator();

    var context = Context{
        .allocator = allocator,
        .prng = std.rand.DefaultPrng.init(@as(u64, @intCast(std.time.milliTimestamp()))),
    };

    const config = websocket.Config.Server{
        .port = 9223,
        .address = "0.0.0.0",
        .handshake_timeout_ms = 3000,
        .handshake_pool_count = 10,
        .handshake_max_size = 4096,
        .buffer_size = 8192,
        .max_size = 20_000_000,
    };

    std.debug.print("Starting WebSocket server on port 9223...\n", .{});

    try websocket.listen(Handler, allocator, &context, config);
}

const Context = struct {
    allocator: Allocator,
    prng: std.rand.DefaultPrng,
};

const Handler = struct {
    conn: *Conn,
    context: *Context,
    game_state: engine.GameState,
    ai_player: ai.AIPlayer,

    pub fn init(_: Handshake, conn: *Conn, context: *Context) !Handler {
        const stdout = std.io.getStdOut().writer();
        try stdout.print("New connection\n", .{});

        return Handler{
            .conn = conn,
            .context = context,
            .game_state = undefined, // We'll initialize this when a new game is requested
            .ai_player = ai.AIPlayer.init(context.allocator),
        };
    }

    pub fn handle(self: *Handler, message: Message) !void {
        const stdout = std.io.getStdOut().writer();
        const data = message.data;

        switch (message.type) {
            .binary => try self.conn.writeBin(data),
            .text => {
                try stdout.print("msg: {s}\n", .{data});

                const parsed = try std.json.parseFromSlice(std.json.Value, self.context.allocator, data, .{});
                defer parsed.deinit();

                const msg_type = parsed.value.object.get("type") orelse return error.InvalidMessageType;

                if (std.mem.eql(u8, msg_type.string, "ping")) {
                    var pong_json = std.ArrayList(u8).init(self.context.allocator);
                    defer pong_json.deinit();

                    try std.json.stringify(.{
                        .type = "pong",
                    }, .{}, pong_json.writer());

                    try self.conn.writeText(pong_json.items);
                } else if (std.mem.eql(u8, msg_type.string, "new_game")) {
                    self.game_state = engine.initGame(&self.context.prng.random());
                    try self.sendGameState();
                    if (engine.getCurrentPlayer(self.game_state) == .B) {
                        try self.handleAITurn();
                    }
                } else if (std.mem.eql(u8, msg_type.string, "restore_game")) {
                    const saved_state = parsed.value.object.get("state") orelse return error.InvalidSavedState;
                    self.game_state = @intCast(saved_state.object.get("state").?.integer);
                    try self.sendGameState();
                    if (engine.getCurrentPlayer(self.game_state) == .B) {
                        try self.handleAITurn();
                    }
                } else if (std.mem.eql(u8, msg_type.string, "roll_dice")) {
                    if (engine.getCurrentPlayer(self.game_state) == .A) {
                        const roll = engine.rollDice(&self.context.prng);
                        engine.setDiceRoll(&self.game_state, roll);
                        try self.sendGameState();
                    }
                } else if (std.mem.eql(u8, msg_type.string, "make_move")) {
                    if (engine.getCurrentPlayer(self.game_state) == .A) {
                        const from = @as(u6, @intCast(parsed.value.object.get("from").?.integer));
                        const to = @as(u6, @intCast(parsed.value.object.get("to").?.integer));
                        const move = engine.Move{ .from = from, .to = to, .captured = null, .player = .A };
                        engine.makeMove(&self.game_state, move);
                        try self.sendGameState();
                        try self.handleAITurn();
                    }
                } else if (std.mem.eql(u8, msg_type.string, "end_turn")) {
                    if (engine.getCurrentPlayer(self.game_state) == .A) {
                        engine.setCurrentPlayer(&self.game_state, .B);
                        try self.sendGameState();
                        try self.handleAITurn();
                    }
                } else if (std.mem.eql(u8, msg_type.string, "ai_move")) {
                    try self.handleAITurn();
                }
            },
            .ping => try self.conn.writePong(""),
            .pong => {},
            .close => {
                try stdout.print("WebSocket connection closed\n", .{});
            },
        }
    }

    fn handleAITurn(self: *Handler) !void {
        while (engine.getCurrentPlayer(self.game_state) == .B and !engine.isGameOver(self.game_state)) {
            const ai_roll = engine.rollDice(&self.context.prng);
            engine.setDiceRoll(&self.game_state, ai_roll);
            try self.sendGameState();

            const ai_move = try self.ai_player.getBestMove(self.game_state);
            if (ai_move) |m| {
                engine.makeMove(&self.game_state, m);
                try self.sendGameState();
            } else {
                // No moves available, pass turn to player
                engine.setCurrentPlayer(&self.game_state, .A);
                try self.sendGameState();
                break;
            }

            // Check if the AI gets another turn
            if (engine.getCurrentPlayer(self.game_state) != .B) {
                break;
            }
        }
    }

    fn sendGameState(self: *Handler) !void {
        const moves = try engine.getPossibleMoves(self.game_state, self.context.allocator);
        defer moves.deinit();

        var game_state_json = std.ArrayList(u8).init(self.context.allocator);
        defer game_state_json.deinit();

        try std.json.stringify(.{
            .type = "game_state",
            .state = self.game_state,
            .current_player = @tagName(engine.getCurrentPlayer(self.game_state)),
            .dice_roll = engine.getDiceRoll(self.game_state),
            .moves = moves.items,
            .game_over = engine.isGameOver(self.game_state),
        }, .{}, game_state_json.writer());

        try view.printBoard(self.game_state, moves.items);
        const stdout = std.io.getStdOut().writer();
        try engine.printStateBinary(self.game_state, stdout);

        try self.conn.writeText(game_state_json.items);
    }

    pub fn close(self: *Handler) void {
        self.ai_player.deinit();
    }
};
