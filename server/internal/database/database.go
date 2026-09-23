package database

import (
	"log"
	"time"

	"kanban-server/internal/config"
	"kanban-server/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) *gorm.DB {
	var err error
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	if cfg.DBType == "postgres" {
		DB, err = gorm.Open(postgres.Open(cfg.DatabaseURL), gormConfig)
	} else {
		DB, err = gorm.Open(sqlite.Open(cfg.DatabaseURL), gormConfig)
	}

	if err != nil {
		log.Fatalf("Failed to connect to database (%s): %v", cfg.DBType, err)
	}

	log.Printf("Connected to database successfully (%s)", cfg.DBType)

	// Auto-migrate schema
	err = DB.AutoMigrate(
		&models.User{},
		&models.Workspace{},
		&models.WorkspaceMember{},
		&models.Project{},
		&models.Board{},
		&models.Column{},
		&models.Card{},
		&models.Label{},
		&models.Checklist{},
		&models.ChecklistItem{},
		&models.Comment{},
		&models.Activity{},
	)
	if err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// Seed initial data if empty
	SeedInitialData(DB)

	return DB
}

func SeedInitialData(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return // Data already exists
	}

	log.Println("Seeding initial Kanban demo data...")

	// Demo User
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	user := models.User{
		Email:        "demo@kanban.dev",
		PasswordHash: string(hashedPassword),
		FullName:     "Alex Morgan",
		AvatarURL:    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
	}
	db.Create(&user)

	user2 := models.User{
		Email:        "sarah@kanban.dev",
		PasswordHash: string(hashedPassword),
		FullName:     "Sarah Connor",
		AvatarURL:    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
	}
	db.Create(&user2)

	// Workspace
	workspace := models.Workspace{
		Name:    "Acme Corp",
		Slug:    "acme-corp",
		OwnerID: user.ID,
		Members: []models.WorkspaceMember{
			{UserID: user.ID, Role: "owner"},
			{UserID: user2.ID, Role: "member"},
		},
	}
	db.Create(&workspace)

	// Project
	project := models.Project{
		WorkspaceID: workspace.ID,
		Name:        "Website 2026",
		Key:         "ENG",
		Description: "Modern redesign of company portal and dashboard.",
		Icon:        "Globe",
		Color:       "#6366F1",
	}
	db.Create(&project)

	// Board
	board := models.Board{
		ProjectID:          project.ID,
		Name:               "Sprint Board",
		BackgroundGradient: "from-slate-50 to-slate-100",
	}
	db.Create(&board)

	// Labels
	labelFrontend := models.Label{ProjectID: project.ID, Name: "Frontend", Color: "#3B82F6"}
	labelBackend := models.Label{ProjectID: project.ID, Name: "Backend", Color: "#10B981"}
	labelDesign := models.Label{ProjectID: project.ID, Name: "UI/UX", Color: "#8B5CF6"}
	db.Create(&labelFrontend)
	db.Create(&labelBackend)
	db.Create(&labelDesign)

	// Columns
	colBacklog := models.Column{BoardID: board.ID, Name: "Backlog", Color: "#94A3B8", Position: 1000}
	colTodo := models.Column{BoardID: board.ID, Name: "Todo", Color: "#3B82F6", Position: 2000}
	colInProgress := models.Column{BoardID: board.ID, Name: "In Progress", Color: "#F59E0B", Position: 3000}
	colReview := models.Column{BoardID: board.ID, Name: "In Review", Color: "#8B5CF6", Position: 4000}
	colDone := models.Column{BoardID: board.ID, Name: "Done", Color: "#10B981", Position: 5000}

	db.Create(&colBacklog)
	db.Create(&colTodo)
	db.Create(&colInProgress)
	db.Create(&colReview)
	db.Create(&colDone)

	// Cards
	dueDate1 := time.Now().AddDate(0, 0, 5)
	dueDate2 := time.Now().AddDate(0, 0, 2)
	dueDate3 := time.Now().AddDate(0, 0, -1)

	card1 := models.Card{
		ColumnID:      colInProgress.ID,
		BoardID:       board.ID,
		IssueKey:      "ENG-101",
		Title:         "Redesign checkout experience & payment gateway",
		Description:   "Revamp the checkout flow with One-Click Pay, Apple Pay and responsive desktop/mobile layouts.",
		Position:      1000,
		Priority:      "urgent",
		DueDate:       &dueDate1,
		CoverImageURL: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
		CreatorID:     user.ID,
		Assignees:     []models.User{user, user2},
		Labels:        []models.Label{labelFrontend, labelDesign},
	}
	db.Create(&card1)

	// Checklist for card1
	cl := models.Checklist{
		CardID: card1.ID,
		Title:  "Implementation Steps",
		Items: []models.ChecklistItem{
			{Content: "Design wireframes in Figma", IsDone: true, Position: 1000},
			{Content: "Implement Stripe Webhook in Go", IsDone: true, Position: 2000},
			{Content: "Build responsive UI with Tailwind", IsDone: false, Position: 3000},
			{Content: "End-to-end payment test", IsDone: false, Position: 4000},
		},
	}
	db.Create(&cl)

	// Comment for card1
	comment := models.Comment{
		CardID:  card1.ID,
		UserID:  user.ID,
		Content: "Initial wireframe approved by Product team. Proceeding with frontend implementation.",
	}
	db.Create(&comment)

	card2 := models.Card{
		ColumnID:    colTodo.ID,
		BoardID:     board.ID,
		IssueKey:    "ENG-102",
		Title:       "Setup Real-time WebSocket Hub in Go Backend",
		Description: "Build gorilla/websocket hub with room channel broadcast for live drag & drop sync.",
		Position:    1000,
		Priority:    "high",
		DueDate:     &dueDate2,
		CreatorID:   user.ID,
		Assignees:   []models.User{user},
		Labels:      []models.Label{labelBackend},
	}
	db.Create(&card2)

	card3 := models.Card{
		ColumnID:    colTodo.ID,
		BoardID:     board.ID,
		IssueKey:    "ENG-103",
		Title:       "Implement Command Palette (Ctrl + K)",
		Description: "Quick navigation and issue creation command menu inspired by Linear.",
		Position:    2000,
		Priority:    "medium",
		CreatorID:   user2.ID,
		Assignees:   []models.User{user2},
		Labels:      []models.Label{labelFrontend},
	}
	db.Create(&card3)

	card4 := models.Card{
		ColumnID:    colBacklog.ID,
		BoardID:     board.ID,
		IssueKey:    "ENG-104",
		Title:       "Integrate OAuth Google & GitHub Login",
		Description: "Allow members to sign in with SSO providers.",
		Position:    1000,
		Priority:    "low",
		DueDate:     &dueDate3,
		CreatorID:   user.ID,
		Assignees:   []models.User{user},
		Labels:      []models.Label{labelBackend},
	}
	db.Create(&card4)

	card5 := models.Card{
		ColumnID:    colDone.ID,
		BoardID:     board.ID,
		IssueKey:    "ENG-100",
		Title:       "Project initialization & database schema design",
		Description: "Initial blueprints, ERD models and PostgreSQL setup completed.",
		Position:    1000,
		Priority:    "none",
		CreatorID:   user.ID,
		Assignees:   []models.User{user, user2},
		Labels:      []models.Label{labelBackend, labelDesign},
	}
	db.Create(&card5)

	log.Println("Initial Kanban demo data seeded successfully!")
}
