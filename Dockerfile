# Use the official Zig image as a builder
FROM ziglang/zig:latest as builder

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Build the project
RUN zig build

# Use a lightweight base image for the final container
FROM debian:buster-slim

# Set the working directory
WORKDIR /app

# Copy the built executable from the builder stage
COPY --from=builder /app/zig-out/bin/rgou_server .

# Copy the index.html file
COPY index.html .

# Expose the port the app runs on
EXPOSE 9223

# Run the server
CMD ["./rgou_server"]