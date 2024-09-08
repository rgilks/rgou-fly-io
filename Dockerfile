FROM alpine:latest AS builder

RUN apk add --no-cache zig

WORKDIR /app

COPY . .

RUN zig build

FROM nginx:alpine

COPY --from=builder /app/zig-out/bin/rgou_server /app/rgou_server

COPY nginx.conf /etc/nginx/nginx.conf
COPY public /app/public

EXPOSE 8080
EXPOSE 9223

CMD ["sh", "-c", "nginx && /app/rgou_server"]
