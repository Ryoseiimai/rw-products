# RYOSEIWORLD AI PRODUCTS ギャラリー

黒背景に自作AIプロダクトのサムネイルが並ぶギャラリーサイト（`index.html`）と、susume-engine（24時間AI司令塔）の稼働状況を見せるLIVEページ（`live.html`）。

## ファイル構成

- `index.html` — ギャラリー本体。単一HTMLでCSS/JSも内包（データはJS内の`PRODUCTS`配列）
- `live.html` — 司令塔LIVEページ。`data/status.json` をfetchして表示
- `data/status.json` — `gen_status.py` が生成する状態ファイル（数値のみ、生テキストなし）
- `gen_status.py` — `~/.susume-engine/` から安全な数値だけを集計するスクリプト（純Python3標準ライブラリ）
- `capture.mjs` — サムネイル一括撮影スクリプト（Playwright + sharp、`assets/omnilist`配下のnode_modulesを利用）
- `preview.mjs` — 仕上げ確認用のローカルサーバ+スクショスクリプト（使い捨て、公開物には含めなくてよい）
- `assets/thumbs/*.jpg` — 撮影済みサムネイル（640px幅、品質80）

## 公開手順（案）

1. 個人GitHub（`ghp`コマンド）で新規リポジトリを作成
   ```bash
   cd ~/dev/2026-08-31-rw-products
   ghp repo create rw-products --public --source=. --remote=origin --push
   ```
2. GitHub Pages を有効化（リポジトリ設定 → Pages → Branch: main / (root)）
3. 公開URL確認: `https://Ryoseiimai.github.io/rw-products/`

`ghp`/`wrp` の使い分けは個人アカウント（`Ryoseiimai`）側に作る方針に従う。

## status.json 自動更新（launchdの案）

1時間毎に `gen_status.py` を実行し、変更があれば公開リポジトリへpushする想定。

```xml
<!-- ~/Library/LaunchAgents/com.ryoseiworld.rwproducts-status.plist の例 -->
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ryoseiworld.rwproducts-status</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-c</string>
    <string>cd ~/dev/2026-08-31-rw-products && python3 gen_status.py && git add data/status.json && git diff --cached --quiet || (git commit -m "chore: update status.json" && git push)</string>
  </array>
  <key>StartInterval</key><integer>3600</integer>
  <key>StandardOutPath</key><string>/tmp/rwproducts-status.log</string>
  <key>StandardErrorPath</key><string>/tmp/rwproducts-status.log</string>
</dict>
</plist>
```

登録は `launchctl load` で行う（本メモはあくまで案。実際の登録・push・デプロイはメイン側で判断して実行する）。

## 注意点

- `data/status.json` にはタイトル・ID・パス等の生テキストを一切含めない設計（数値と状態のみ）
- サムネイルは撮影時点のスナップショット。サイト更新時は `node capture.mjs` を再実行する
