const std = @import("std");
const play = @import("play.zig");
const sim = @import("sim.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    if (args.len > 1 and std.mem.eql(u8, args[1], "sim")) {
        try runSimulation(allocator);
    } else {
        try play.run();
    }
}

fn runSimulation(allocator: std.mem.Allocator) !void {
    const config = sim.SimulationConfig{
        .num_games = 20,
        .player_a_depth = 1,
        .player_b_depth = 5,
        .num_threads = 8, 
    };

    std.debug.print("Running simulation...\n", .{});
    const result = try sim.runSimulation(allocator, config);
    try sim.printSimulationResult(result, config);
}