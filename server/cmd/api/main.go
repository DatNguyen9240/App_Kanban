package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"kanban-server/internal/config"
	"kanban-server/internal/database"
	"kanban-server/internal/handlers"
	"kanban-server/internal/middleware"
	"kanban-server/internal/websocket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Database initialization
	db := database.InitDB(cfg)

	// 2. WebSocket Hub initialization
	hub := websocket.InitHub()

	// 3. Gin router initialization
	r := gin.Default()

	// CORS setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 4. Handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	boardHandler := handlers.NewBoardHandler(db, hub)
	cardHandler := handlers.NewCardHandler(db, hub)

	// 5. Routes
	api := r.Group("/api/v1")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":    "healthy",
				"timestamp": time.Now().Format(time.RFC3339),
			})
		})

		// Auth
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.Me)
		}

		// Workspaces & Projects
		api.GET("/workspaces", boardHandler.GetWorkspaces)
		api.POST("/projects", boardHandler.CreateProject)
		api.GET("/projects/:project_id/boards", boardHandler.GetBoards)

		// Boards & Columns
		api.GET("/boards/:id", boardHandler.GetBoardDetail)
		api.POST("/boards/:id/columns", boardHandler.CreateColumn)
		api.PATCH("/columns/:id", boardHandler.UpdateColumn)
		api.DELETE("/columns/:id", boardHandler.DeleteColumn)

		// Cards
		api.POST("/cards", cardHandler.CreateCard)
		api.PATCH("/cards/:id", cardHandler.UpdateCard)
		api.PATCH("/cards/:id/move", cardHandler.MoveCard)
		api.DELETE("/cards/:id", cardHandler.DeleteCard)
		api.POST("/cards/:id/comments", cardHandler.AddComment)
		api.POST("/cards/:id/checklists/items", cardHandler.AddChecklistItem)
		api.PATCH("/checklists/items/:item_id/toggle", cardHandler.ToggleChecklistItem)

		// WebSocket
		api.GET("/ws", boardHandler.HandleWebSocket)
	}

	// 6. Serve frontend static build if present (for single-container deploy / Railway)
	distDir := "./client/dist"
	if _, err := os.Stat(distDir); os.IsNotExist(err) {
		distDir = "./dist"
	}
	if _, err := os.Stat(distDir); err == nil {
		r.Static("/assets", distDir+"/assets")
		r.NoRoute(func(c *gin.Context) {
			if !strings.HasPrefix(c.Request.URL.Path, "/api") {
				c.File(distDir + "/index.html")
			} else {
				c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
			}
		})
	}

	log.Printf("🚀 Kanban Go Server running on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
