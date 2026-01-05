package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/npdms/api/internal/models"
	"github.com/redis/go-redis/v9"
)

// RateLimiter implements sliding window rate limiting using Redis
func RateLimiter(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip rate limiting if Redis is not available
		if rdb == nil {
			c.Next()
			return
		}

		ctx := context.Background()
		ip := c.ClientIP()
		key := "ratelimit:" + ip

		// Check current count
		count, err := rdb.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			c.Next()
			return
		}

		// 100 requests per minute limit
		limit := 100
		if count >= limit {
			c.JSON(http.StatusTooManyRequests, models.ErrorResponse{
				Error:   "rate_limit_exceeded",
				Message: "Too many requests. Please try again later.",
				Code:    429,
			})
			c.Abort()
			return
		}

		// Increment counter
		pipe := rdb.Pipeline()
		pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, time.Minute)
		pipe.Exec(ctx)

		c.Next()
	}
}
