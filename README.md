# Chrome Extension Upload Action

This GitHub Action deploys Chrome extensions easily and quickly. The workflow
uses only a few dependencies.

## Features

- Upload extensions to the Chrome Web Store.
- Optional automatic publishing of extensions.

## Required Inputs

| Name            | Required | Description                                                                             |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| `client-id`     | Yes      | Google API client ID.                                                                   |
| `client-secret` | Yes      | Google API client secret.                                                               |
| `refresh-token` | Yes      | Google API refresh token.                                                               |
| `extension-id`  | Yes      | The Chrome Web Store extension ID.                                                      |
| `file-path`     | Yes      | Path to the ZIP file to be uploaded, e.g., `./dist/extension.zip`.                      |
| `publish`       | No       | Set to `true` to automatically publish the extension after upload. Defaults to `false`. |

## Usage

### Simple Example

The following workflow builds and uploads an extension to the Chrome Web Store
when a tag is pushed (without publishing it).

```yaml
name: Publish

on:
  push:
    branches:
      - main
      - master

jobs:
  publish:
    name: Publish webextension
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          check-latest: true
          cache: "pnpm"
      - name: Build
        run: |
          pnpm install
          pnpm run build
      - name: Upload Chrome Extension
        uses: pHo9UBenaA/chrome-extension-upload-action@master
        with:
          client-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          refresh-token: ${{ secrets.REFRESH_TOKEN }}
          extension-id: "fijodggmkbkjcmlpkpahjpepngppdppb"
          file-path: "./dist/extension.zip"
          publish: "false"
```

## How to Obtain Google API Credentials

Refer to the guide below to obtain your `client-id`, `client-secret`,
and `refresh-token`:

- [How to generate Google API keys](https://github.com/fregante/chrome-webstore-upload-keys)
- [Get Started with the Chrome Web Store API](https://developer.chrome.com/docs/webstore/using_webstore_api/)

## Notes

- The default value of `publish` is `false`. Extensions will only be uploaded
  unless explicitly set to `true`.
- The ZIP file must meet the Chrome Web Store's requirements. Uploads will fail
  if the file format is incorrect.

---

## License

This project is licensed under the [MIT License](LICENSE). See the license file
for more details.
