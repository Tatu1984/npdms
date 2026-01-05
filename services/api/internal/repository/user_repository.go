package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/npdms/api/internal/models"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT u.id, u.username, u.email, u.password_hash, u.name, u.role,
		       u.badge_number, u.station_id, u.phone, u.is_active, u.last_login,
		       u.created_at, u.updated_at, COALESCE(s.name, '') as station_name
		FROM users u
		LEFT JOIN stations s ON u.station_id = s.id
		WHERE u.username = $1 AND u.is_active = true
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.Name,
		&user.Role, &user.BadgeNumber, &user.StationID, &user.Phone, &user.IsActive,
		&user.LastLogin, &user.CreatedAt, &user.UpdatedAt, &user.StationName,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT u.id, u.username, u.email, u.password_hash, u.name, u.role,
		       u.badge_number, u.station_id, u.phone, u.is_active, u.last_login,
		       u.created_at, u.updated_at, COALESCE(s.name, '') as station_name
		FROM users u
		LEFT JOIN stations s ON u.station_id = s.id
		WHERE u.id = $1
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.Name,
		&user.Role, &user.BadgeNumber, &user.StationID, &user.Phone, &user.IsActive,
		&user.LastLogin, &user.CreatedAt, &user.UpdatedAt, &user.StationName,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE users SET last_login = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, time.Now(), id)
	return err
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, passwordHash, id)
	return err
}
