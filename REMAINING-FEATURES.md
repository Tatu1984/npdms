# NPDMS - Remaining Features to Implement

**Last Updated**: 2026-01-05  
**Status**: 24 "Coming Soon" features identified

---

## 📋 Feature Categories

### 1. FIR Management (7 features)

#### Input Methods
- [ ] **Voice Input** (`fir/new/page.tsx:338`)
  - Voice recognition for FIR dictation
  - Speech-to-text conversion
  - Integration with Web Speech API or cloud service

- [ ] **Document Scanning** (`fir/new/page.tsx:349`)
  - Handwritten document scanning
  - OCR for handwritten FIR forms
  - Camera integration for document capture

- [ ] **Document Upload** (`fir/new/page.tsx:360`)
  - File upload and parsing
  - PDF/DOCX parsing
  - Auto-fill form from uploaded documents

#### Evidence Attachments
- [ ] **Photo Upload** (`fir/new/page.tsx:739`)
  - Photo evidence upload during FIR creation
  - Image compression and optimization
  - Integration with MinIO storage

- [ ] **Document Upload** (`fir/new/page.tsx:743`)
  - Document evidence upload
  - File type validation
  - Storage integration

- [ ] **Audio Recording** (`fir/new/page.tsx:747`)
  - Audio evidence recording
  - Browser audio API integration
  - Audio file storage

- [ ] **Video Upload** (`fir/new/page.tsx:751`)
  - Video evidence upload
  - Video compression
  - Storage integration

#### Other FIR Features
- [ ] **FIR Preview** (`fir/new/page.tsx:803`)
  - Preview FIR before submission
  - PDF preview generation
  - Print-friendly view

- [ ] **Link Cases** (`fir/[id]/page.tsx:452`)
  - Link related cases to FIR
  - Case relationship management
  - Cross-reference UI

- [ ] **Advanced Filters** (`fir/page.tsx:253`, `cases/page.tsx:214`)
  - Advanced filtering options
  - Multi-criteria search
  - Saved filter presets

---

### 2. Evidence Management (3 features)

- [ ] **Evidence Transfer Form** (`evidence/page.tsx:404`)
  - Transfer evidence between locations/officers
  - Chain of custody update
  - Transfer approval workflow

- [ ] **Forensic Lab Request Form** (`evidence/page.tsx:516`)
  - Create forensic lab requests
  - Link to evidence items
  - Request tracking

- [ ] **Request Details View** (`evidence/page.tsx:564`)
  - View forensic request details
  - Status tracking
  - Report viewing

---

### 3. Personnel Management (2 features)

- [ ] **Duty Schedule Editor** (`personnel/page.tsx:416`)
  - Edit duty schedules
  - Shift assignment
  - Roster management UI

- [ ] **Date Picker** (`personnel/page.tsx:457`)
  - Date selection for attendance
  - Calendar component integration
  - Historical attendance viewing

---

### 4. Alerts System (3 features)

- [ ] **Audio Attachment** (`alerts/page.tsx:314`)
  - Add audio to alerts
  - Audio recording/upload
  - Playback functionality

- [ ] **Image Upload** (`alerts/page.tsx:327`)
  - Upload images to alerts
  - Image compression
  - Image gallery view

- [ ] **Report Sighting** (`alerts/page.tsx:481`)
  - Sighting report form
  - Location capture
  - Photo upload for sightings

---

### 5. Armoury Management (2 features)

- [ ] **Audit Report Generation** (`armoury/page.tsx:204`)
  - Generate audit reports
  - Export to PDF/Excel
  - Historical audit tracking

- [ ] **Add Ammunition Stock** (`armoury/page.tsx:427`)
  - Add ammunition inventory
  - Stock management
  - Issue/return tracking

- [ ] **Issue Ammunition Form** (`armoury/page.tsx:480`)
  - Ammunition issuance form
  - Approval workflow
  - Receipt generation

---

### 6. GIS/Mapping (1 feature)

- [ ] **GPS Navigation Mode** (`gis/page.tsx:382`)
  - Turn-by-turn navigation
  - Route planning
  - Real-time GPS tracking

---

### 7. Case Management (1 feature)

- [ ] **View Entry Details** (`fir/[id]/page.tsx:518`)
  - Full entry details view
  - Expanded information panel
  - Related records view

---

## 🎯 Priority Classification

### High Priority (Core Functionality)
1. **Evidence Transfer Form** - Critical for chain of custody
2. **Forensic Lab Request Form** - Core workflow feature
3. **Photo/Video Upload** - Essential evidence management
4. **Duty Schedule Editor** - Core personnel management
5. **Image Upload for Alerts** - Important for BOLO/FLASH alerts

### Medium Priority (Enhancement)
6. **Voice Input** - Productivity enhancement
7. **Document Scanning** - Useful but not critical
8. **FIR Preview** - Quality of life feature
9. **Advanced Filters** - User experience improvement
10. **Date Picker** - UI polish

### Low Priority (Nice to Have)
11. **Audio Recording** - Less commonly used
12. **GPS Navigation** - External app can be used
13. **Link Cases** - Can be done manually
14. **Audit Report Generation** - Can export data manually

---

## 🔧 Implementation Notes

### File Upload Features
- **Backend**: MinIO integration already exists
- **Frontend**: Need file upload components
- **API**: File upload endpoints need to be created/connected

### Voice/OCR Features
- **Backend**: OCR service exists (port 8004)
- **Frontend**: Need Web Speech API integration
- **Integration**: Connect to existing OCR service

### Form Components Needed
- File upload component with preview
- Date picker component
- Audio recorder component
- Video upload component
- Document scanner component

### API Endpoints Needed
- `POST /api/v1/evidence/:id/transfer` - Evidence transfer
- `POST /api/v1/forensics/request` - Create forensic request
- `POST /api/v1/alerts/:id/attachments` - Upload attachments
- `POST /api/v1/personnel/schedule` - Update duty schedule
- `GET /api/v1/personnel/attendance?date=` - Get attendance by date

---

## 📊 Completion Status

**Total Features**: 24  
**High Priority**: 5  
**Medium Priority**: 5  
**Low Priority**: 14

**Estimated Effort**:
- High Priority: ~2-3 weeks
- Medium Priority: ~2-3 weeks  
- Low Priority: ~2-3 weeks
- **Total**: ~6-9 weeks with 1-2 developers

---

## 🚀 Quick Wins (Can be done first)

1. **Date Picker** - Simple component integration
2. **Image Upload for Alerts** - File upload component exists
3. **Advanced Filters** - Extend existing filter logic
4. **FIR Preview** - Generate preview from form data
5. **Evidence Transfer Form** - Form + API call

---

## 📝 Next Steps

1. **Create file upload component** (reusable)
2. **Implement evidence transfer form**
3. **Add date picker component**
4. **Create forensic request form**
5. **Implement image upload for alerts**
6. **Add duty schedule editor**
7. **Create FIR preview component**

---

*This document should be updated as features are completed.*
