#!/usr/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURRENT_DIR="$(pwd)"

cd "${SCRIPT_DIR}/site"
jekyll build
cd "${SCRIPT_DIR}/infrastructure"
cdk deploy
cd "$CURRENT_DIR"
