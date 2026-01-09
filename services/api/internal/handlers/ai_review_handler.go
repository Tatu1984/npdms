package handlers

import (
	"net/http"
	"strconv"
	"time"

	"npdms/internal/models"
	"npdms/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIReviewHandler struct {
	service *services.AIReviewService
}

func NewAIReviewHandler(service *services.AIReviewService) *AIReviewHandler {
	return &AIReviewHandler{service: service}
}

// GetReviewQueue returns pending AI decisions for review
func (h *AIReviewHandler) GetReviewQueue(c *gin.Context) {
	// Parse filters
	decisionType := c.Query("type")
	priority := c.Query("priority")
	assignedToStr := c.Query("assigned_to")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	filters := services.AIReviewFilters{
		Page:     page,
		PageSize: pageSize,
	}

	if decisionType != "" {
		dt := models.AIDecisionType(decisionType)
		filters.DecisionType = &dt
	}
	if priority != "" {
		p := models.AIDecisionPriority(priority)
		filters.Priority = &p
	}
	if assignedToStr != "" {
		if assignedTo, err := uuid.Parse(assignedToStr); err == nil {
			filters.AssignedTo = &assignedTo
		}
	}

	decisions, total, err := h.service.GetReviewQueue(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "queue_fetch_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"decisions": decisions,
		"pagination": gin.H{
			"page":       page,
			"page_size":  pageSize,
			"total":      total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// GetDecision returns a specific AI decision
func (h *AIReviewHandler) GetDecision(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid decision ID format",
			Code:    400,
		})
		return
	}

	decision, err := h.service.GetDecision(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "not_found",
			Message: "Decision not found",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, decision)
}

// ReviewDecision handles human review of an AI decision
func (h *AIReviewHandler) ReviewDecision(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid decision ID format",
			Code:    400,
		})
		return
	}

	var req struct {
		Status         string `json:"status" binding:"required"`
		HumanDecision  string `json:"humanDecision"`
		ReviewNotes    string `json:"reviewNotes"`
		OverrideReason string `json:"overrideReason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_input",
			Message: err.Error(),
			Code:    400,
		})
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		string(models.AIDecisionStatusApproved):   true,
		string(models.AIDecisionStatusRejected):   true,
		string(models.AIDecisionStatusOverridden): true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_status",
			Message: "Status must be APPROVED, REJECTED, or OVERRIDDEN",
			Code:    400,
		})
		return
	}

	// Get reviewer ID from context
	reviewerID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    401,
		})
		return
	}

	uid := reviewerID.(uuid.UUID)

	review := services.AIReviewInput{
		Status:         models.AIDecisionStatus(req.Status),
		ReviewerID:     uid,
		HumanDecision:  req.HumanDecision,
		ReviewNotes:    req.ReviewNotes,
		OverrideReason: req.OverrideReason,
	}

	decision, err := h.service.ReviewDecision(c.Request.Context(), id, review)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "review_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, decision)
}

// AssignDecision assigns a decision to a reviewer
func (h *AIReviewHandler) AssignDecision(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid decision ID format",
			Code:    400,
		})
		return
	}

	var req struct {
		ReviewerID string `json:"reviewerId" binding:"required"`
		DueBy      string `json:"dueBy"`
		Notes      string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_input",
			Message: err.Error(),
			Code:    400,
		})
		return
	}

	reviewerID, err := uuid.Parse(req.ReviewerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_reviewer_id",
			Message: "Invalid reviewer ID format",
			Code:    400,
		})
		return
	}

	// Get assigner ID from context
	assignerID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    401,
		})
		return
	}

	uid := assignerID.(uuid.UUID)

	var dueBy *time.Time
	if req.DueBy != "" {
		t, err := time.Parse(time.RFC3339, req.DueBy)
		if err == nil {
			dueBy = &t
		}
	}

	assignment := services.AIAssignmentInput{
		DecisionID: id,
		ReviewerID: reviewerID,
		AssignedBy: uid,
		DueBy:      dueBy,
		Notes:      req.Notes,
	}

	result, err := h.service.AssignDecision(c.Request.Context(), assignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "assignment_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// SubmitFeedback submits feedback on an AI decision
func (h *AIReviewHandler) SubmitFeedback(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid decision ID format",
			Code:    400,
		})
		return
	}

	var req struct {
		FeedbackType string `json:"feedbackType" binding:"required"`
		CorrectValue string `json:"correctValue"`
		Comments     string `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_input",
			Message: err.Error(),
			Code:    400,
		})
		return
	}

	// Validate feedback type
	validTypes := map[string]bool{
		"CORRECT":           true,
		"INCORRECT":         true,
		"PARTIALLY_CORRECT": true,
	}
	if !validTypes[req.FeedbackType] {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_feedback_type",
			Message: "Feedback type must be CORRECT, INCORRECT, or PARTIALLY_CORRECT",
			Code:    400,
		})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    401,
		})
		return
	}

	uid := userID.(uuid.UUID)

	feedback := services.AIFeedbackInput{
		DecisionID:   id,
		FeedbackType: req.FeedbackType,
		FeedbackBy:   uid,
		CorrectValue: req.CorrectValue,
		Comments:     req.Comments,
	}

	result, err := h.service.SubmitFeedback(c.Request.Context(), feedback)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "feedback_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetModelConfigs returns all AI model configurations
func (h *AIReviewHandler) GetModelConfigs(c *gin.Context) {
	configs, err := h.service.GetAllModelConfigs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "fetch_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"configs": configs,
	})
}

// GetModelConfig returns a specific model configuration
func (h *AIReviewHandler) GetModelConfig(c *gin.Context) {
	modelName := c.Param("modelName")
	if modelName == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_model_name",
			Message: "Model name is required",
			Code:    400,
		})
		return
	}

	config, err := h.service.GetModelConfig(c.Request.Context(), modelName)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "not_found",
			Message: "Model configuration not found",
			Code:    404,
		})
		return
	}

	c.JSON(http.StatusOK, config)
}

// UpdateModelConfig updates a model configuration
func (h *AIReviewHandler) UpdateModelConfig(c *gin.Context) {
	modelName := c.Param("modelName")
	if modelName == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_model_name",
			Message: "Model name is required",
			Code:    400,
		})
		return
	}

	var req struct {
		ConfidenceThreshold  *float64 `json:"confidenceThreshold"`
		AutoApproveThreshold *float64 `json:"autoApproveThreshold"`
		IsEnabled            *bool    `json:"isEnabled"`
		RequiresReview       *bool    `json:"requiresReview"`
		ReviewTimeout        *int     `json:"reviewTimeout"`
		MaxQueueSize         *int     `json:"maxQueueSize"`
		Description          string   `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_input",
			Message: err.Error(),
			Code:    400,
		})
		return
	}

	update := services.AIModelConfigUpdate{
		ConfidenceThreshold:  req.ConfidenceThreshold,
		AutoApproveThreshold: req.AutoApproveThreshold,
		IsEnabled:            req.IsEnabled,
		RequiresReview:       req.RequiresReview,
		ReviewTimeout:        req.ReviewTimeout,
		MaxQueueSize:         req.MaxQueueSize,
		Description:          req.Description,
	}

	config, err := h.service.UpdateModelConfig(c.Request.Context(), modelName, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "update_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, config)
}

// GetStats returns AI decision statistics
func (h *AIReviewHandler) GetStats(c *gin.Context) {
	// Parse date range
	startStr := c.Query("start_date")
	endStr := c.Query("end_date")

	var startDate, endDate *time.Time
	if startStr != "" {
		t, err := time.Parse("2006-01-02", startStr)
		if err == nil {
			startDate = &t
		}
	}
	if endStr != "" {
		t, err := time.Parse("2006-01-02", endStr)
		if err == nil {
			endDate = &t
		}
	}

	stats, err := h.service.GetStats(c.Request.Context(), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "stats_fetch_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetPerformanceMetrics returns AI model performance metrics
func (h *AIReviewHandler) GetPerformanceMetrics(c *gin.Context) {
	modelName := c.Query("model_name")
	period := c.DefaultQuery("period", "DAILY")

	// Parse date range
	startStr := c.Query("start_date")
	endStr := c.Query("end_date")

	var startDate, endDate time.Time
	if startStr != "" {
		t, err := time.Parse("2006-01-02", startStr)
		if err == nil {
			startDate = t
		} else {
			startDate = time.Now().AddDate(0, -1, 0) // Default to last month
		}
	} else {
		startDate = time.Now().AddDate(0, -1, 0)
	}

	if endStr != "" {
		t, err := time.Parse("2006-01-02", endStr)
		if err == nil {
			endDate = t
		} else {
			endDate = time.Now()
		}
	} else {
		endDate = time.Now()
	}

	metrics, err := h.service.GetPerformanceMetrics(c.Request.Context(), modelName, period, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "metrics_fetch_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"metrics": metrics,
		"period":  period,
		"start":   startDate.Format("2006-01-02"),
		"end":     endDate.Format("2006-01-02"),
	})
}

// GetMyAssignments returns decisions assigned to the current user
func (h *AIReviewHandler) GetMyAssignments(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    401,
		})
		return
	}

	uid := userID.(uuid.UUID)
	status := c.DefaultQuery("status", "PENDING")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	filters := services.AIReviewFilters{
		AssignedTo: &uid,
		Page:       page,
		PageSize:   pageSize,
	}

	// Filter by status
	if status != "" {
		s := models.AIDecisionStatus(status)
		filters.Status = &s
	}

	decisions, total, err := h.service.GetReviewQueue(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "fetch_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"assignments": decisions,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// BulkReview handles bulk review of multiple decisions
func (h *AIReviewHandler) BulkReview(c *gin.Context) {
	var req struct {
		DecisionIDs []string `json:"decisionIds" binding:"required"`
		Status      string   `json:"status" binding:"required"`
		ReviewNotes string   `json:"reviewNotes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_input",
			Message: err.Error(),
			Code:    400,
		})
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		string(models.AIDecisionStatusApproved): true,
		string(models.AIDecisionStatusRejected): true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_status",
			Message: "Bulk review status must be APPROVED or REJECTED",
			Code:    400,
		})
		return
	}

	// Get reviewer ID from context
	reviewerID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "unauthorized",
			Message: "User not authenticated",
			Code:    401,
		})
		return
	}

	uid := reviewerID.(uuid.UUID)

	results := make([]gin.H, 0, len(req.DecisionIDs))
	successCount := 0
	failCount := 0

	for _, idStr := range req.DecisionIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			results = append(results, gin.H{
				"id":      idStr,
				"success": false,
				"error":   "Invalid ID format",
			})
			failCount++
			continue
		}

		review := services.AIReviewInput{
			Status:      models.AIDecisionStatus(req.Status),
			ReviewerID:  uid,
			ReviewNotes: req.ReviewNotes,
		}

		_, err = h.service.ReviewDecision(c.Request.Context(), id, review)
		if err != nil {
			results = append(results, gin.H{
				"id":      idStr,
				"success": false,
				"error":   err.Error(),
			})
			failCount++
		} else {
			results = append(results, gin.H{
				"id":      idStr,
				"success": true,
			})
			successCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"results":      results,
		"successCount": successCount,
		"failCount":    failCount,
		"total":        len(req.DecisionIDs),
	})
}

// GetDecisionHistory returns the history of a decision
func (h *AIReviewHandler) GetDecisionHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "invalid_id",
			Message: "Invalid decision ID format",
			Code:    400,
		})
		return
	}

	history, err := h.service.GetDecisionHistory(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "history_fetch_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"history": history,
	})
}

// ExpireDecisions manually triggers expiration of old decisions
func (h *AIReviewHandler) ExpireDecisions(c *gin.Context) {
	count, err := h.service.ExpireOldDecisions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "expiration_failed",
			Message: err.Error(),
			Code:    500,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"expiredCount": count,
		"message":      "Successfully expired old decisions",
	})
}
