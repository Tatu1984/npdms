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
	warrantRepo := repository.NewWarrantRepository(db)
	bailRepo := repository.NewBailRepository(db)
	forensicRepo := repository.NewForensicRepository(db)
	personnelRepo := repository.NewPersonnelRepository(db)
	vehicleRepo := repository.NewVehicleRepository(db)
	courtRepo := repository.NewCourtRepository(db)
	alertRepo := repository.NewAlertRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, rdb, cfg.JWTSecret)
	firService := services.NewFIRService(firRepo, auditRepo)
	caseService := services.NewCaseService(caseRepo, auditRepo)
	evidenceService := services.NewEvidenceService(evidenceRepo, auditRepo)
	warrantService := services.NewWarrantService(warrantRepo, auditRepo)
	bailService := services.NewBailService(bailRepo, auditRepo)
	forensicService := services.NewForensicService(forensicRepo, auditRepo)
	personnelService := services.NewPersonnelService(personnelRepo, auditRepo)
	vehicleService := services.NewVehicleService(vehicleRepo, auditRepo)
	courtService := services.NewCourtService(courtRepo, auditRepo)
	alertService := services.NewAlertService(alertRepo, auditRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	firHandler := handlers.NewFIRHandler(firService)
	caseHandler := handlers.NewCaseHandler(caseService)
	evidenceHandler := handlers.NewEvidenceHandler(evidenceService)
	warrantHandler := handlers.NewWarrantHandler(warrantService)
	bailHandler := handlers.NewBailHandler(bailService)
	forensicHandler := handlers.NewForensicHandler(forensicService)
	personnelHandler := handlers.NewPersonnelHandler(personnelService)
	vehicleHandler := handlers.NewVehicleHandler(vehicleService)
	courtHandler := handlers.NewCourtHandler(courtService)
	alertHandler := handlers.NewAlertHandler(alertService)
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

			// Warrant routes
			warrants := protected.Group("/warrants")
			{
				warrants.GET("", warrantHandler.List)
				warrants.GET("/:id", warrantHandler.Get)
				warrants.POST("", middleware.RequireRole("SI", "INSPECTOR", "SHO"), warrantHandler.Create)
				warrants.PUT("/:id", middleware.RequireRole("SI", "INSPECTOR", "SHO"), warrantHandler.Update)
				warrants.PATCH("/:id/status", middleware.RequireRole("SI", "INSPECTOR", "SHO"), warrantHandler.UpdateStatus)
				warrants.GET("/stats", warrantHandler.GetStats)
			}

			// Bail routes
			bail := protected.Group("/bail")
			{
				bail.GET("", bailHandler.List)
				bail.GET("/:id", bailHandler.Get)
				bail.POST("", middleware.RequireRole("SI", "INSPECTOR", "SHO"), bailHandler.Create)
				bail.PUT("/:id", middleware.RequireRole("SI", "INSPECTOR", "SHO"), bailHandler.Update)
				bail.PATCH("/:id/status", middleware.RequireRole("SI", "INSPECTOR", "SHO"), bailHandler.UpdateStatus)
				bail.GET("/stats", bailHandler.GetStats)
			}

			// Forensic routes
			forensics := protected.Group("/forensics")
			{
				forensics.GET("", forensicHandler.List)
				forensics.GET("/:id", forensicHandler.Get)
				forensics.POST("", forensicHandler.Create)
				forensics.PUT("/:id", forensicHandler.Update)
				forensics.POST("/:id/complete", forensicHandler.CompleteRequest)
				forensics.GET("/stats", forensicHandler.GetStats)
			}

			// Personnel routes
			personnel := protected.Group("/personnel")
			{
				personnel.GET("", personnelHandler.List)
				personnel.GET("/:id", personnelHandler.Get)
				personnel.POST("", middleware.RequireRole("SHO", "DSP", "SP"), personnelHandler.Create)
				personnel.PUT("/:id", middleware.RequireRole("SHO", "DSP", "SP"), personnelHandler.Update)
				personnel.POST("/:id/assign-duty", middleware.RequireRole("SHO", "DSP", "SP"), personnelHandler.AssignDuty)
				personnel.DELETE("/:id", middleware.RequireRole("DSP", "SP"), personnelHandler.Delete)
			}

			// Vehicle routes
			vehicles := protected.Group("/vehicles")
			{
				vehicles.GET("", vehicleHandler.List)
				vehicles.GET("/:id", vehicleHandler.Get)
				vehicles.POST("", middleware.RequireRole("SHO", "DSP", "SP"), vehicleHandler.Create)
				vehicles.PUT("/:id", middleware.RequireRole("SHO", "DSP", "SP"), vehicleHandler.Update)
				vehicles.POST("/:id/allocate", middleware.RequireRole("SHO", "DSP", "SP"), vehicleHandler.AllocateVehicle)
				vehicles.POST("/:id/return", vehicleHandler.ReturnVehicle)
				vehicles.DELETE("/:id", middleware.RequireRole("DSP", "SP"), vehicleHandler.Delete)
			}

			// Court routes
			court := protected.Group("/court")
			{
				// Hearing routes
				court.GET("/hearings", courtHandler.ListHearings)
				court.GET("/hearings/:id", courtHandler.GetHearing)
				court.POST("/hearings", middleware.RequireRole("SI", "INSPECTOR", "SHO"), courtHandler.CreateHearing)
				court.PUT("/hearings/:id", middleware.RequireRole("SI", "INSPECTOR", "SHO"), courtHandler.UpdateHearing)

				// Order routes
				court.GET("/orders", courtHandler.ListOrders)
				court.GET("/orders/:id", courtHandler.GetOrder)
				court.POST("/orders", middleware.RequireRole("SI", "INSPECTOR", "SHO"), courtHandler.CreateOrder)

				// Stats
				court.GET("/stats", courtHandler.GetStats)
			}

			// Alert routes
			alerts := protected.Group("/alerts")
			{
				alerts.GET("", alertHandler.List)
				alerts.GET("/:id", alertHandler.Get)
				alerts.POST("", middleware.RequireRole("SHO", "DSP", "SP"), alertHandler.Create)
				alerts.PUT("/:id", middleware.RequireRole("SHO", "DSP", "SP"), alertHandler.Update)
				alerts.POST("/:id/acknowledge", alertHandler.Acknowledge)
				alerts.DELETE("/:id", middleware.RequireRole("SHO", "DSP", "SP"), alertHandler.Delete)
				alerts.GET("/active", alertHandler.GetActiveAlerts)
				alerts.GET("/unacknowledged", alertHandler.GetUnacknowledgedAlerts)
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
