#!/bin/bash

set -euo pipefail

TARGET=bundler
OUTDIR_FLASHLIGHT=../../www/engine

wasm-pack build flashlight --target $TARGET --release --out-dir $OUTDIR_FLASHLIGHT
