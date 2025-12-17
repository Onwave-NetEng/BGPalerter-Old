#!/usr/bin/env bash
set -e

BASE_DIR="/home/net-eng/BGPalerter"
CONFIG_DIR="$BASE_DIR/config"

docker run --rm \
  --entrypoint node \
  -v "$CONFIG_DIR:/config" \
  nttgin/bgpalerter:latest \
  tools/rpki/rpki.js /config/rpki.yml
