# Bill Blaze - Database Schema

## Overview
This document defines the complete database schema for the Bill Blaze platform with proper relational structure for SOPs, rules, documents, and lookup tables.

---

## Tables

### 1. `sops`
Stores Standard Operating Procedures

```sql
CREATE TABLE sops (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  organisation_name VARCHAR(500) NOT NULL,
  department VARCHAR(500) NOT NULL,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
  rules_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  
  INDEX idx_status (status),
  INDEX idx_organisation (organisation_name),
  INDEX idx_created_at (created_at)
);
```

### 2. `sop_rules`
Stores all extracted and validated rules (13 fields)

```sql
CREATE TABLE sop_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sop_id VARCHAR(255) NOT NULL,
  rule_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- Core Fields (13 required fields)
  code VARCHAR(500) NOT NULL,
  code_group VARCHAR(255),
  codes_selected JSON,
  action VARCHAR(500) NOT NULL,
  payer_group VARCHAR(500) NOT NULL,
  provider_group VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  documentation_trigger TEXT,
  chart_section VARCHAR(255),
  effective_date DATE NOT NULL,
  end_date DATE,
  reference TEXT,
  modifiers JSON,
  
  -- Metadata
  status ENUM('pending', 'reviewed', 'approved', 'active', 'rejected', 'needs_definition') NOT NULL DEFAULT 'pending',
  source ENUM('ai', 'manual', 'template', 'csv') NOT NULL,
  confidence INT,
  validation_status ENUM('valid', 'warning', 'error') NOT NULL DEFAULT 'valid',
  validation_issues JSON,
  created_by VARCHAR(255) NOT NULL,
  last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version INT NOT NULL DEFAULT 1,
  
  FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE,
  INDEX idx_sop_id (sop_id),
  INDEX idx_rule_id (rule_id),
  INDEX idx_status (status),
  INDEX idx_effective_date (effective_date)
);
```

### 3. `sop_documents`
Stores uploaded documents linked to SOPs

```sql
CREATE TABLE sop_documents (
  id VARCHAR(255) PRIMARY KEY,
  sop_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_type ENUM('pdf', 'docx', 'csv', 'xlsx') NOT NULL,
  file_size BIGINT NOT NULL,
  file_path VARCHAR(1000),
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(255) NOT NULL,
  processing_status ENUM('pending', 'processing', 'completed', 'error') NOT NULL DEFAULT 'pending',
  rules_extracted INT NOT NULL DEFAULT 0,
  error_message TEXT,
  
  FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE,
  INDEX idx_sop_id (sop_id),
  INDEX idx_processing_status (processing_status)
);
```

### 4. `processing_queue`
Tracks real-time document processing status

```sql
CREATE TABLE processing_queue (
  id VARCHAR(255) PRIMARY KEY,
  sop_id VARCHAR(255) NOT NULL,
  sop_name VARCHAR(500) NOT NULL,
  document_id VARCHAR(255) NOT NULL,
  document_name VARCHAR(500) NOT NULL,
  status ENUM('queued', 'processing', 'completed', 'error') NOT NULL DEFAULT 'queued',
  progress INT NOT NULL DEFAULT 0,
  rules_extracted INT NOT NULL DEFAULT 0,
  estimated_time_remaining INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  
  FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES sop_documents(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_sop_id (sop_id)
);
```

### 5. `recent_activity`
Tracks all system activities

```sql
CREATE TABLE recent_activity (
  id VARCHAR(255) PRIMARY KEY,
  type ENUM('sop_created', 'document_uploaded', 'document_processed', 'rule_created', 'rule_updated') NOT NULL,
  sop_id VARCHAR(255),
  sop_name VARCHAR(500),
  document_name VARCHAR(500),
  rule_id VARCHAR(100),
  description TEXT NOT NULL,
  user VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'review', 'pending', 'completed', 'error') NOT NULL,
  
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_sop_id (sop_id),
  INDEX idx_type (type)
);
```

### 6. `lookup_code_groups`
Stores code group definitions

```sql
CREATE TABLE lookup_code_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  codes JSON NOT NULL,
  category ENUM('procedure', 'diagnosis', 'modifier') NOT NULL,
  status ENUM('active', 'needs_definition') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tag (tag),
  INDEX idx_category (category)
);
```

### 7. `lookup_payer_groups`
Stores payer group definitions

```sql
CREATE TABLE lookup_payer_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  payers JSON NOT NULL,
  status ENUM('active', 'needs_definition') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tag (tag)
);
```

### 8. `lookup_provider_groups`
Stores provider group definitions

```sql
CREATE TABLE lookup_provider_groups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  providers JSON NOT NULL,
  status ENUM('active', 'needs_definition') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tag (tag)
);
```

### 9. `lookup_action_tags`
Stores action tag definitions

```sql
CREATE TABLE lookup_action_tags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  status ENUM('active', 'needs_definition') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tag (tag)
);
```

### 10. `lookup_chart_sections`
Stores chart section definitions

```sql
CREATE TABLE lookup_chart_sections (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  status ENUM('active', 'needs_definition') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tag (tag)
);
```

---

## Relationships

```
sops (1) ──────< (N) sop_rules
sops (1) ──────< (N) sop_documents
sops (1) ──────< (N) processing_queue
sop_documents (1) ──────< (N) processing_queue
```

---

## Key Constraints

1. **Cascading Deletes**: When SOP is deleted, all related rules, documents, and queue items are deleted
2. **Unique Constraints**: 
   - `rule_id` must be unique across all SOPs
   - Lookup `tag` values must be unique
3. **Foreign Keys**: Ensure referential integrity
4. **Indexes**: Optimize queries for status, dates, and lookups

---

## Status Workflow

### SOP Status
```
draft → active → archived
```

### Rule Status
```
pending → reviewed → approved → active
                   ↓
                rejected
```

### Document Processing Status
```
pending → processing → completed
                     ↓
                   error
```

### Queue Status
```
queued → processing → completed
                    ↓
                  error
```

---

## Auto-Transition Logic

### Draft → Active
```sql
-- Trigger when first rule is added
UPDATE sops 
SET status = 'active', 
    updated_at = CURRENT_TIMESTAMP 
WHERE id = ? 
  AND status = 'draft' 
  AND rules_count > 0;
```

### Update Rules Count
```sql
-- Trigger after INSERT/DELETE on sop_rules
UPDATE sops 
SET rules_count = (
  SELECT COUNT(*) 
  FROM sop_rules 
  WHERE sop_id = ?
)
WHERE id = ?;
```

---

## Sample Queries

### Get SOP with Rules
```sql
SELECT 
  s.*,
  COUNT(r.id) as actual_rules_count
FROM sops s
LEFT JOIN sop_rules r ON s.id = r.sop_id
WHERE s.id = ?
GROUP BY s.id;
```

### Get Processing Queue
```sql
SELECT * 
FROM processing_queue 
WHERE status IN ('queued', 'processing')
ORDER BY started_at ASC;
```

### Get Recent Activity
```sql
SELECT * 
FROM recent_activity 
ORDER BY timestamp DESC 
LIMIT 5;
```

### Get Rules for SOP
```sql
SELECT * 
FROM sop_rules 
WHERE sop_id = ? 
ORDER BY effective_date DESC, rule_id ASC;
```

---

## Migration Strategy

1. Create all tables in order (respecting foreign keys)
2. Seed lookup tables with initial data
3. Migrate existing LocalStorage data (if any)
4. Set up triggers for auto-updates
5. Create indexes for performance

---

## API Endpoints Required

### SOPs
- `POST /api/sops` - Create SOP
- `GET /api/sops` - List all SOPs
- `GET /api/sops/:id` - Get SOP details
- `PUT /api/sops/:id` - Update SOP
- `DELETE /api/sops/:id` - Delete SOP

### Rules
- `POST /api/sops/:id/rules` - Add rules to SOP
- `GET /api/sops/:id/rules` - Get all rules for SOP
- `PUT /api/rules/:ruleId` - Update rule
- `DELETE /api/rules/:ruleId` - Delete rule

### Documents
- `POST /api/sops/:id/documents` - Upload document
- `GET /api/sops/:id/documents` - List documents
- `PUT /api/documents/:id/status` - Update processing status

### Processing
- `POST /api/process/extract` - Trigger extraction
- `GET /api/processing-queue` - Get queue status
- `PUT /api/processing-queue/:id` - Update queue item

### Activity
- `GET /api/activity/recent` - Get recent activity

### Lookups
- `GET /api/lookups/code-groups` - Get all code groups
- `GET /api/lookups/payer-groups` - Get all payer groups
- `GET /api/lookups/provider-groups` - Get all provider groups
- `GET /api/lookups/action-tags` - Get all action tags
- `GET /api/lookups/chart-sections` - Get all chart sections
- `POST /api/lookups/:type` - Add new lookup (for NEEDSDEFINITION)

---

This schema supports:
- ✅ All 13 SOP rule fields
- ✅ Multiple rules per SOP
- ✅ Document tracking
- ✅ Real-time processing queue
- ✅ Activity logging
- ✅ Lookup table management
- ✅ Automatic status transitions
- ✅ Validation and error tracking
