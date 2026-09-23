package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"kanban-server/internal/config"
	"kanban-server/internal/database"
	"kanban-server/internal/middleware"
	"kanban-server/internal/models"
	"kanban-server/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter() (*gin.Engine, *config.Config) {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		Port:        "8081",
		DBType:      "sqlite",
		DatabaseURL: "file::memory:?cache=shared", // in-memory SQLite for test isolation
		JWTSecret:   "test-secret",
	}

	db := database.InitDB(cfg)
	hub := websocket.InitHub()

	r := gin.New()
	r.Use(gin.Recovery())

	authHandler := NewAuthHandler(db, cfg)
	boardHandler := NewBoardHandler(db, hub)
	cardHandler := NewCardHandler(db, hub)

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "healthy"})
		})
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/auth/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.Me)

		api.GET("/workspaces", boardHandler.GetWorkspaces)
		api.POST("/projects", boardHandler.CreateProject)
		api.GET("/projects/:project_id/boards", boardHandler.GetBoards)

		api.GET("/boards/:id", boardHandler.GetBoardDetail)
		api.POST("/boards/:id/columns", boardHandler.CreateColumn)
		api.PATCH("/columns/:id", boardHandler.UpdateColumn)
		api.DELETE("/columns/:id", boardHandler.DeleteColumn)

		api.POST("/cards", cardHandler.CreateCard)
		api.PATCH("/cards/:id", cardHandler.UpdateCard)
		api.PATCH("/cards/:id/move", cardHandler.MoveCard)
		api.DELETE("/cards/:id", cardHandler.DeleteCard)
		api.POST("/cards/:id/comments", cardHandler.AddComment)
		api.POST("/cards/:id/checklists/items", cardHandler.AddChecklistItem)
		api.PATCH("/checklists/items/:item_id/toggle", cardHandler.ToggleChecklistItem)
	}

	return r, cfg
}

func TestHealthCheck(t *testing.T) {
	r, _ := setupTestRouter()

	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "healthy", resp["status"])
}

func TestAuthFlow(t *testing.T) {
	r, _ := setupTestRouter()

	// 1. Register
	regPayload := map[string]string{
		"email":     "tester@kanban.dev",
		"password":  "password123",
		"full_name": "Test Runner",
	}
	body, _ := json.Marshal(regPayload)
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var regResp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &regResp)
	token, ok := regResp["token"].(string)
	assert.True(t, ok)
	assert.NotEmpty(t, token)

	// 2. Login
	loginPayload := map[string]string{
		"email":    "tester@kanban.dev",
		"password": "password123",
	}
	body, _ = json.Marshal(loginPayload)
	req, _ = http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// 3. Me (Protected route)
	req, _ = http.NewRequest("GET", "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestWorkspacesAndBoardsFlow(t *testing.T) {
	r, _ := setupTestRouter()

	// 1. Get Workspaces (Seeded demo data)
	req, _ := http.NewRequest("GET", "/api/v1/workspaces", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var workspaces []models.Workspace
	_ = json.Unmarshal(w.Body.Bytes(), &workspaces)
	assert.NotEmpty(t, workspaces)

	workspaceID := workspaces[0].ID
	assert.NotEmpty(t, workspaces[0].Projects)
	boardID := workspaces[0].Projects[0].Boards[0].ID

	// 2. Get Board Detail
	req, _ = http.NewRequest("GET", "/api/v1/boards/"+boardID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var board models.Board
	_ = json.Unmarshal(w.Body.Bytes(), &board)
	assert.Equal(t, boardID, board.ID)
	assert.NotEmpty(t, board.Columns)

	// 3. Create Column
	colPayload := map[string]string{
		"name":  "QA Testing",
		"color": "#EC4899",
	}
	body, _ := json.Marshal(colPayload)
	req, _ = http.NewRequest("POST", "/api/v1/boards/"+boardID+"/columns", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var newCol models.Column
	_ = json.Unmarshal(w.Body.Bytes(), &newCol)
	assert.Equal(t, "QA Testing", newCol.Name)

	// 4. Update Column
	updateColPayload := map[string]string{
		"name": "QA Completed",
	}
	body, _ = json.Marshal(updateColPayload)
	req, _ = http.NewRequest("PATCH", "/api/v1/columns/"+newCol.ID, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// 5. Create Project
	projPayload := map[string]string{
		"workspace_id": workspaceID,
		"name":         "Mobile App 2026",
		"key":          "MOB",
		"description":  "React Native & Go client",
	}
	body, _ = json.Marshal(projPayload)
	req, _ = http.NewRequest("POST", "/api/v1/projects", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCardCRUDAndFractionalIndexing(t *testing.T) {
	r, _ := setupTestRouter()

	// Retrieve initial board & column
	req, _ := http.NewRequest("GET", "/api/v1/workspaces", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var workspaces []models.Workspace
	_ = json.Unmarshal(w.Body.Bytes(), &workspaces)
	boardID := workspaces[0].Projects[0].Boards[0].ID

	req, _ = http.NewRequest("GET", "/api/v1/boards/"+boardID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var board models.Board
	_ = json.Unmarshal(w.Body.Bytes(), &board)

	col1ID := board.Columns[0].ID
	col2ID := board.Columns[1].ID

	// 1. Create Card
	createCardPayload := map[string]string{
		"board_id":    boardID,
		"column_id":   col1ID,
		"title":       "Write comprehensive unit test suite",
		"description": "Ensure 100% test coverage for API handlers",
		"priority":    "high",
	}
	body, _ := json.Marshal(createCardPayload)
	req, _ = http.NewRequest("POST", "/api/v1/cards", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var createdCard models.Card
	_ = json.Unmarshal(w.Body.Bytes(), &createdCard)
	assert.Equal(t, "Write comprehensive unit test suite", createdCard.Title)
	assert.Equal(t, "high", createdCard.Priority)

	// 2. Move Card (Fractional Indexing)
	movePayload := map[string]interface{}{
		"target_column_id": col2ID,
	}
	body, _ = json.Marshal(movePayload)
	req, _ = http.NewRequest("PATCH", "/api/v1/cards/"+createdCard.ID+"/move", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var movedCard models.Card
	_ = json.Unmarshal(w.Body.Bytes(), &movedCard)
	assert.Equal(t, col2ID, movedCard.ColumnID)

	// 3. Update Card Title & Priority
	newTitle := "Updated: Write comprehensive unit test suite"
	updatePayload := map[string]string{
		"title":    newTitle,
		"priority": "urgent",
	}
	body, _ = json.Marshal(updatePayload)
	req, _ = http.NewRequest("PATCH", "/api/v1/cards/"+createdCard.ID, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var updatedCard models.Card
	_ = json.Unmarshal(w.Body.Bytes(), &updatedCard)
	assert.Equal(t, newTitle, updatedCard.Title)
	assert.Equal(t, "urgent", updatedCard.Priority)

	// 4. Add Comment
	commentPayload := map[string]string{
		"content": "All tests are passing with flying colors!",
	}
	body, _ = json.Marshal(commentPayload)
	req, _ = http.NewRequest("POST", "/api/v1/cards/"+createdCard.ID+"/comments", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// 5. Add Checklist Item
	checkPayload := map[string]string{
		"content": "Automated regression testing",
	}
	body, _ = json.Marshal(checkPayload)
	req, _ = http.NewRequest("POST", "/api/v1/cards/"+createdCard.ID+"/checklists/items", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
	var chkItem models.ChecklistItem
	_ = json.Unmarshal(w.Body.Bytes(), &chkItem)

	// 6. Toggle Checklist Item
	req, _ = http.NewRequest("PATCH", "/api/v1/checklists/items/"+chkItem.ID+"/toggle", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
	var toggledItem models.ChecklistItem
	_ = json.Unmarshal(w.Body.Bytes(), &toggledItem)
	assert.True(t, toggledItem.IsDone)

	// 7. Delete Card
	req, _ = http.NewRequest("DELETE", "/api/v1/cards/"+createdCard.ID, nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}
