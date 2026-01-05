package models

import (
	"time"

	"github.com/google/uuid"
)

// User roles
type Role string

const (
	RoleConstable     Role = "CONSTABLE"
	RoleHeadConstable Role = "HEAD_CONSTABLE"
	RoleASI           Role = "ASI"
	RoleSI            Role = "SI"
	RoleInspector     Role = "INSPECTOR"
	RoleSHO           Role = "SHO"
	RoleDSP           Role = "DSP"
	RoleSP            Role = "SP"
	RoleDIG           Role = "DIG"
	RoleIG            Role = "IG"
	RoleSecretary     Role = "SECRETARY"
	RoleDGP           Role = "DGP"
)

// RoleHierarchy for access control
var RoleHierarchy = map[Role]int{
	RoleConstable:     1,
	RoleHeadConstable: 2,
	RoleASI:           3,
	RoleSI:            4,
	RoleInspector:     5,
	RoleSHO:           6,
	RoleDSP:           7,
	RoleSP:            8,
	RoleDIG:           9,
	RoleIG:            10,
	RoleSecretary:     11,
	RoleDGP:           12,
}

// User model
type User struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Username     string     `json:"username" db:"username"`
	Email        string     `json:"email" db:"email"`
	PasswordHash string     `json:"-" db:"password_hash"`
	Name         string     `json:"name" db:"name"`
	Role         Role       `json:"role" db:"role"`
	BadgeNumber  *string    `json:"badgeNumber" db:"badge_number"`
	StationID    *uuid.UUID `json:"stationId" db:"station_id"`
	StationName  string     `json:"stationName,omitempty"`
	Phone        *string    `json:"phone" db:"phone"`
	IsActive     bool       `json:"isActive" db:"is_active"`
	LastLogin    *time.Time `json:"lastLogin" db:"last_login"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time  `json:"updatedAt" db:"updated_at"`
}

// Station model
type Station struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Code      string    `json:"code" db:"code"`
	Address   *string   `json:"address" db:"address"`
	District  *string   `json:"district" db:"district"`
	State     string    `json:"state" db:"state"`
	Phone     *string   `json:"phone" db:"phone"`
	Email     *string   `json:"email" db:"email"`
	Latitude  *float64  `json:"latitude" db:"latitude"`
	Longitude *float64  `json:"longitude" db:"longitude"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// FIR Status
type FIRStatus string

const (
	FIRStatusDraft              FIRStatus = "DRAFT"
	FIRStatusRegistered         FIRStatus = "REGISTERED"
	FIRStatusUnderInvestigation FIRStatus = "UNDER_INVESTIGATION"
	FIRStatusChargesheetFiled   FIRStatus = "CHARGESHEET_FILED"
	FIRStatusClosed             FIRStatus = "CLOSED"
	FIRStatusTransferred        FIRStatus = "TRANSFERRED"
)

// FIR Priority
type Priority string

const (
	PriorityLow      Priority = "LOW"
	PriorityMedium   Priority = "MEDIUM"
	PriorityHigh     Priority = "HIGH"
	PriorityCritical Priority = "CRITICAL"
)

// FIR model
type FIR struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	FIRNumber            string     `json:"firNumber" db:"fir_number"`
	StationID            uuid.UUID  `json:"stationId" db:"station_id"`
	StationName          string     `json:"stationName,omitempty"`
	ComplainantName      string     `json:"complainantName" db:"complainant_name"`
	ComplainantPhone     *string    `json:"complainantPhone" db:"complainant_phone"`
	ComplainantAddress   *string    `json:"complainantAddress" db:"complainant_address"`
	ComplainantIDType    *string    `json:"complainantIdType" db:"complainant_id_type"`
	ComplainantIDNumber  *string    `json:"complainantIdNumber" db:"complainant_id_number"`
	IncidentDate         time.Time  `json:"incidentDate" db:"incident_date"`
	IncidentTime         *string    `json:"incidentTime" db:"incident_time"`
	IncidentLocation     string     `json:"incidentLocation" db:"incident_location"`
	IncidentDescription  string     `json:"incidentDescription" db:"incident_description"`
	IPCSections          []string   `json:"ipcSections" db:"ipc_sections"`
	Status               FIRStatus  `json:"status" db:"status"`
	Priority             Priority   `json:"priority" db:"priority"`
	RegisteredBy         *uuid.UUID `json:"registeredBy" db:"registered_by"`
	RegisteredByName     string     `json:"registeredByName,omitempty"`
	InvestigatingOfficer *uuid.UUID `json:"investigatingOfficer" db:"investigating_officer"`
	IOName               string     `json:"ioName,omitempty"`
	CreatedAt            time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt            time.Time  `json:"updatedAt" db:"updated_at"`
}

// Case Status
type CaseStatus string

const (
	CaseStatusRegistered         CaseStatus = "REGISTERED"
	CaseStatusUnderInvestigation CaseStatus = "UNDER_INVESTIGATION"
	CaseStatusChargesheetFiled   CaseStatus = "CHARGESHEET_FILED"
	CaseStatusInCourt            CaseStatus = "IN_COURT"
	CaseStatusConviction         CaseStatus = "CONVICTION"
	CaseStatusAcquittal          CaseStatus = "ACQUITTAL"
	CaseStatusClosed             CaseStatus = "CLOSED"
)

// Case model
type Case struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	CaseNumber           string     `json:"caseNumber" db:"case_number"`
	FIRID                uuid.UUID  `json:"firId" db:"fir_id"`
	FIRNumber            string     `json:"firNumber,omitempty"`
	Title                string     `json:"title" db:"title"`
	Synopsis             *string    `json:"synopsis" db:"synopsis"`
	Category             *string    `json:"category" db:"category"`
	Status               CaseStatus `json:"status" db:"status"`
	Priority             Priority   `json:"priority" db:"priority"`
	IPCSections          []string   `json:"ipcSections" db:"ipc_sections"`
	InvestigatingOfficer *uuid.UUID `json:"investigatingOfficer" db:"investigating_officer"`
	IOName               string     `json:"ioName,omitempty"`
	CourtName            *string    `json:"courtName" db:"court_name"`
	CourtCaseNumber      *string    `json:"courtCaseNumber" db:"court_case_number"`
	NextHearingDate      *time.Time `json:"nextHearingDate" db:"next_hearing_date"`
	CreatedAt            time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt            time.Time  `json:"updatedAt" db:"updated_at"`
}

// Evidence Type
type EvidenceType string

const (
	EvidenceTypePhysical    EvidenceType = "PHYSICAL"
	EvidenceTypeDigital     EvidenceType = "DIGITAL"
	EvidenceTypeDocumentary EvidenceType = "DOCUMENTARY"
	EvidenceTypeBiological  EvidenceType = "BIOLOGICAL"
	EvidenceTypeTrace       EvidenceType = "TRACE"
	EvidenceTypeTestimonial EvidenceType = "TESTIMONIAL"
)

// Evidence Status
type EvidenceStatus string

const (
	EvidenceStatusCollected EvidenceStatus = "COLLECTED"
	EvidenceStatusInCustody EvidenceStatus = "IN_CUSTODY"
	EvidenceStatusSentToFSL EvidenceStatus = "SENT_TO_FSL"
	EvidenceStatusAtCourt   EvidenceStatus = "AT_COURT"
	EvidenceStatusDisposed  EvidenceStatus = "DISPOSED"
)

// Evidence model
type Evidence struct {
	ID                 uuid.UUID      `json:"id" db:"id"`
	EvidenceNumber     string         `json:"evidenceNumber" db:"evidence_number"`
	CaseID             *uuid.UUID     `json:"caseId" db:"case_id"`
	FIRID              *uuid.UUID     `json:"firId" db:"fir_id"`
	EvidenceType       EvidenceType   `json:"evidenceType" db:"evidence_type"`
	Description        string         `json:"description" db:"description"`
	CollectionLocation *string        `json:"collectionLocation" db:"collection_location"`
	CollectionDate     *time.Time     `json:"collectionDate" db:"collection_date"`
	CollectedBy        *uuid.UUID     `json:"collectedBy" db:"collected_by"`
	CollectedByName    string         `json:"collectedByName,omitempty"`
	StorageLocation    *string        `json:"storageLocation" db:"storage_location"`
	ContainerType      *string        `json:"containerType" db:"container_type"`
	SealNumber         *string        `json:"sealNumber" db:"seal_number"`
	Weight             *string        `json:"weight" db:"weight"`
	Dimensions         *string        `json:"dimensions" db:"dimensions"`
	Condition          *string        `json:"condition" db:"condition"`
	Status             EvidenceStatus `json:"status" db:"status"`
	RequiresForensic   bool           `json:"requiresForensic" db:"requires_forensic"`
	ForensicType       *string        `json:"forensicType" db:"forensic_type"`
	CreatedAt          time.Time      `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time      `json:"updatedAt" db:"updated_at"`
}

// Evidence Custody Transfer
type EvidenceCustody struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	EvidenceID   uuid.UUID  `json:"evidenceId" db:"evidence_id"`
	FromUser     *uuid.UUID `json:"fromUser" db:"from_user"`
	FromUserName string     `json:"fromUserName,omitempty"`
	ToUser       *uuid.UUID `json:"toUser" db:"to_user"`
	ToUserName   string     `json:"toUserName,omitempty"`
	FromLocation *string    `json:"fromLocation" db:"from_location"`
	ToLocation   *string    `json:"toLocation" db:"to_location"`
	Purpose      *string    `json:"purpose" db:"purpose"`
	TransferDate time.Time  `json:"transferDate" db:"transfer_date"`
	Verified     bool       `json:"verified" db:"verified"`
	Notes        *string    `json:"notes" db:"notes"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
}

// Accused model
type Accused struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	CaseID      *uuid.UUID `json:"caseId" db:"case_id"`
	FIRID       *uuid.UUID `json:"firId" db:"fir_id"`
	Name        string     `json:"name" db:"name"`
	Alias       *string    `json:"alias" db:"alias"`
	Description *string    `json:"description" db:"description"`
	Age         *int       `json:"age" db:"age"`
	Gender      *string    `json:"gender" db:"gender"`
	Address     *string    `json:"address" db:"address"`
	IDType      *string    `json:"idType" db:"id_type"`
	IDNumber    *string    `json:"idNumber" db:"id_number"`
	Status      string     `json:"status" db:"status"`
	ArrestDate  *time.Time `json:"arrestDate" db:"arrest_date"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time  `json:"updatedAt" db:"updated_at"`
}

// Witness model
type Witness struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	CaseID            *uuid.UUID `json:"caseId" db:"case_id"`
	FIRID             *uuid.UUID `json:"firId" db:"fir_id"`
	Name              string     `json:"name" db:"name"`
	Phone             *string    `json:"phone" db:"phone"`
	Address           *string    `json:"address" db:"address"`
	WitnessType       *string    `json:"witnessType" db:"witness_type"`
	StatementRecorded bool       `json:"statementRecorded" db:"statement_recorded"`
	StatementDate     *time.Time `json:"statementDate" db:"statement_date"`
	StatementText     *string    `json:"statementText" db:"statement_text"`
	CreatedAt         time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt         time.Time  `json:"updatedAt" db:"updated_at"`
}

// Audit Log model
type AuditLog struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	UserID        *uuid.UUID `json:"userId" db:"user_id"`
	UserName      string     `json:"userName,omitempty"`
	Action        string     `json:"action" db:"action"`
	ResourceType  string     `json:"resourceType" db:"resource_type"`
	ResourceID    *uuid.UUID `json:"resourceId" db:"resource_id"`
	Description   *string    `json:"description" db:"description"`
	IPAddress     *string    `json:"ipAddress" db:"ip_address"`
	UserAgent     *string    `json:"userAgent" db:"user_agent"`
	Success       bool       `json:"success" db:"success"`
	FailureReason *string    `json:"failureReason" db:"failure_reason"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
}

// JWT Claims
type JWTClaims struct {
	UserID    uuid.UUID `json:"userId"`
	Username  string    `json:"username"`
	Role      Role      `json:"role"`
	StationID *uuid.UUID `json:"stationId"`
}

// API Response types
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
	User         User   `json:"user"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// Dashboard Stats
type DashboardStats struct {
	TotalFIRs          int64 `json:"totalFirs"`
	ActiveCases        int64 `json:"activeCases"`
	PendingWarrants    int64 `json:"pendingWarrants"`
	EvidenceItems      int64 `json:"evidenceItems"`
	TodayFIRs          int64 `json:"todayFirs"`
	CriticalCases      int64 `json:"criticalCases"`
	PendingForensics   int64 `json:"pendingForensics"`
	UpcomingHearings   int64 `json:"upcomingHearings"`
}
