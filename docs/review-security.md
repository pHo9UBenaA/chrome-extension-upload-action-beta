# セキュリティレビュー結果

## サマリー

このChrome Extension Upload Actionは、基本的なセキュリティ原則に従った堅実な実装です。Denoのパーミッション機能を活用し、deno.jsonでは最小権限原則に沿った厳密な設定がされています。しかし、action.ymlでの実行時設定がdeno.jsonより緩く、**OAuth認証情報のシークレットマスキングが完全に欠落している**点が最も深刻なセキュリティリスクです。

また、外部ワークフローの参照が`@master`固定で、サプライチェーン攻撃のリスクがあります。ファイルパスのサニタイズ不足やエラー詳細の露出も改善が必要です。

## セキュリティリスク

| 重要度 | カテゴリ | リスク | 該当箇所 | 影響 | 対策 |
|--------|----------|--------|----------|------|------|
| **高** | シークレット漏洩 | `core.setSecret()`未使用 | src/main.ts | client-secret, refresh-token, access_tokenがログに露出する可能性 | 認証情報取得後に`core.setSecret()`で全シークレットをマスキング |
| **高** | エラー情報漏洩 | WebStoreErrorのdetailsがログに含まれる可能性 | src/error.ts:5 | APIエラーレスポンスにトークンが含まれる場合、ログ経由で漏洩 | detailsのログ出力前にシークレットをサニタイズ |
| **中** | サプライチェーン | 外部ワークフローが`@master`参照 | .github/workflows/*.yml | 上流リポジトリの改ざんで悪意あるコード実行 | コミットSHAで固定（例: `@a1b2c3d`） |
| **中** | 権限の不一致 | action.ymlのDeno権限がdeno.jsonより緩い | action.yml:42 | `--allow-net`が無制限で任意ホストへ通信可能 | `--allow-net=accounts.google.com:443,www.googleapis.com:443`に制限 |
| **中** | パストラバーサル | FILE_PATHの検証不足 | src/main.ts:30, upload.ts:18 | `../../etc/passwd`等の相対パスで意図しないファイル読み取り | パスの正規化とワークスペース内制限の検証 |
| **低** | 依存関係 | undici@5.29.0使用 | deno.lock:82 | CVE-2025-22150（低リスク）fetch headers漏洩の可能性 | undici@6.x以上へ更新 |
| **低** | 権限過剰 | CIでpull-requests: write | .github/workflows/ci.yml:5 | PRへのコメント不要なら過剰権限 | 必要性を確認し削除検討 |

## 良いセキュリティプラクティス

- ✅ **ExtensionIdの厳格なバリデーション**: 32文字小文字アルファベットの正規表現チェック（main.ts:14）
- ✅ **deno.jsonでの厳密なパーミッション定義**: `--allow-env`と`--allow-net`がホワイトリスト方式
- ✅ **HTTPS通信の強制**: accounts.google.comとwww.googleapis.comのみ、443ポート指定
- ✅ **deno.lockによる依存関係の固定**: integrityハッシュで改ざん検知
- ✅ **Branded Type使用**: ExtensionIdの型安全性確保（types.ts）
- ✅ **最小限の依存関係**: @actions/coreとgaxiosのみ
- ✅ **エラーハンドリングの抽象化**: 具体的なスタックトレースを隠蔽

## 必須の改善事項

### 1. シークレットマスキングの実装

```typescript
// src/main.ts の loadEnv() 後に追加
core.setSecret(env.clientSecret);
core.setSecret(env.refreshToken);

// requestAccessToken() 後に追加
core.setSecret(accessToken);
```

### 2. action.ymlのネットワーク権限制限

```yaml
# action.yml:42 を以下に変更
deno run --allow-read=. --allow-env --allow-net=accounts.google.com:443,www.googleapis.com:443 ${{ github.action_path }}/src/main.ts
```

### 3. 外部ワークフロー参照をSHA固定に変更

```yaml
# 例: @master → @<commit-sha>
uses: pHo9UBenaA/gh-action-templates/.github/workflows/deno-ci.yml@abc123def456
```

### 4. WebStoreErrorのdetailsログ出力抑制

```typescript
// src/main.ts:75 を修正
if (error instanceof WebStoreError) {
  core.setFailed(`${error.message} (Code: ${error.code})`);
  // error.details は core.debug() で出力するか、完全に抑制
}
```

## 推奨の改善事項

### 1. ファイルパスのサニタイズ追加

```typescript
import { resolve, isAbsolute } from "https://deno.land/std/path/mod.ts";

const validateFilePath = (filePath: string): string => {
  const resolved = resolve(filePath);
  const cwd = Deno.cwd();
  if (!resolved.startsWith(cwd)) {
    throw new Error("File path must be within workspace");
  }
  return resolved;
};
```

### 2. 依存関係の更新

undiciの脆弱性対応:

```bash
deno outdated --update
```

### 3. GitHub Actions permissions削減

ci.ymlの`pull-requests: write`が不要なら削除

### 4. アクセストークンの有効期限チェック追加

`expires_in`を活用して長時間実行時のトークン期限切れに対応

### 5. 入力値の追加バリデーション

- `file-path`の拡張子が`.zip`であることを確認
- ファイルサイズの上限チェック

### 6. 監査ログの強化

- アップロード/公開の成功時にextension-idのみをログ出力（シークレット以外）
- 操作のタイムスタンプ記録
