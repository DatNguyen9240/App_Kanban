FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o kanban-server ./cmd/api

FROM alpine:3.19
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /app/kanban-server /app/kanban-server

ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080

CMD ["/app/kanban-server"]
