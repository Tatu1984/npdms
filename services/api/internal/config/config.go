package config

import "os"

type Config struct {
	DatabaseURL     string
	RedisURL        string
	MinioEndpoint   string
	MinioAccessKey  string
	MinioSecretKey  string
	JWTSecret       string
	Port            string
	Env             string
}

func Load() *Config {
	return &Config{
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://npdms:npdms_secret_2024@localhost:5432/npdms?sslmode=disable"),
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379"),
		MinioEndpoint:   getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey:  getEnv("MINIO_ACCESS_KEY", "npdms_admin"),
		MinioSecretKey:  getEnv("MINIO_SECRET_KEY", "npdms_minio_secret_2024"),
		JWTSecret:       getEnv("JWT_SECRET", "npdms_jwt_secret_key_change_in_production"),
		Port:            getEnv("PORT", "8080"),
		Env:             getEnv("ENV", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
