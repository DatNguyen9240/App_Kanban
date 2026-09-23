# ==========================================
# Stage 1: Build Frontend Client (Vite React)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend Server (Golang)
# ==========================================
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/server

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/kanban-server ./cmd/api

# ==========================================
# Stage 3: Minimal Production Image
# ==========================================
FROM alpine:3.19
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

# Copy backend binary
COPY --from=backend-builder /app/kanban-server /app/kanban-server

# Copy frontend production build
COPY --from=frontend-builder /app/client/dist /app/dist

# Default environment variables
ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080

CMD ["/app/kanban-server"]
