# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-01

### Added

- **Outputs**: `item-id` and `upload-state` outputs for downstream step usage
- **File path validation**: Validate zip file is within workspace and has .zip extension
- **Network error handling**: GaxiosError is now caught and converted to WebStoreError
- **Tests**: Unit tests for validateExtensionId, WebStoreError, and validateFilePath
- **Branding**: Added icon and color for GitHub Marketplace display

### Changed

- **Type safety**: Use union types for `uploadState` and `status` fields
- **README**: Updated usage example with outputs and simplified build steps

### Security

- **Secret masking**: Mask clientSecret, refreshToken, and accessToken in logs
- **Network permissions**: Restrict `--allow-net` to required Google API hosts only
- **Workflow pinning**: Pin external workflow references to commit SHA
- **Error details**: Move error details to debug log level to prevent info leakage

## [0.2.1] - Previous Release

- Initial stable release
