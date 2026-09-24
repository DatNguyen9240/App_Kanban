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

	// Configure connection pool for stability on cloud databases
	if sqlDB, err := DB.DB(); err == nil {
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(50)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

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
	db.Model(&models.Workspace{}).Count(&count)
	if count > 0 {
		var adminUser models.User
		if err := db.First(&adminUser).Error; err == nil {
			var cards []models.Card
			db.Preload("Assignees").Find(&cards)
			for _, c := range cards {
				if len(c.Assignees) == 0 {
					_ = db.Model(&c).Association("Assignees").Append(&adminUser)
				}
			}
		}
		// Ensure there is at least one active project in the workspace
		var projCount int64
		db.Model(&models.Project{}).Where("deleted_at IS NULL").Count(&projCount)
		if projCount == 0 {
			var ws models.Workspace
			if err := db.First(&ws).Error; err == nil {
				project := models.Project{
					WorkspaceID: ws.ID,
					Name:        "Main Project",
					Key:         "KAN",
					Description: "Default project",
					Icon:        "FolderGit2",
					Color:       "#6366F1",
				}
				db.Create(&project)

				board := models.Board{
					ProjectID:          project.ID,
					Name:               "Sprint Board",
					BackgroundGradient: "from-slate-50 to-slate-100",
				}
				db.Create(&board)

				cols := []models.Column{
					{BoardID: board.ID, Name: "Backlog", Color: "#94A3B8", Position: 1000},
					{BoardID: board.ID, Name: "Todo", Color: "#3B82F6", Position: 2000},
					{BoardID: board.ID, Name: "In Progress", Color: "#F59E0B", Position: 3000},
					{BoardID: board.ID, Name: "In Review", Color: "#8B5CF6", Position: 4000},
					{BoardID: board.ID, Name: "Done", Color: "#10B981", Position: 5000},
				}
				for _, col := range cols {
					db.Create(&col)
				}
			}
		}

		return // Data already exists
	}

	log.Println("Initializing clean default Workspace and Board structure...")

	// Default Admin User
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	user := models.User{
		Email:        "admin@kanban.dev",
		PasswordHash: string(hashedPassword),
		FullName:     "Admin User",
		AvatarURL:    "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
	}
	db.Create(&user)

	// Default Workspace
	workspace := models.Workspace{
		Name:    "My Workspace",
		Slug:    "my-workspace",
		OwnerID: user.ID,
		Members: []models.WorkspaceMember{
			{UserID: user.ID, Role: "owner"},
		},
	}
	db.Create(&workspace)

	// Default Project
	project := models.Project{
		WorkspaceID: workspace.ID,
		Name:        "Main Project",
		Key:         "KAN",
		Description: "Default project",
		Icon:        "FolderGit2",
		Color:       "#6366F1",
	}
	db.Create(&project)

	// Default Board
	board := models.Board{
		ProjectID:          project.ID,
		Name:               "Sprint Board",
		BackgroundGradient: "from-slate-50 to-slate-100",
	}
	db.Create(&board)

	// Standard Labels
	labelFrontend := models.Label{ProjectID: project.ID, Name: "Frontend", Color: "#3B82F6"}
	labelBackend := models.Label{ProjectID: project.ID, Name: "Backend", Color: "#10B981"}
	labelBug := models.Label{ProjectID: project.ID, Name: "Bug", Color: "#EF4444"}
	db.Create(&labelFrontend)
	db.Create(&labelBackend)
	db.Create(&labelBug)

	// Standard Empty Columns (No sample cards)
	cols := []models.Column{
		{BoardID: board.ID, Name: "Backlog", Color: "#94A3B8", Position: 1000},
		{BoardID: board.ID, Name: "Todo", Color: "#3B82F6", Position: 2000},
		{BoardID: board.ID, Name: "In Progress", Color: "#F59E0B", Position: 3000},
		{BoardID: board.ID, Name: "In Review", Color: "#8B5CF6", Position: 4000},
		{BoardID: board.ID, Name: "Done", Color: "#10B981", Position: 5000},
	}
	for _, col := range cols {
		db.Create(&col)
	}

	log.Println("Clean Kanban workspace initialized with 0 sample cards!")
}
