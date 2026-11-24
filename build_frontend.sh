#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "========================================================"
echo " React 프론트엔드 정적 빌드(frontend/dist)를 시작합니다..."
echo "========================================================"
cd "$SCRIPT_DIR/frontend"
npm install
npm run build
cd "$SCRIPT_DIR"
echo "[완료] frontend/dist 빌드가 성공적으로 완료되었습니다!"
