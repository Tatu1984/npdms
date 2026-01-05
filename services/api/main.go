package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/npdms/api/internal/config"
	"github.com/npdms/api/internal/database"
	"github.com/npdms/api/internal/handlers"
	"github.com/npdms/api/internal/middleware"
	"github.com/npdms/api/internal/repository"
	"github.com/npdms/api/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	rdb := database.ConnectRedis(cfg.RedisURL)
	defer rdb.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	firRepo := repository.NewFIRRepository(db)
	caseRepo := repository.NewCaseRepository(db)
	evidenceRepo := repository.NewEvidenceRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, rdb, cfg.JWTSecret)
	firService := services.NewFIRService(firRepo, auditRepo)
	caseService := services.NewCaseService(caseRepo, auditRepo)
	evidenceService := services.NewEvidenceService(evidenceRepo, auditRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	firHandler := handlers.NewFIRHandler(firService)
	caseHandler := handlers.NewCaseHandler(caseService)
	evidenceHandler := handlers.NewEvidenceHandler(evidenceService)
	healthHandler := handlers.NewHealthHandler(db, rdb)

	// Setup Gin router
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Global middleware
	router.Use(middleware.CORS())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.RateLimiter(rdb))

	// Health check
	router.GET("/health", healthHandler.Health)
	router.GET("/ready", healthHandler.Ready)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// User routes
			protected.GET("/me", authHandler.GetCurrentUser)
			protected.PUT("/me", authHandler.UpdateProfile)
			protected.PUT("/me/password", authHandler.ChangePassword)

			// FIR routes
			firs := protected.Group("/firs")
			{
				firs.GET("", firHandler.List)
				firs.GET("/:id", firHandler.Get)
				firs.POST("", middleware.RequireRole("SI", "INSPECTOR", "SHO"), firHandler.Create)
				firs.PUT("/:id", middleware.RequireRole("SI", "INSPECTOR", "SHO"), firHandler.Update)
				firs.PATCH("/:id/status", middleware.RequireRole("SI", "INSPECTOR", "SHO"), firHandler.UpdateStatus)
				firs.GET("/:id/timeline", firHandler.GetTimeline)
			}

			// Case routes
			cases := protected.Group("/cases")
			{
				cases.GET("", caseHandler.List)
				cases.GET("/:id", caseHandler.Get)
				cases.POST("", middleware.RequireRole("SI", "INSPECTOR", "SHO"), caseHandler.Create)
				cases.PUT("/:id", middleware.RequireRole("SI", "INSPECTOR", "SHO"), caseHandler.Update)
				cases.GET("/:id/accused", caseHandler.GetAccused)
				cases.POST("/:id/accused", middleware.RequireRole("SI", "INSPECTOR", "SHO"), caseHandler.AddAccused)
				cases.GET("/:id/witnesses", caseHandler.GetWitnesses)
				cases.POST("/:id/witnesses", middleware.RequireRole("SI", "INSPECTOR", "SHO"), caseHandler.AddWitness)
			}

			// Evidence routes
			evidence := protected.Group("/evidence")
			{
				evidence.GET("", evidenceHandler.List)
				evidence.GET("/:id", evidenceHandler.Get)
				evidence.POST("", evidenceHandler.Create)
				evidence.PUT("/:id", evidenceHandler.Update)
				evidence.GET("/:id/custody", evidenceHandler.GetChainOfCustody)
				evidence.POST("/:id/transfer", evidenceHandler.Transfer)
			}

			// Stats & Dashboard
			protected.GET("/dashboard/stats", handlers.GetDashboardStats)

			// Audit logs (DSP+ only)
			audit := protected.Group("/audit")
			audit.Use(middleware.RequireRole("DSP", "SP", "DIG", "IG", "DGP"))
			{
				audit.GET("/logs", handlers.GetAuditLogs)
			}
		}
	}

	// Start server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
