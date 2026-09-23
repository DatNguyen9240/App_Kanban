package handlers

import (
	"net/http"

	"kanban-server/internal/models"
	"kanban-server/internal/services"
	"kanban-server/internal/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BoardHandler struct {
	db  *gorm.DB
	hub *websocket.Hub
}

func NewBoardHandler(db *gorm.DB, hub *websocket.Hub) *BoardHandler {
	return &BoardHandler{db: db, hub: hub}
}

// GetWorkspaces returns all workspaces with nested projects and boards
func (h *BoardHandler) GetWorkspaces(c *gin.Context) {
	var workspaces []models.Workspace
	if err := h.db.Preload("Projects.Boards").Find(&workspaces).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, workspaces)
}

// GetBoards returns all boards in a project
func (h *BoardHandler) GetBoards(c *gin.Context) {
	projectID := c.Param("project_id")
	var boards []models.Board
	if err := h.db.Where("project_id = ?", projectID).Find(&boards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, boards)
}

// GetBoardDetail loads complete board with columns and cards
func (h *BoardHandler) GetBoardDetail(c *gin.Context) {
	boardID := c.Param("id")

	var board models.Board
	err := h.db.
		Preload("Columns", func(db *gorm.DB) *gorm.DB {
			return db.Order("columns.position asc")
		}).
		Preload("Columns.Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("cards.position asc")
		}).
		Preload("Columns.Cards.Assignees").
		Preload("Columns.Cards.Labels").
		Preload("Columns.Cards.Checklists.Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("checklist_items.position asc")
		}).
		Preload("Columns.Cards.Comments.User").
		First(&board, "id = ?", boardID).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	c.JSON(http.StatusOK, board)
}

// CreateColumn creates a new column in board
type CreateColumnRequest struct {
	Name  string `json:"name" binding:"required"`
	Color string `json:"color"`
}

func (h *BoardHandler) CreateColumn(c *gin.Context) {
	boardID := c.Param("id")
	var req CreateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find the last column position
	var lastCol models.Column
	var pos float64 = 1000
	if err := h.db.Where("board_id = ?", boardID).Order("position desc").First(&lastCol).Error; err == nil {
		pos = lastCol.Position + services.InitialPositionStep
	}

	col := models.Column{
		BoardID:  boardID,
		Name:     req.Name,
		Color:    req.Color,
		Position: pos,
	}

	if err := h.db.Create(&col).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast
	h.hub.Broadcast(&websocket.WSEvent{
		Event:   "COLUMN_CREATED",
		BoardID: boardID,
		Payload: col,
	})

	c.JSON(http.StatusCreated, col)
}

// UpdateColumn updates column name or color
type UpdateColumnRequest struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
}

func (h *BoardHandler) UpdateColumn(c *gin.Context) {
	columnID := c.Param("id")
	var req UpdateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var col models.Column
	if err := h.db.First(&col, "id = ?", columnID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Column not found"})
		return
	}

	if req.Name != nil {
		col.Name = *req.Name
	}
	if req.Color != nil {
		col.Color = *req.Color
	}

	if err := h.db.Save(&col).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.hub.Broadcast(&websocket.WSEvent{
		Event:   "COLUMN_UPDATED",
		BoardID: col.BoardID,
		Payload: col,
	})

	c.JSON(http.StatusOK, col)
}

// DeleteColumn deletes a column and its cards
func (h *BoardHandler) DeleteColumn(c *gin.Context) {
	columnID := c.Param("id")
	var col models.Column
	if err := h.db.First(&col, "id = ?", columnID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Column not found"})
		return
	}

	boardID := col.BoardID

	// Delete cards inside column
	h.db.Where("column_id = ?", columnID).Delete(&models.Card{})
	if err := h.db.Delete(&col).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.hub.Broadcast(&websocket.WSEvent{
		Event:   "COLUMN_DELETED",
		BoardID: boardID,
		Payload: gin.H{"column_id": columnID},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Column deleted successfully"})
}

// CreateProject creates a new project under workspace
type CreateProjectRequest struct {
	WorkspaceID string `json:"workspace_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Key         string `json:"key" binding:"required"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

func (h *BoardHandler) CreateProject(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	color := req.Color
	if color == "" {
		color = "#6366F1"
	}

	project := models.Project{
		WorkspaceID: req.WorkspaceID,
		Name:        req.Name,
		Key:         req.Key,
		Description: req.Description,
		Icon:        "FolderGit2",
		Color:       color,
	}

	if err := h.db.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create default Sprint Board for the project
	board := models.Board{
		ProjectID:          project.ID,
		Name:               "Sprint Board",
		BackgroundGradient: "from-slate-50 to-slate-100",
	}
	h.db.Create(&board)

	// Create default columns
	cols := []models.Column{
		{BoardID: board.ID, Name: "Backlog", Color: "#94A3B8", Position: 1000},
		{BoardID: board.ID, Name: "Todo", Color: "#3B82F6", Position: 2000},
		{BoardID: board.ID, Name: "In Progress", Color: "#F59E0B", Position: 3000},
		{BoardID: board.ID, Name: "Done", Color: "#10B981", Position: 4000},
	}
	for _, col := range cols {
		h.db.Create(&col)
	}

	c.JSON(http.StatusCreated, project)
}

// DeleteProject deletes a project
func (h *BoardHandler) DeleteProject(c *gin.Context) {
	projectID := c.Param("id")
	if err := h.db.Delete(&models.Project{}, "id = ?", projectID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// HandleWebSocket upgrades connection and joins board room
func (h *BoardHandler) HandleWebSocket(c *gin.Context) {
	boardID := c.Query("board_id")
	if boardID == "" {
		boardID = c.Param("id")
	}
	if boardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "board_id required"})
		return
	}

	userID, _ := c.Get("userID")
	userIDStr, _ := userID.(string)

	websocket.ServeWs(h.hub, c.Writer, c.Request, boardID, userIDStr)
}
