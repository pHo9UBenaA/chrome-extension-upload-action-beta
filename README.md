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
name: Upload Chrome extension

on:
  push:
    branches:
      - master

jobs:
  upload:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - run: corepack enable
      - uses: oven-sh/setup-bun@v1

      - run: bun install
      - run: bun run zip

      - name: Upload Chrome Extension
        uses: pHo9UBenaA/chrome-extension-upload-action@master
        with:
          client-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          refresh-token: ${{ secrets.REFRESH_TOKEN }}
          extension-id: "fijodggmkbkjcmlpkpahjpepngppdppb"
          file-path: "./dist.zip"
          publish: "false"
```

### How to Obtain Google API Credentials

Refer to the official guide below to obtain your `client-id`, `client-secret`,
and `refresh-token`:

- [Get Started with the Chrome Web Store API](https://developer.chrome.com/docs/webstore/using_webstore_api/)

For an unofficial alternative guide, you can also refer to:

- [How to generate Google API keys](https://github.com/fregante/chrome-webstore-upload-keys)
  (Not an official source)

## Development

1. **Copy the `.env.example` file to create a new `.env` file:**

```bash
cp .env.example .env
```

2. **Obtain and set your Google API credentials:**

Open the `.env` file and input your `CLIENT_ID`, `CLIENT_SECRET`, and
`REFRESH_TOKEN`. If you haven't obtained these credentials yet, refer to the
`How to Obtain Google API Credentials` guide for instructions.

3. **Set your Chrome Web Store Extension ID:**

In the `.env` file, assign your extension's ID to the `EXTENSION_ID` variable.

4. **Prepare your Chrome extension ZIP file:**

Ensure your extension is zipped and place it at `./dist/extension.zip`.

5. **Run the deployment script:**

```bash
deno task action
```

## License

This project is licensed under the [MIT License](LICENSE).
