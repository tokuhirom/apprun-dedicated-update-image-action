# apprun-dedicate-update-image-action

AppRun 専有型のアプリケーションバージョンのイメージを更新する Github Actions です｡

## Motivation

AppRun 占有型を利用する際､image を差し替えたいときに簡単に差し替えるための github actions が必要だったので開発しました｡

## Usage

```
- name: Update application version's image
  with:
    applicationId: {{ vars.applicationId }}
    sakuraAccessToken: {{ vars.sakuraAccessToken }}
    sakuraAccessTokenSecret: {{ secrets.sakuraAccessTokenSecret }}
```

## How it works

* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions` を呼び出してバージョンリストを取得します
* `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions/{version}` を呼び出してアプリケーションバージョンの詳細情報を取得します
* 引数で渡された新しいイメージに置き換えます
* `PUT https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}` を呼び出してアプリケーションのイメージを更新します
* 結果として `$.activeVersion` を表示します

## See also

https://manual.sakura.ad.jp/api/cloud/apprun-dedicated/

## LICENSE

```
MIT License

Copyright (c) 2024 tokuhirom

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
