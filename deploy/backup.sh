#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/mattrmindr/backups}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL must be set}"

DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"

DAILY_KEEP=${DAILY_KEEP:-7}
WEEKLY_KEEP=${WEEKLY_KEEP:-4}
MONTHLY_KEEP=${MONTHLY_KEEP:-6}

S3_BUCKET="${S3_BUCKET:-}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

DUMP_FILE="$DAILY_DIR/mattrmindr_${TIMESTAMP}.dump"

echo "[$(date -Iseconds)] Starting pg_dump..."
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=6 \
  --no-owner \
  --no-privileges \
  --file="$DUMP_FILE"

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Daily backup complete: $DUMP_FILE ($DUMP_SIZE)"

if [ "$DAY_OF_WEEK" = "7" ]; then
  cp "$DUMP_FILE" "$WEEKLY_DIR/mattrmindr_weekly_${TIMESTAMP}.dump"
  echo "[$(date -Iseconds)] Weekly backup saved."
fi

if [ "$DAY_OF_MONTH" = "01" ]; then
  cp "$DUMP_FILE" "$MONTHLY_DIR/mattrmindr_monthly_${TIMESTAMP}.dump"
  echo "[$(date -Iseconds)] Monthly backup saved."
fi

cleanup_old() {
  local dir=$1 keep=$2
  local count
  count=$(find "$dir" -name "*.dump" -type f | wc -l)
  if [ "$count" -gt "$keep" ]; then
    find "$dir" -name "*.dump" -type f -printf '%T@ %p\n' | \
      sort -n | head -n $(( count - keep )) | awk '{print $2}' | \
      xargs rm -f
    echo "[$(date -Iseconds)] Cleaned old backups in $dir (kept $keep)"
  fi
}

cleanup_old "$DAILY_DIR" "$DAILY_KEEP"
cleanup_old "$WEEKLY_DIR" "$WEEKLY_KEEP"
cleanup_old "$MONTHLY_DIR" "$MONTHLY_KEEP"

if [ -n "$S3_BUCKET" ]; then
  echo "[$(date -Iseconds)] Syncing to S3: $S3_BUCKET ..."
  aws s3 cp "$DUMP_FILE" "s3://$S3_BUCKET/daily/$(basename "$DUMP_FILE")"
  if [ "$DAY_OF_WEEK" = "7" ]; then
    aws s3 cp "$DUMP_FILE" "s3://$S3_BUCKET/weekly/mattrmindr_weekly_${TIMESTAMP}.dump"
  fi
  if [ "$DAY_OF_MONTH" = "01" ]; then
    aws s3 cp "$DUMP_FILE" "s3://$S3_BUCKET/monthly/mattrmindr_monthly_${TIMESTAMP}.dump"
  fi
  echo "[$(date -Iseconds)] S3 sync complete."
fi

echo "[$(date -Iseconds)] Backup job finished successfully."
