# Chrome Extension Upload Action

GitHub Action for uploading Chrome extensions to the Chrome Web Store with
minimal dependencies.

## Features

- Upload extensions to Chrome Web Store
- Optional automatic publishing after upload
- Outputs item ID and upload state for downstream steps

## Inputs

| Name            | Required | Description                                                   |
| --------------- | -------- | ------------------------------------------------------------- |
| `client-id`     | Yes      | Google OAuth 2.0 client ID                                    |
| `client-secret` | Yes      | Google OAuth 2.0 client secret                                |
| `refresh-token` | Yes      | Google OAuth 2.0 refresh token                                |
| `extension-id`  | Yes      | Chrome Web Store extension ID                                 |
| `file-path`     | Yes      | Path to the extension ZIP file (e.g., `./dist/extension.zip`) |
| `publish`       | No       | Publish immediately after upload. Default: `false`            |

## Outputs

| Name           | Description                                  |
| -------------- | -------------------------------------------- |
| `item-id`      | Chrome Web Store item ID                     |
| `upload-state` | Upload state (`SUCCESS`, `FAILURE`, etc.)    |

## Usage

Upload extension when pushing to master branch:

```yaml
name: Upload Chrome Extension

on:
  push:
    branches:
      - master

jobs:
  upload:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build extension
        run: |
          # Your build commands here
          zip -r extension.zip src/

      - name: Upload Chrome Extension
        id: upload
        uses: pHo9UBenaA/chrome-extension-upload-action@v0.3.0
        with:
          client-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          refresh-token: ${{ secrets.REFRESH_TOKEN }}
          extension-id: "your-extension-id-here"
          file-path: "./extension.zip"
          publish: "false"

      - name: Show upload result
        run: |
          echo "Item ID: ${{ steps.upload.outputs.item-id }}"
          echo "State: ${{ steps.upload.outputs.upload-state }}"
```

## Obtaining Google API Credentials

To get `client-id`, `client-secret`, and `refresh-token`:

1. Official Guide:
   [Chrome Web Store API Documentation](https://developer.chrome.com/docs/webstore/using_webstore_api/)
2. Alternative Guide:
   [chrome-webstore-upload-keys](https://github.com/fregante/chrome-webstore-upload-keys)

## Development

1. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

2. Configure `.env` with your credentials:
   - `CLIENT_ID`: Google OAuth client ID
   - `CLIENT_SECRET`: Google OAuth client secret
   - `REFRESH_TOKEN`: Google OAuth refresh token
   - `EXTENSION_ID`: Chrome Web Store extension ID

3. Place test extension at `./dummy-extension.zip`

4. Run the action:
   ```bash
   deno task action
   ```

## License

[MIT License](LICENSE)
