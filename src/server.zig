const std = @import("std");
const websocket = @import("websocket");
const engine = @import("engine.zig");
const ai = @import("ai.zig");

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
        .handshake_max_size = 1024,
        .buffer_size = 8192,
        .max_size = 20_000_000,
    };

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
        return Handler{
            .conn = conn,
            .context = context,
            .game_state = engine.initGame(&context.prng.random()),
            .ai_player = ai.AIPlayer.init(context.allocator),
        };
    }

    pub fn handle(self: *Handler, message: Message) !void {
        const data = message.data;

        switch (message.type) {
            .binary => try self.conn.writeBin(data),
            .text => {
                const stdout = std.io.getStdOut().writer();
                try stdout.print("Processing message...\n", .{});

                const parsed = try std.json.parseFromSlice(std.json.Value, self.context.allocator, data, .{});
                defer parsed.deinit();

                const msg_type = parsed.value.object.get("type") orelse return error.InvalidMessageType;

                if (std.mem.eql(u8, msg_type.string, "new_game")) {
                    self.game_state = engine.initGame(&self.context.prng.random());
                    try self.sendGameState();
                } else if (std.mem.eql(u8, msg_type.string, "make_move")) {
                    const from = @as(u6, @intCast(parsed.value.object.get("from").?.integer));
                    const to = @as(u6, @intCast(parsed.value.object.get("to").?.integer));
                    const move = engine.Move{ .from = from, .to = to, .captured = null, .player = engine.getCurrentPlayer(self.game_state) };
                    engine.makeMove(&self.game_state, move);
                    try self.sendGameState();

                    // AI's turn
                    if (!engine.isGameOver(self.game_state)) {
                        const ai_move = try self.ai_player.getBestMove(self.game_state);
                        if (ai_move) |m| {
                            engine.makeMove(&self.game_state, m);
                            try self.sendGameState();
                        }
                    }
                }
            },
            else => unreachable,
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
        }, .{}, game_state_json.writer());

        try self.conn.writeText(game_state_json.items);
    }

    pub fn close(self: *Handler) void {
        self.ai_player.deinit();
    }
};
