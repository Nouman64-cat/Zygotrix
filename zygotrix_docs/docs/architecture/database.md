---
sidebar_position: 4
---

# Database Schema

Zygotrix uses MongoDB as its primary database. This document describes the data models and collections.

## Collections Overview

| Collection | Purpose |
|------------|---------|
| `users` | User accounts and profiles |
| `traits` | Genetic traits database |
| `conversations` | AI chatbot conversations |
| `gwas_datasets` | Uploaded GWAS datasets |
| `gwas_jobs` | GWAS analysis jobs |
| `gwas_results` | GWAS analysis results |
| `university_courses` | Educational courses |
| `university_enrollments` | Course enrollments |

## User Schema

```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password_hash": "$2b$12$...",
  "full_name": "John Doe",
  "role": "user",  // "user", "admin", "super_admin"
  "created_at": ISODate,
  "updated_at": ISODate,
  "email_verified": true,
  "preferences": {
    "style": "conversational",
    "length": "detailed",
    "auto_learn": true
  }
}
```

## Trait Schema

```javascript
{
  "_id": ObjectId,
  "name": "Eye Color",
  "type": "simple_dominant",
  "inheritance_pattern": "mendelian",
  "alleles": [
    {"symbol": "B", "name": "Brown", "dominant": true},
    {"symbol": "b", "name": "Blue", "dominant": false}
  ],
  "phenotypes": [
    {"genotypes": ["BB", "Bb"], "name": "Brown eyes"},
    {"genotypes": ["bb"], "name": "Blue eyes"}
  ],
  "description": "Eye color determined by...",
  "tags": ["human", "eye", "pigmentation"],
  "created_at": ISODate
}
```

## Conversation Schema

```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "title": "Punnett Square Question",
  "created_at": ISODate,
  "updated_at": ISODate,
  "messages": [
    {
      "id": UUID,
      "role": "user",
      "content": "What is a Punnett square?",
      "timestamp": ISODate
    },
    {
      "id": UUID,
      "role": "assistant",
      "content": "A Punnett square is...",
      "timestamp": ISODate,
      "tools_used": ["search_traits"]
    }
  ],
  "context": {
    "last_trait": "eye_color",
    "preferences": {}
  }
}
```

## GWAS Dataset Schema

```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "name": "test.vcf",
  "file_type": "vcf",
  "status": "processed",  // "pending", "processing", "processed", "error"
  "storage_path": "gwas-datasets/user123/dataset456/raw/test.vcf",
  "snp_count": 10000,
  "sample_count": 500,
  "created_at": ISODate,
  "processed_at": ISODate,
  "metadata": {
    "chromosomes": [1, 2, 3, ...],
    "build": "GRCh38"
  }
}
```

## GWAS Job Schema

```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "dataset_id": ObjectId,
  "status": "completed",  // "pending", "running", "completed", "failed"
  "analysis_type": "linear",
  "parameters": {
    "maf_threshold": 0.01,
    "num_threads": 4
  },
  "created_at": ISODate,
  "started_at": ISODate,
  "completed_at": ISODate,
  "error": null,
  "result_id": ObjectId
}
```

## Indexes

### Users Collection

```javascript
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
```

### Traits Collection

```javascript
db.traits.createIndex({ "name": "text", "description": "text" })
db.traits.createIndex({ "type": 1 })
db.traits.createIndex({ "tags": 1 })
```

### Conversations Collection

```javascript
db.conversations.createIndex({ "user_id": 1, "updated_at": -1 })
```

### GWAS Collections

```javascript
db.gwas_datasets.createIndex({ "user_id": 1, "created_at": -1 })
db.gwas_jobs.createIndex({ "user_id": 1, "status": 1 })
db.gwas_jobs.createIndex({ "dataset_id": 1 })
```

## Data Relationships

```
users
  │
  ├──< conversations (1:many)
  │         │
  │         └── messages (embedded array)
  │
  ├──< gwas_datasets (1:many)
  │         │
  │         └──< gwas_jobs (1:many)
  │                   │
  │                   └──> gwas_results (1:1)
  │
  └──< university_enrollments (1:many)
              │
              └──> university_courses (many:1)
```

## Migration Scripts

### Seed Traits

```bash
cd backend
python seed_mendelian_traits.py
```

### Create Indexes

```javascript
// Run in MongoDB shell
use zygotrix

// Users
db.users.createIndex({ "email": 1 }, { unique: true })

// Traits
db.traits.createIndex({ "name": "text", "description": "text" })
db.traits.createIndex({ "type": 1 })

// GWAS
db.gwas_datasets.createIndex({ "user_id": 1 })
db.gwas_jobs.createIndex({ "user_id": 1, "status": 1 })
```
