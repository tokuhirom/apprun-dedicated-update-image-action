# apprun-dedicate-update-image-action

AppRun 専有型のアプリケーションバージョンのイメージを更新する Github Actions です｡

## Motivation

AppRun 専有型を利用する際､image を差し替えたいときに簡単に差し替えるための github actions が必要だったので開発しました｡

## Usage

このアクションをワークフローで使用する基本的な例：

```yaml
- name: Update application version's image
  uses: tokuhirom/apprun-dedicated-update-image-action@v1
  with:
    applicationID: ${{ vars.APPLICATION_ID }}
    sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
    sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
    image: 'nginx:alpine'
```

### Inputs

| 名前 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| `applicationID` | Yes | - | AppRun アプリケーション ID（UUID 形式） |
| `sakuraAccessToken` | Yes | - | さくらクラウド API アクセストークン（UUID 形式） |
| `sakuraAccessTokenSecret` | Yes | - | さくらクラウド API アクセストークンシークレット |
| `image` | Yes | - | 新しいコンテナイメージ名（例: `nginx:latest`, `ghcr.io/user/repo:tag`） |
| `activate` | No | `true` | 新しいバージョンを即座にアクティブ化するかどうか |

### Outputs

| 名前 | 説明 |
|------|------|
| `version` | 新しく作成されたバージョン番号 |
| `activeVersion` | アクティブバージョン番号（`activate=true`の場合は`version`と同じ、`activate=false`の場合は以前のアクティブバージョン） |

### 完全なワークフロー例

```yaml
name: Deploy to AppRun

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Update AppRun application
        uses: tokuhirom/apprun-dedicated-update-image-action@v1
        with:
          applicationID: ${{ vars.APPLICATION_ID }}
          sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
          sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
          image: ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Show deployed version
        run: echo "Deployed version ${{ steps.update.outputs.activeVersion }}"
```

### アクティブ化せずにバージョンを作成する例

新しいバージョンを作成するだけで、すぐにはアクティブ化したくない場合：

```yaml
- name: Create new version without activating
  id: create
  uses: tokuhirom/apprun-dedicated-update-image-action@v1
  with:
    applicationID: ${{ vars.APPLICATION_ID }}
    sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
    sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
    image: ghcr.io/${{ github.repository }}:${{ github.sha }}
    activate: false

- name: Show created version
  run: |
    echo "Created version: ${{ steps.create.outputs.version }}"
    echo "Active version: ${{ steps.create.outputs.activeVersion }}"
    echo "To activate: Update activeVersion to ${{ steps.create.outputs.version }}"
```

このオプションは、以下のような場合に便利です：
- 新しいバージョンを準備してから、手動でアクティブ化したい
- 複数の環境で段階的にロールアウトしたい
- テスト環境で検証してから本番環境でアクティブ化したい

## How it works

* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions` を呼び出してバージョンリストを取得します
* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions/{version}` を呼び出してアプリケーションバージョンの詳細情報を取得します
* 引数で渡された新しいイメージに置き換えます
* `PUT https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}` を呼び出してアプリケーションのイメージを更新します
* 結果として `$.activeVersion` を表示します

## Release flow

`v1` tag を更新する｡

## See also

https://manual.sakura.ad.jp/api/cloud/apprun-dedicated/

## LICENSE

```
MIT License

Copyright (c) 2025 tokuhirom

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
