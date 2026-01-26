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
    applicationName: my-app
    sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
    sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
    image: 'nginx:alpine'
```

applicationID でも指定可能です：

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
| `applicationID` | No* | - | AppRun アプリケーション ID（UUID 形式）。カンマ区切りで複数指定可能 |
| `applicationName` | No* | - | AppRun アプリケーション名。カンマ区切りで複数指定可能 |
| `sakuraAccessToken` | Yes | - | さくらクラウド API アクセストークン（UUID 形式） |
| `sakuraAccessTokenSecret` | Yes | - | さくらクラウド API アクセストークンシークレット |
| `image` | Yes | - | 新しいコンテナイメージ名（例: `nginx:latest`, `ghcr.io/user/repo:tag`） |
| `activate` | No | `true` | 新しいバージョンを即座にアクティブ化するかどうか |

\* `applicationID` または `applicationName` のいずれか（または両方）を指定する必要があります。両方指定した場合は、すべてのアプリケーションが更新されます。

### Outputs

| 名前 | 説明 |
|------|------|
| `applicationNames` | 更新されたアプリケーション名（複数アプリケーションの場合はカンマ区切り） |
| `version` | 新しく作成されたバージョン番号（複数アプリケーションの場合はカンマ区切り） |
| `activeVersion` | アクティブバージョン番号（`activate=true`の場合は`version`と同じ、`activate=false`の場合は以前のアクティブバージョン）（複数アプリケーションの場合はカンマ区切り） |

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

### 複数アプリケーションを同時に更新する例

複数のアプリケーションを同時に更新したい場合、カンマ区切りで applicationName を指定できます：

```yaml
- name: Update multiple applications
  id: update
  uses: tokuhirom/apprun-dedicated-update-image-action@v1
  with:
    applicationName: webapp,api-server,worker
    sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
    sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
    image: ghcr.io/${{ github.repository }}:${{ github.sha }}

- name: Show updated versions
  run: |
    echo "Updated applications: ${{ steps.update.outputs.applicationNames }}"
    echo "Created versions: ${{ steps.update.outputs.version }}"
    echo "Active versions: ${{ steps.update.outputs.activeVersion }}"
```

applicationID でも同様に複数指定可能です：

```yaml
- name: Update multiple applications by ID
  uses: tokuhirom/apprun-dedicated-update-image-action@v1
  with:
    applicationID: ${{ vars.APPLICATION_ID_1 }},${{ vars.APPLICATION_ID_2 }}
    sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
    sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
    image: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

この機能は、同じイメージを使用する複数のアプリケーション（例：ステージング環境と本番環境）を同時にデプロイしたい場合に便利です。

## How it works

* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions` を呼び出してバージョンリストを取得します
* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions/{version}` を呼び出してアプリケーションバージョンの詳細情報を取得します
* 引数で渡された新しいイメージに置き換えます
* `PUT https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}` を呼び出してアプリケーションのイメージを更新します
* 結果として `$.activeVersion` を表示します

## Related Tools

### apprun-dedicated-application-provisioner との連携

[apprun-dedicated-application-provisioner](https://github.com/tokuhirom/apprun-dedicated-application-provisioner) と組み合わせることで、AppRun 専有型のアプリケーション管理を効率的に行えます。

| ツール | 役割 |
|--------|------|
| **apprun-dedicated-application-provisioner** | アプリケーションの設定（CPU、メモリ、スケーリング、環境変数など）を YAML で管理 |
| **apprun-dedicated-update-image-action** | CI/CD パイプラインからコンテナイメージのみを更新 |

### 推奨ワークフロー

1. **設定管理**: `apprun-dedicated-application-provisioner` で CPU、メモリ、環境変数などの設定を YAML で管理し、手動または別の CI パイプラインで適用
2. **イメージデプロイ**: アプリケーションコードの変更時に、この Action でイメージのみを更新

```
┌─────────────────────────────────────────────────────────────────┐
│  apprun-dedicated-application-provisioner                       │
│  ・CPU/メモリ設定                                                │
│  ・スケーリング設定                                              │
│  ・環境変数                                                      │
│  ・ポート設定                                                    │
│  → YAML で宣言的に管理、plan/apply で適用                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  apprun-dedicated-update-image-action                           │
│  ・コンテナイメージの更新                                        │
│  → GitHub Actions で CI/CD パイプラインから自動デプロイ           │
└─────────────────────────────────────────────────────────────────┘
```

この分離により：
- **設定変更**はコードレビューを経て慎重に適用
- **イメージ更新**は CI/CD で自動化して高速にデプロイ

## Release flow

`v1` tag を更新する｡

## See also

- https://manual.sakura.ad.jp/api/cloud/apprun-dedicated/
- [apprun-dedicated-application-provisioner](https://github.com/tokuhirom/apprun-dedicated-application-provisioner) - YAML でアプリケーション設定を管理

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
