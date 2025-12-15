#!/bin/bash
set -e

echo "Validating YAML files..."

docker run --rm \
  -v "$PWD/config:/config" \
  cytopia/yamllint \
  -d relaxed \
  /config

echo "Validation successful."

chmod +x validate.sh
