FROM alpine:latest AS builder

RUN apk add --no-cache zig

WORKDIR /app
COPY . .
RUN zig build -Doptimize=ReleaseFast

FROM scratch

WORKDIR /app
COPY --from=builder /app/zig-out/bin/rgou_server /app/

EXPOSE 9223

CMD ["/app/rgou_server"]
