package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, redis *redis.Client) *HealthHandler {
	return &HealthHandler{db: db, redis: redis}
}

func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"service":   "npdms-api",
	})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	checks := make(map[string]string)

	// Check database
	if err := h.db.Ping(ctx); err != nil {
		checks["database"] = "unhealthy: " + err.Error()
	} else {
		checks["database"] = "healthy"
	}

	// Check Redis
	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			checks["redis"] = "unhealthy: " + err.Error()
		} else {
			checks["redis"] = "healthy"
		}
	} else {
		checks["redis"] = "not configured"
	}

	// Overall status
	healthy := true
	for _, status := range checks {
		if status != "healthy" && status != "not configured" {
			healthy = false
			break
		}
	}

	status := http.StatusOK
	statusText := "ready"
	if !healthy {
		status = http.StatusServiceUnavailable
		statusText = "not ready"
	}

	c.JSON(status, gin.H{
		"status":    statusText,
		"checks":    checks,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// GetDashboardStats returns dashboard statistics
func GetDashboardStats(c *gin.Context) {
	// TODO: Implement actual stats from database
	stats := map[string]interface{}{
		"totalFirs":        156,
		"activeCases":      89,
		"pendingWarrants":  12,
		"evidenceItems":    234,
		"todayFirs":        5,
		"criticalCases":    8,
		"pendingForensics": 15,
		"upcomingHearings": 23,
	}

	c.JSON(http.StatusOK, stats)
}

// GetAuditLogs returns audit logs (for DSP+ only)
func GetAuditLogs(c *gin.Context) {
	// TODO: Implement actual audit log retrieval
	c.JSON(http.StatusOK, gin.H{
		"data":       []interface{}{},
		"total":      0,
		"page":       1,
		"pageSize":   50,
		"totalPages": 0,
	})
}
