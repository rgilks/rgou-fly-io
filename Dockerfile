FROM alpine:latest AS builder

RUN apk add --no-cache zig

WORKDIR /app
COPY . .
RUN zig build -Doptimize=ReleaseFast

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/zig-out/bin/rgou_server .
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./public /app/public/

EXPOSE 80

CMD service nginx start && ./rgou_server
