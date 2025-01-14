# Chrome Extension Upload Action

This GitHub Action automates the process of uploading and publishing browser
extensions to the Chrome Web Store.

## Features

- Lightweight Design: Uses minimal dependencies for easy setup.
- Upload extensions to the Chrome Web Store.
- Optional automatic publishing of extensions.

## Required Inputs

| Name            | Required | Description                                                                             |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| `file-path`     | Yes      | Path to the ZIP file to be uploaded, e.g., `dist/extension.zip`.                        |
| `extension-id`  | Yes      | The Chrome Web Store extension ID.                                                      |
| `client-id`     | Yes      | Google API client ID.                                                                   |
| `client-secret` | Yes      | Google API client secret.                                                               |
| `refresh-token` | Yes      | Google API refresh token.                                                               |
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
      - uses: actions/checkout@v1
      - uses: actions/setup-node@v1
        with:
          node-version: 20
      - name: Build
        run: |
          npm ci
          npm run build
      - name: Upload
        uses: mnao305/chrome-extension-upload@v5.0.0
        with:
          file-path: dist/extension.zip
          extension-id: ${{ secrets.EXTENSION_ID }}
          client-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          refresh-token: ${{ secrets.REFRESH_TOKEN }}
```

## Key Feature: Minimal Dependencies

This action uses minimal dependencies, making workflows lightweight and
efficient. It enables quick setup without impacting other parts of your project
while simplifying the deployment of extensions to the Chrome Web Store.

## How to Obtain Google API Credentials

Refer to the official guide below to obtain your `client-id`, `client-secret`,
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
