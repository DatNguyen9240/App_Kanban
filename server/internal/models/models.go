package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Base model using UUID
type BaseModel struct {
	ID        string         `gorm:"primaryKey;size:36" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}

// User model
type User struct {
	BaseModel
	Email        string `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`
	FullName     string `gorm:"size:255" json:"full_name"`
	AvatarURL    string `gorm:"size:512" json:"avatar_url"`
}

// Workspace model
type Workspace struct {
	BaseModel
	Name    string            `gorm:"size:255;not null" json:"name"`
	Slug    string            `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	OwnerID string            `gorm:"size:36;not null" json:"owner_id"`
	Members []WorkspaceMember `gorm:"foreignKey:WorkspaceID" json:"members,omitempty"`
	Projects []Project        `gorm:"foreignKey:WorkspaceID" json:"projects,omitempty"`
}

// WorkspaceMember represents membership & RBAC
type WorkspaceMember struct {
	WorkspaceID string `gorm:"primaryKey;size:36" json:"workspace_id"`
	UserID      string `gorm:"primaryKey;size:36" json:"user_id"`
	Role        string `gorm:"size:50;default:'member'" json:"role"` // owner, admin, member, viewer
	User        User   `gorm:"foreignKey:UserID" json:"user"`
}

// Project model
type Project struct {
	BaseModel
	WorkspaceID string  `gorm:"size:36;not null;index" json:"workspace_id"`
	Name        string  `gorm:"size:255;not null" json:"name"`
	Key         string  `gorm:"size:10;not null" json:"key"` // e.g. ENG, MKT
	Description string  `gorm:"type:text" json:"description"`
	Icon        string  `gorm:"size:50" json:"icon"`
	Color       string  `gorm:"size:30" json:"color"`
	Boards      []Board `gorm:"foreignKey:ProjectID" json:"boards,omitempty"`
}

// Board model
type Board struct {
	BaseModel
	ProjectID          string   `gorm:"size:36;not null;index" json:"project_id"`
	Name               string   `gorm:"size:255;not null" json:"name"`
	BackgroundURL      string   `gorm:"size:512" json:"background_url"`
	BackgroundGradient string   `gorm:"size:255" json:"background_gradient"`
	Columns            []Column `gorm:"foreignKey:BoardID;order:position asc" json:"columns,omitempty"`
}

// Column (Status in Kanban)
type Column struct {
	BaseModel
	BoardID  string  `gorm:"size:36;not null;index" json:"board_id"`
	Name     string  `gorm:"size:100;not null" json:"name"`
	Color    string  `gorm:"size:30" json:"color"`
	Position float64 `gorm:"not null;default:1000" json:"position"`
	Limit    int     `gorm:"default:0" json:"limit"` // WIP limit (0 = unlimited)
	Cards    []Card  `gorm:"foreignKey:ColumnID;order:position asc" json:"cards,omitempty"`
}

// Card (Task / Issue)
type Card struct {
	BaseModel
	ColumnID      string     `gorm:"size:36;not null;index" json:"column_id"`
	BoardID       string     `gorm:"size:36;not null;index" json:"board_id"`
	IssueKey      string     `gorm:"size:30;not null;index" json:"issue_key"` // e.g. ENG-101
	Title         string     `gorm:"size:512;not null" json:"title"`
	Description   string     `gorm:"type:text" json:"description"`
	Position      float64    `gorm:"not null;default:1000;index" json:"position"` // Fractional indexing
	Priority      string     `gorm:"size:20;default:'none'" json:"priority"`      // urgent, high, medium, low, none
	DueDate       *time.Time `json:"due_date"`
	CoverImageURL string     `gorm:"size:512" json:"cover_image_url"`
	CreatorID     string     `gorm:"size:36" json:"creator_id"`
	
	// Relations
	Assignees  []User      `gorm:"many2many:card_assignees;" json:"assignees,omitempty"`
	Labels     []Label     `gorm:"many2many:card_labels;" json:"labels,omitempty"`
	Checklists []Checklist `gorm:"foreignKey:CardID" json:"checklists,omitempty"`
	Comments   []Comment   `gorm:"foreignKey:CardID" json:"comments,omitempty"`
	Activities []Activity  `gorm:"foreignKey:CardID" json:"activities,omitempty"`
}

// Label model
type Label struct {
	BaseModel
	ProjectID string `gorm:"size:36;not null;index" json:"project_id"`
	Name      string `gorm:"size:100;not null" json:"name"`
	Color     string `gorm:"size:30;not null" json:"color"`
}

// Checklist inside card
type Checklist struct {
	BaseModel
	CardID string          `gorm:"size:36;not null;index" json:"card_id"`
	Title  string          `gorm:"size:255;not null" json:"title"`
	Items  []ChecklistItem `gorm:"foreignKey:ChecklistID;order:position asc" json:"items,omitempty"`
}

// ChecklistItem
type ChecklistItem struct {
	BaseModel
	ChecklistID string  `gorm:"size:36;not null;index" json:"checklist_id"`
	Content     string  `gorm:"size:512;not null" json:"content"`
	IsDone      bool    `gorm:"default:false" json:"is_done"`
	Position    float64 `gorm:"not null;default:1000" json:"position"`
}

// Comment on Card
type Comment struct {
	BaseModel
	CardID  string `gorm:"size:36;not null;index" json:"card_id"`
	UserID  string `gorm:"size:36;not null" json:"user_id"`
	User    *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content string `gorm:"type:text;not null" json:"content"`
}

// Activity audit log for card
type Activity struct {
	BaseModel
	CardID   string `gorm:"size:36;not null;index" json:"card_id"`
	UserID   string `gorm:"size:36;not null" json:"user_id"`
	User     *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Action   string `gorm:"size:100;not null" json:"action"` // e.g. "moved", "commented", "status_changed"
	Metadata string `gorm:"type:text" json:"metadata"`       // JSON string of changes
}
