package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DBType      string // "postgres" or "sqlite"
	DatabaseURL string
	JWTSecret   string
	RedisAddr   string
}

func LoadConfig() *Config {
	_ = godotenv.Load() // Load .env if present

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		// Fallbacks used by various cloud database providers (Railway, Supabase, Neon)
		dbURL = strings.TrimSpace(os.Getenv("DATABASE_PUBLIC_URL"))
	}
	if dbURL == "" {
		dbURL = strings.TrimSpace(os.Getenv("POSTGRES_URL"))
	}

	dbType := strings.TrimSpace(strings.ToLower(os.Getenv("DB_TYPE")))

	if dbType == "" {
		if strings.HasPrefix(dbURL, "postgres://") || strings.HasPrefix(dbURL, "postgresql://") {
			dbType = "postgres"
		} else {
			dbType = "sqlite" // Default to local sqlite
		}
	}

	if dbURL == "" {
		if dbType == "postgres" {
			dbURL = "host=localhost user=kanban_user password=kanban_password dbname=kanban_db port=5432 sslmode=disable"
		} else {
			dbURL = "kanban.db"
		}
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-kanban-jwt-key-2026"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	return &Config{
		Port:        port,
		DBType:      dbType,
		DatabaseURL: dbURL,
		JWTSecret:   jwtSecret,
		RedisAddr:   redisAddr,
	}
}
