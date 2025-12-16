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

* call `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions` to get version list
* call `GET https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}/versions/{version}` to get application version details information
* replace image to the new image passed by argument.
* call `PUT https://secure.sakura.ad.jp/cloud/api/apprun-dedicated/1.0/applications/{applicationID}` to update the application's image
* show `$.activeVersion` as a result

## See also

https://manual.sakura.ad.jp/api/cloud/apprun-dedicated/

## LICENSE

TBD: MIT