# MattrMindr — Disaster Recovery & Restore Procedures

## Overview

This document covers restore procedures for the MattrMindr system's two data stores:
1. **PostgreSQL database** — case data, user accounts, configuration
2. **Cloudflare R2** — uploaded documents, filings, transcripts (future; currently BYTEA in Postgres)

---

## 1. PostgreSQL Database Recovery

### 1a. Restore from pg_dump backup

Daily backups are created by `deploy/backup.sh` and stored in `/opt/mattrmindr/backups/`.

**Estimated recovery time:** 5–30 minutes depending on database size.

```bash
# Stop the application
sudo -u mattrmindr pm2 stop mattrmindr

# Find the most recent backup
ls -lt /opt/mattrmindr/backups/daily/ | head

# Restore (custom format — allows selective restore)
pg_restore \
  --clean --if-exists \
  --dbname "$DATABASE_URL" \
  /opt/mattrmindr/backups/daily/mattrmindr_YYYYMMDD_HHMMSS.dump

# Or for plain SQL backups:
# psql "$DATABASE_URL" < /opt/mattrmindr/backups/daily/mattrmindr_YYYYMMDD_HHMMSS.sql

# Restart the application
sudo -u mattrmindr pm2 start mattrmindr
```

**Selective table restore** (custom format only):
```bash
pg_restore \
  --clean --if-exists \
  --table=cases \
  --dbname "$DATABASE_URL" \
  /opt/mattrmindr/backups/daily/mattrmindr_YYYYMMDD_HHMMSS.dump
```

### 1b. Restore from AWS RDS automated snapshot

If using AWS RDS, automated snapshots are available for point-in-time recovery.

**Estimated recovery time:** 10–30 minutes (new instance creation).

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier mattrmindr-db \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Restore to a new RDS instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mattrmindr-db-restored \
  --db-snapshot-identifier rds:mattrmindr-db-YYYY-MM-DD-HH-MM

# Point-in-time recovery (within retention window)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mattrmindr-db \
  --target-db-instance-identifier mattrmindr-db-pitr \
  --restore-time "2025-01-15T14:30:00Z"

# After the new instance is available:
# 1. Update DATABASE_URL in .env to point to the restored instance
# 2. Restart the application
sudo -u mattrmindr pm2 restart mattrmindr
```

### 1c. Restore from off-site backup (S3)

If using the `deploy/backup.sh` S3 sync option:

```bash
# List available S3 backups
aws s3 ls s3://mattrmindr-backups/daily/ --human-readable

# Download the backup
aws s3 cp s3://mattrmindr-backups/daily/mattrmindr_YYYYMMDD_HHMMSS.dump /tmp/

# Restore
pg_restore --clean --if-exists --dbname "$DATABASE_URL" /tmp/mattrmindr_YYYYMMDD_HHMMSS.dump
```

---

## 2. R2 File Storage Recovery

### 2a. Versioned object recovery

If R2 bucket versioning is enabled, deleted or overwritten files can be recovered:

```bash
# List object versions
aws s3api list-object-versions \
  --bucket mattrmindr-files \
  --prefix "cases/123/" \
  --endpoint-url https://ACCOUNT_ID.r2.cloudflarestorage.com

# Restore a specific version
aws s3api get-object \
  --bucket mattrmindr-files \
  --key "cases/123/document.pdf" \
  --version-id "VERSION_ID" \
  --endpoint-url https://ACCOUNT_ID.r2.cloudflarestorage.com \
  restored-document.pdf
```

### 2b. Full R2 bucket sync restore

```bash
# Sync from backup bucket
aws s3 sync \
  s3://mattrmindr-files-backup/ \
  s3://mattrmindr-files/ \
  --endpoint-url https://ACCOUNT_ID.r2.cloudflarestorage.com
```

**Estimated recovery time:** Depends on data volume. ~100GB/hour typical.

---

## 3. Full System Recovery Checklist

For complete system recovery (new server):

1. **Provision EC2 instance** — see `deploy/EC2_SETUP_GUIDE.md`
2. **Deploy application code** — `git clone` or restore from source
3. **Install dependencies** — `npm install` in root, server, and lextrack
4. **Restore environment** — copy `.env` from secure backup
5. **Restore database** — use pg_dump restore (Section 1a) or create new RDS from snapshot (Section 1b)
6. **Run migrations** — `cd server && npm run migrate:up`
7. **Verify** — check application starts and data is accessible
8. **Update DNS** — point domain to new instance if IP changed
9. **Restore SSL** — `sudo certbot --nginx -d YOUR_DOMAIN.com`

---

## 4. Access Requirements

| Resource | Who has access | How to get credentials |
|---|---|---|
| EC2 instance | DevOps team | SSH key in AWS Secrets Manager |
| RDS database | DevOps team | IAM auth or connection string in `.env` |
| R2 storage | DevOps team | API keys in Cloudflare dashboard |
| S3 backup bucket | DevOps team | IAM role attached to EC2 instance |
| pg_dump backups | Application user (`mattrmindr`) | Local filesystem access |

---

## 5. Recovery Time Objectives

| Scenario | RTO | RPO |
|---|---|---|
| Application crash (PM2 auto-restart) | < 1 minute | 0 |
| Database corruption (pg_dump restore) | 5–30 minutes | Up to 24 hours |
| Database corruption (RDS point-in-time) | 10–30 minutes | Up to 5 minutes |
| Full server loss (new EC2 + RDS snapshot) | 1–2 hours | Up to 5 minutes |
| R2 data loss (versioned recovery) | Minutes per file | 0 (versioned) |

---

## 6. Testing Backups

Backups should be tested monthly:

```bash
# Create a test database
createdb mattrmindr_restore_test

# Restore latest backup into test database
pg_restore --dbname mattrmindr_restore_test /opt/mattrmindr/backups/daily/LATEST.dump

# Verify row counts
psql mattrmindr_restore_test -c "SELECT 'cases' as tbl, count(*) FROM cases UNION ALL SELECT 'users', count(*) FROM users"

# Clean up
dropdb mattrmindr_restore_test
```
