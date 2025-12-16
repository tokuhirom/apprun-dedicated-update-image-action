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

| 名前 | 必須 | 説明 |
|------|------|------|
| `applicationID` | Yes | AppRun アプリケーション ID（UUID 形式） |
| `sakuraAccessToken` | Yes | さくらクラウド API アクセストークン（UUID 形式） |
| `sakuraAccessTokenSecret` | Yes | さくらクラウド API アクセストークンシークレット |
| `image` | Yes | 新しいコンテナイメージ名（例: `nginx:latest`, `ghcr.io/user/repo:tag`） |

### Outputs

| 名前 | 説明 |
|------|------|
| `activeVersion` | アクティブ化された新しいバージョン番号 |

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

## How it works

* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions` を呼び出してバージョンリストを取得します
* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions/{version}` を呼び出してアプリケーションバージョンの詳細情報を取得します
* 引数で渡された新しいイメージに置き換えます
* `PUT https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}` を呼び出してアプリケーションのイメージを更新します
* 結果として `$.activeVersion` を表示します

## Development

### ローカルでの動作確認

タグを打たずにローカルで動作確認できます：

1. `.env`ファイルを作成（`.env.example`をコピー）
```bash
cp .env.example .env
```

2. `.env`ファイルに実際の値を設定
```bash
INPUT_APPLICATIONID=your-application-id
INPUT_SAKURAACCESSTOKEN=your-access-token
INPUT_SAKURAACCESSTOKENSECRET=your-secret
INPUT_IMAGE=ghcr.io/your-org/your-image:tag
ACTIONS_STEP_DEBUG=true
```

3. ローカル実行
```bash
npm run local
```

または、シェルスクリプトを使用：
```bash
./local-run.sh
```

### ブランチを指定して実行

GitHub Actionsでタグの代わりにブランチを指定して実行できます：

```yaml
- uses: tokuhirom/apprun-dedicated-update-image-action@your-branch-name
  with:
    applicationID: ${{ vars.APPLICATION_ID }}
    sakuraAccessToken: ${{ vars.SAKURA_ACCESS_TOKEN }}
    sakuraAccessTokenSecret: ${{ secrets.SAKURA_ACCESS_TOKEN_SECRET }}
    image: 'nginx:alpine'
```

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
