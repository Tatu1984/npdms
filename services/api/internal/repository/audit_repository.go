package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/npdms/api/internal/models"
)

type AuditRepository struct {
	db *pgxpool.Pool
}

func NewAuditRepository(db *pgxpool.Pool) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Create(ctx context.Context, log *models.AuditLog) error {
	log.ID = uuid.New()

	query := `
		INSERT INTO audit_logs (
			id, user_id, action, resource_type, resource_id,
			description, ip_address, user_agent, success, failure_reason
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.Exec(ctx, query,
		log.ID, log.UserID, log.Action, log.ResourceType, log.ResourceID,
		log.Description, log.IPAddress, log.UserAgent, log.Success, log.FailureReason,
	)

	return err
}

func (r *AuditRepository) List(ctx context.Context, page, pageSize int) ([]models.AuditLog, int64, error) {
	var total int64
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM audit_logs").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	offset := (page - 1) * pageSize

	query := `
		SELECT al.id, al.user_id, al.action, al.resource_type, al.resource_id,
		       al.description, al.ip_address, al.user_agent, al.success,
		       al.failure_reason, al.created_at,
		       COALESCE(u.name, 'System') as user_name
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u.id
		ORDER BY al.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var log models.AuditLog
		err := rows.Scan(
			&log.ID, &log.UserID, &log.Action, &log.ResourceType, &log.ResourceID,
			&log.Description, &log.IPAddress, &log.UserAgent, &log.Success,
			&log.FailureReason, &log.CreatedAt, &log.UserName,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, log)
	}

	return logs, total, nil
}
