package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"kanban-server/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
)

func main() {
	fromPath := flag.String("from", "kanban.db", "Path to source SQLite database file")
	toURL := flag.String("to", os.Getenv("TARGET_DATABASE_URL"), "Target PostgreSQL connection URL (e.g. postgresql://user:pass@host:port/dbname)")
	flag.Parse()

	if *toURL == "" {
		fmt.Println("❌ Error: Target PostgreSQL URL is required.")
		fmt.Println("Usage:")
		fmt.Println("  go run ./cmd/migrate -from ./kanban.db -to \"postgresql://postgres:password@host:port/dbname\"")
		fmt.Println("Or set environment variable: TARGET_DATABASE_URL")
		os.Exit(1)
	}

	fmt.Printf("📦 Source SQLite: %s\n", *fromPath)
	fmt.Printf("🐘 Target Postgres: %s\n", *toURL)

	// 1. Connect to SQLite source
	srcDB, err := gorm.Open(sqlite.Open(*fromPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("❌ Failed to open source SQLite: %v", err)
	}

	// 2. Connect to PostgreSQL target
	dstDB, err := gorm.Open(postgres.Open(*toURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to target PostgreSQL: %v", err)
	}

	// 3. Migrate target schema
	fmt.Println("🔄 Creating / verifying tables in target database...")
	err = dstDB.AutoMigrate(
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
		log.Fatalf("❌ Migration failed on target: %v", err)
	}

	// 4. Copy Users
	var users []models.User
	srcDB.Find(&users)
	if len(users) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&users)
		fmt.Printf("✓ Migrated %d users\n", len(users))
	}

	// 5. Copy Workspaces
	var workspaces []models.Workspace
	srcDB.Find(&workspaces)
	if len(workspaces) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&workspaces)
		fmt.Printf("✓ Migrated %d workspaces\n", len(workspaces))
	}

	// 6. Copy WorkspaceMembers
	var members []models.WorkspaceMember
	srcDB.Find(&members)
	if len(members) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&members)
		fmt.Printf("✓ Migrated %d workspace members\n", len(members))
	}

	// 7. Copy Projects
	var projects []models.Project
	srcDB.Find(&projects)
	if len(projects) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&projects)
		fmt.Printf("✓ Migrated %d projects\n", len(projects))
	}

	// 8. Copy Boards
	var boards []models.Board
	srcDB.Find(&boards)
	if len(boards) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&boards)
		fmt.Printf("✓ Migrated %d boards\n", len(boards))
	}

	// 9. Copy Columns
	var cols []models.Column
	srcDB.Find(&cols)
	if len(cols) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&cols)
		fmt.Printf("✓ Migrated %d columns\n", len(cols))
	}

	// 10. Copy Labels
	var labels []models.Label
	srcDB.Find(&labels)
	if len(labels) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&labels)
		fmt.Printf("✓ Migrated %d labels\n", len(labels))
	}

	// 11. Copy Cards
	var cards []models.Card
	srcDB.Find(&cards)
	if len(cards) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&cards)
		fmt.Printf("✓ Migrated %d cards\n", len(cards))
	}

	// 12. Copy Checklists
	var checklists []models.Checklist
	srcDB.Find(&checklists)
	if len(checklists) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&checklists)
		fmt.Printf("✓ Migrated %d checklists\n", len(checklists))
	}

	// 13. Copy ChecklistItems
	var checkItems []models.ChecklistItem
	srcDB.Find(&checkItems)
	if len(checkItems) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&checkItems)
		fmt.Printf("✓ Migrated %d checklist items\n", len(checkItems))
	}

	// 14. Copy Comments
	var comments []models.Comment
	srcDB.Find(&comments)
	if len(comments) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&comments)
		fmt.Printf("✓ Migrated %d comments\n", len(comments))
	}

	// 15. Copy Activities
	var activities []models.Activity
	srcDB.Find(&activities)
	if len(activities) > 0 {
		dstDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&activities)
		fmt.Printf("✓ Migrated %d activities\n", len(activities))
	}

	// 16. Copy Many-to-Many card_assignees
	type CardAssignee struct {
		CardID string `gorm:"column:card_id"`
		UserID string `gorm:"column:user_id"`
	}
	var cardAssignees []CardAssignee
	srcDB.Table("card_assignees").Find(&cardAssignees)
	if len(cardAssignees) > 0 {
		dstDB.Table("card_assignees").Clauses(clause.OnConflict{DoNothing: true}).Create(&cardAssignees)
		fmt.Printf("✓ Migrated %d card assignees associations\n", len(cardAssignees))
	}

	// 17. Copy Many-to-Many card_labels
	type CardLabel struct {
		CardID  string `gorm:"column:card_id"`
		LabelID string `gorm:"column:label_id"`
	}
	var cardLabels []CardLabel
	srcDB.Table("card_labels").Find(&cardLabels)
	if len(cardLabels) > 0 {
		dstDB.Table("card_labels").Clauses(clause.OnConflict{DoNothing: true}).Create(&cardLabels)
		fmt.Printf("✓ Migrated %d card labels associations\n", len(cardLabels))
	}

	fmt.Println("\n🎉 Data migration completed successfully! All data is now in your PostgreSQL database.")
}
