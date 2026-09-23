package services

import (
	"testing"
)

func TestCalculatePosition(t *testing.T) {
	// Case 1: First item
	pos := CalculatePosition(nil, nil)
	if pos != InitialPositionStep {
		t.Errorf("Expected %f, got %f", InitialPositionStep, pos)
	}

	// Case 2: Prepend before first item (pos = 1000)
	next := 1000.0
	pos = CalculatePosition(nil, &next)
	if pos != 500.0 {
		t.Errorf("Expected 500.0, got %f", pos)
	}

	// Case 3: Append after last item (pos = 2000)
	prev := 2000.0
	pos = CalculatePosition(&prev, nil)
	if pos != 3000.0 {
		t.Errorf("Expected 3000.0, got %f", pos)
	}

	// Case 4: Insert between two items (1000 and 2000)
	prev = 1000.0
	next = 2000.0
	pos = CalculatePosition(&prev, &next)
	if pos != 1500.0 {
		t.Errorf("Expected 1500.0, got %f", pos)
	}

	// Case 5: Repeated middle insertion
	prev = 1000.0
	next = 1500.0
	pos = CalculatePosition(&prev, &next)
	if pos != 1250.0 {
		t.Errorf("Expected 1250.0, got %f", pos)
	}
}

func TestNeedsRebalance(t *testing.T) {
	if NeedsRebalance(1000.0, 2000.0) {
		t.Errorf("Expected false for normal gap")
	}

	if !NeedsRebalance(1000.0, 1000.000005) {
		t.Errorf("Expected true for tiny gap")
	}
}
