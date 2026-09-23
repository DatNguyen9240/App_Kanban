package services

const (
	InitialPositionStep = 1000.0
	MinPositionGap      = 0.00001
)

// CalculatePosition computes the new fractional position based on surrounding items.
// If both prevPos and nextPos are nil, this is the only or first item.
// If prevPos is nil, item is placed before the first item.
// If nextPos is nil, item is placed after the last item.
// If both are provided, item is placed in between.
func CalculatePosition(prevPos *float64, nextPos *float64) float64 {
	if prevPos == nil && nextPos == nil {
		return InitialPositionStep
	}

	if prevPos == nil && nextPos != nil {
		return *nextPos / 2.0
	}

	if prevPos != nil && nextPos == nil {
		return *prevPos + InitialPositionStep
	}

	// Between two positions
	return (*prevPos + *nextPos) / 2.0
}

// NeedsRebalance checks if the gap between adjacent items has become too small
func NeedsRebalance(prevPos float64, nextPos float64) bool {
	gap := nextPos - prevPos
	return gap > 0 && gap < MinPositionGap
}
