#!/bin/bash
# ローカルでアクションを実行するスクリプト

# 環境変数を設定（実際の値に置き換えてください）
export INPUT_APPLICATIONID="${INPUT_APPLICATIONID:-019b2526-75b4-7c73-84d2-35ff39ef6c92}"
export INPUT_SAKURAACCESSTOKEN="${INPUT_SAKURAACCESSTOKEN:-6b1dbb7f-7da1-487c-971d-2584f2d5fcaa}"
export INPUT_SAKURAACCESSTOKENSECRET="${INPUT_SAKURAACCESSTOKENSECRET}"
export INPUT_IMAGE="${INPUT_IMAGE:-ghcr.io/tokuhirom/debug-httpd:0.0.3}"

# デバッグモード有効化（オプション）
export ACTIONS_STEP_DEBUG=true

# TypeScriptを直接実行
npx ts-node src/main.ts
