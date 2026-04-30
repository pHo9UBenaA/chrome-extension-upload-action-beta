# リポジトリ全般レビュー結果

## サマリー

全体的に**良好な品質**のGitHub Actionです。Deno + TypeScriptによるシンプルで堅牢な実装、適切な型定義、最小限の依存関係という設計思想が一貫しています。特にBranded Types（ExtensionId）の使用やカスタムエラークラスなど、TypeScriptの機能を活用した実装は評価できます。

一方で、ドキュメントの網羅性、テストの欠如、outputs定義の不足など改善の余地があります。CI/CDワークフローで外部リポジトリを参照しているセキュリティ上の懸念も見られます。

## 良い点

- ✅ **最小限の依存関係**: `gaxios`と`@actions/core`のみで軽量
- ✅ **Branded Types**: `ExtensionId`型による型安全性の確保
- ✅ **カスタムエラークラス**: `WebStoreError`で詳細なエラー情報を保持
- ✅ **明確なコード構造**: 機能ごとにファイル分割（auth/upload/publish）
- ✅ **セマンティックバージョニング**: v0.1.0〜v0.3.0で適切に運用
- ✅ **最小権限の原則**: `--allow-read=.` `--allow-env` `--allow-net` の適切な制限
- ✅ **VSCode設定同梱**: 開発環境のセットアップが容易
- ✅ **lint/check通過**: コード品質が担保されている

## 問題点・改善点

| 重要度 | カテゴリ | 問題 | 改善案 |
|--------|----------|------|--------|
| **高** | セキュリティ | CI/CDで外部リポジトリ`pHo9UBenaA/gh-action-templates@master`を参照。masterブランチは変更可能でサプライチェーン攻撃のリスク | SHA pinning または特定タグを使用（例: `@v1.0.0`または`@abc1234...`） |
| **高** | テスト | テストコードが存在しない | ユニットテスト追加（特にvalidateExtensionId、エラーハンドリング） |
| **高** | action.yml | `outputs`が未定義。アップロード結果（item_id等）を後続ステップで使えない | outputs定義を追加 |
| **中** | README | Usage例に`oven-sh/setup-bun`があるが本Actionとは無関係 | 実際の使用例に修正 |
| **中** | README | `deno.json`のバージョンが`0.2.1`だがタグは`v0.3.0`で不整合 | バージョン同期 |
| **中** | README | トラブルシューティング、エラーコード一覧がない | ドキュメント追加 |
| **中** | ドキュメント | `docs/`ディレクトリが空 | 削除または内容追加 |
| **中** | ドキュメント | CHANGELOGが存在しない | CHANGELOG.md追加 |
| **中** | action.yml | `branding`（icon/color）が未設定 | Marketplace表示用に追加 |
| **低** | deno.json | `action`タスクの`--allow-env`が本番より緩い（全環境変数 vs 指定変数） | 一貫性のある権限設定 |
| **低** | .gitignore | `dummy-extension/`と`*.zip`が除外されているが、`dummy-extension-example/`は含まれていて混乱を招く | 命名の一貫性確保 |
| **低** | 依存関係 | `gaxios`は`node-fetch`等より重い可能性 | Deno標準の`fetch`への移行検討 |

## 改善提案

### 1. 【優先度1】セキュリティ強化

外部ワークフロー参照をSHAピニングに変更:

```yaml
uses: pHo9UBenaA/gh-action-templates/.github/workflows/deno-ci.yml@<commit-sha>
```

### 2. 【優先度2】outputs定義の追加

action.ymlにoutputsを追加:

```yaml
outputs:
  item-id:
    description: 'Chrome Web Store item ID'
  upload-state:
    description: 'Upload state (SUCCESS, etc.)'
```

### 3. 【優先度3】テスト追加

`src/`配下にテストファイルを作成:

- `main_test.ts`: validateExtensionId のテスト
- `error_test.ts`: WebStoreError のテスト

### 4. 【優先度4】ドキュメント整備

- CHANGELOG.md の作成
- トラブルシューティングセクション追加
- Chrome Web Store APIエラーコード一覧

### 5. 【優先度5】deno.jsonバージョン同期

v0.3.0に更新

### 6. 【優先度6】branding追加

```yaml
branding:
  icon: 'upload-cloud'
  color: 'blue'
```

## ベストプラクティスとの比較

| 観点 | 本Action | 類似Action例（chrome-webstore-upload-action等） |
|------|----------|------------------------------------------------|
| ランタイム | Deno (軽量) | Node.js 16/20 |
| 依存関係 | 2パッケージ | 多数（chrome-webstore-upload等） |
| outputs | ❌ なし | ✅ item_id, status等を出力 |
| テスト | ❌ なし | ✅ Jest/Vitest等でカバー |
| branding | ❌ なし | ✅ Marketplace用アイコン設定 |
| ドキュメント | 基本的 | 詳細（FAQ、トラブルシュート含む） |

**総評**: 実装品質は高いが、Action Marketplaceでの公開・利用を想定する場合はoutputs/branding/ドキュメントの強化が必要。セキュリティ面でのCI参照方式の改善は最優先で対応すべき。
