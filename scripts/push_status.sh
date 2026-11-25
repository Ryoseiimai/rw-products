#!/bin/zsh
# gen_status.py を実行し、変更があれば commit して push する。
# push が GitHub 側の一時的なサーバーエラー（例: fatal error in commit_refs_rules）で
# 失敗することがあるため、指数バックオフで数回リトライする。
set -u
cd "$(dirname "$0")/.." || exit 1

python3 gen_status.py
git add data/status.json

if git diff --cached --quiet; then
  exit 0
fi

git commit -m "status update" -q

max_attempts="${PUSH_STATUS_MAX_ATTEMPTS:-4}"
wait_seconds="${PUSH_STATUS_WAIT_SECONDS:-15}"
attempt=1
while [ "$attempt" -le "$max_attempts" ]; do
  if git push -q origin main; then
    exit 0
  fi
  echo "push failed (attempt ${attempt}/${max_attempts}), retrying in ${wait_seconds}s" >&2
  sleep "$wait_seconds"
  wait_seconds=$((wait_seconds * 2))
  attempt=$((attempt + 1))
done

echo "push failed after ${max_attempts} attempts" >&2
exit 1
