package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"kanban-server/internal/models"
	"kanban-server/internal/services"
	"kanban-server/internal/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CardHandler struct {
	db  *gorm.DB
	hub *websocket.Hub
}

func NewCardHandler(db *gorm.DB, hub *websocket.Hub) *CardHandler {
	return &CardHandler{db: db, hub: hub}
}

type CreateCardRequest struct {
	BoardID       string     `json:"board_id" binding:"required"`
	ColumnID      string     `json:"column_id" binding:"required"`
	Title         string     `json:"title" binding:"required"`
	Description   string     `json:"description"`
	Priority      string     `json:"priority"` // urgent, high, medium, low, none
	DueDate       *time.Time `json:"due_date"`
	CoverImageURL string     `json:"cover_image_url"`
}

func (h *CardHandler) CreateCard(c *gin.Context) {
	var req CreateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	userIDStr, _ := userID.(string)

	// Calculate position (append to bottom of column)
	var lastCard models.Card
	var pos float64 = 1000.0
	if err := h.db.Where("column_id = ?", req.ColumnID).Order("position desc").First(&lastCard).Error; err == nil {
		pos = lastCard.Position + services.InitialPositionStep
	}

	// Generate Issue Key (Count total cards on board)
	var totalCards int64
	h.db.Model(&models.Card{}).Where("board_id = ?", req.BoardID).Count(&totalCards)
	issueKey := fmt.Sprintf("ENG-%d", totalCards+100)

	priority := req.Priority
	if priority == "" {
		priority = "none"
	}

	card := models.Card{
		BoardID:       req.BoardID,
		ColumnID:      req.ColumnID,
		IssueKey:      issueKey,
		Title:         req.Title,
		Description:   req.Description,
		Position:      pos,
		Priority:      priority,
		DueDate:       req.DueDate,
		CoverImageURL: req.CoverImageURL,
		CreatorID:     userIDStr,
	}

	var defaultUser models.User
	if err := h.db.First(&defaultUser).Error; err == nil {
		card.Assignees = []models.User{defaultUser}
	}

	if err := h.db.Create(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Preload relations
	h.db.Preload("Assignees").Preload("Labels").Preload("Checklists.Items").First(&card, "id = ?", card.ID)

	// Broadcast
	h.hub.Broadcast(&websocket.WSEvent{
		Event:    "CARD_CREATED",
		BoardID:  card.BoardID,
		SenderID: userIDStr,
		Payload:  card,
	})

	c.JSON(http.StatusCreated, card)
}

type MoveCardRequest struct {
	TargetColumnID string  `json:"target_column_id" binding:"required"`
	PrevCardID     *string `json:"prev_card_id"`
	NextCardID     *string `json:"next_card_id"`
}

// MoveCard implements Fractional Indexing (Lexorank)
func (h *CardHandler) MoveCard(c *gin.Context) {
	cardID := c.Param("id")
	var req MoveCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var card models.Card
	if err := h.db.First(&card, "id = ?", cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	var prevPos *float64
	var nextPos *float64

	if req.PrevCardID != nil && *req.PrevCardID != "" {
		var prevCard models.Card
		if err := h.db.First(&prevCard, "id = ?", *req.PrevCardID).Error; err == nil {
			prevPos = &prevCard.Position
		}
	}

	if req.NextCardID != nil && *req.NextCardID != "" {
		var nextCard models.Card
		if err := h.db.First(&nextCard, "id = ?", *req.NextCardID).Error; err == nil {
			nextPos = &nextCard.Position
		}
	}

	newPosition := services.CalculatePosition(prevPos, nextPos)
	sourceColumnID := card.ColumnID

	card.ColumnID = req.TargetColumnID
	card.Position = newPosition

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	userIDStr, _ := userID.(string)

	// Broadcast CARD_MOVED
	h.hub.Broadcast(&websocket.WSEvent{
		Event:    "CARD_MOVED",
		BoardID:  card.BoardID,
		SenderID: userIDStr,
		Payload: gin.H{
			"card_id":          card.ID,
			"source_column_id": sourceColumnID,
			"target_column_id": card.ColumnID,
			"new_position":     newPosition,
		},
	})

	c.JSON(http.StatusOK, card)
}

type UpdateCardRequest struct {
	Title         *string    `json:"title"`
	Description   *string    `json:"description"`
	ColumnID      *string    `json:"column_id"`
	Priority      *string    `json:"priority"`
	DueDate       *time.Time `json:"due_date"`
	CoverImageURL *string    `json:"cover_image_url"`
}

func (h *CardHandler) UpdateCard(c *gin.Context) {
	cardID := c.Param("id")

	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	var req UpdateCardRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var rawMap map[string]interface{}
	_ = json.Unmarshal(bodyBytes, &rawMap)

	var card models.Card
	if err := h.db.Preload("Assignees").Preload("Labels").Preload("Checklists.Items").Preload("Comments.User").First(&card, "id = ?", cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	if req.Title != nil {
		card.Title = *req.Title
	}
	if req.Description != nil {
		card.Description = *req.Description
	}
	if req.Priority != nil {
		card.Priority = *req.Priority
	}
	if val, exists := rawMap["due_date"]; exists {
		if val == nil || val == "" {
			card.DueDate = nil
		} else if req.DueDate != nil {
			card.DueDate = req.DueDate
		}
	}
	if req.CoverImageURL != nil {
		card.CoverImageURL = *req.CoverImageURL
	}

	var columnChanged bool
	var oldColumnID string
	if req.ColumnID != nil && *req.ColumnID != "" && *req.ColumnID != card.ColumnID {
		oldColumnID = card.ColumnID
		var targetCol models.Column
		if err := h.db.First(&targetCol, "id = ? AND board_id = ?", *req.ColumnID, card.BoardID).Error; err == nil {
			card.ColumnID = *req.ColumnID
			columnChanged = true

			var lastCard models.Card
			if err := h.db.Where("column_id = ?", *req.ColumnID).Order("position desc").First(&lastCard).Error; err == nil {
				card.Position = lastCard.Position + 1000.0
			} else {
				card.Position = 1000.0
			}
		}
	}

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	userIDStr, _ := userID.(string)

	if columnChanged {
		h.hub.Broadcast(&websocket.WSEvent{
			Event:    "CARD_MOVED",
			BoardID:  card.BoardID,
			SenderID: userIDStr,
			Payload: gin.H{
				"card_id":          card.ID,
				"source_column_id": oldColumnID,
				"target_column_id": card.ColumnID,
				"new_position":     card.Position,
			},
		})
	}

	h.hub.Broadcast(&websocket.WSEvent{
		Event:    "CARD_UPDATED",
		BoardID:  card.BoardID,
		SenderID: userIDStr,
		Payload:  card,
	})

	c.JSON(http.StatusOK, card)
}

func (h *CardHandler) DeleteCard(c *gin.Context) {
	cardID := c.Param("id")
	var card models.Card
	if err := h.db.First(&card, "id = ?", cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	boardID := card.BoardID
	columnID := card.ColumnID

	if err := h.db.Delete(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	userIDStr, _ := userID.(string)

	h.hub.Broadcast(&websocket.WSEvent{
		Event:    "CARD_DELETED",
		BoardID:  boardID,
		SenderID: userIDStr,
		Payload: gin.H{
			"card_id":   cardID,
			"column_id": columnID,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Card deleted successfully"})
}

type AddCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

func (h *CardHandler) AddComment(c *gin.Context) {
	cardID := c.Param("id")
	var req AddCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var card models.Card
	if err := h.db.First(&card, "id = ?", cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	userID, _ := c.Get("userID")
	userIDStr, _ := userID.(string)
	if userIDStr == "" {
		// Fallback to first user for demo
		var u models.User
		if err := h.db.First(&u).Error; err == nil {
			userIDStr = u.ID
		}
	}

	comment := models.Comment{
		CardID:  cardID,
		UserID:  userIDStr,
		Content: req.Content,
	}

	if err := h.db.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.db.Preload("User").First(&comment, "id = ?", comment.ID)

	h.hub.Broadcast(&websocket.WSEvent{
		Event:    "COMMENT_ADDED",
		BoardID:  card.BoardID,
		SenderID: userIDStr,
		Payload:  comment,
	})

	c.JSON(http.StatusCreated, comment)
}

// ToggleChecklistItem toggles is_done on a checklist item
func (h *CardHandler) ToggleChecklistItem(c *gin.Context) {
	itemID := c.Param("item_id")
	var item models.ChecklistItem
	if err := h.db.First(&item, "id = ?", itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Checklist item not found"})
		return
	}

	item.IsDone = !item.IsDone
	if err := h.db.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var cl models.Checklist
	if err := h.db.First(&cl, "id = ?", item.ChecklistID).Error; err == nil {
		var card models.Card
		if err := h.db.First(&card, "id = ?", cl.CardID).Error; err == nil {
			h.hub.Broadcast(&websocket.WSEvent{
				Event:   "CHECKLIST_UPDATED",
				BoardID: card.BoardID,
				Payload: item,
			})
		}
	}

	c.JSON(http.StatusOK, item)
}

// AddChecklistItem adds a new item to a card's checklist
type AddChecklistItemRequest struct {
	Content string `json:"content" binding:"required"`
}

func (h *CardHandler) AddChecklistItem(c *gin.Context) {
	cardID := c.Param("id")
	var req AddChecklistItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cl models.Checklist
	if err := h.db.Where("card_id = ?", cardID).First(&cl).Error; err != nil {
		cl = models.Checklist{
			CardID: cardID,
			Title:  "Checklist",
		}
		if err := h.db.Create(&cl).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	var lastItem models.ChecklistItem
	var pos float64 = 1000.0
	if err := h.db.Where("checklist_id = ?", cl.ID).Order("position desc").First(&lastItem).Error; err == nil {
		pos = lastItem.Position + 1000.0
	}

	item := models.ChecklistItem{
		ChecklistID: cl.ID,
		Content:     req.Content,
		IsDone:      false,
		Position:    pos,
	}

	if err := h.db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var card models.Card
	if err := h.db.First(&card, "id = ?", cardID).Error; err == nil {
		h.hub.Broadcast(&websocket.WSEvent{
			Event:   "CHECKLIST_UPDATED",
			BoardID: card.BoardID,
			Payload: item,
		})
	}

	c.JSON(http.StatusCreated, item)
}
