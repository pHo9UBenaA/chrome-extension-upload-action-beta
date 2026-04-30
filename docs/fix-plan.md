# 修正計画 (Fix Plan)

レビュー結果に基づく修正計画です。

## 修正項目一覧

### Phase 1: セキュリティ修正（最優先）

| ID | 項目 | 重要度 | 工数 |
|----|------|--------|------|
| S1 | シークレットマスキング実装 (`core.setSecret()`) | 高 | 15分 |
| S2 | action.yml のネットワーク権限制限 | 高 | 5分 |
| S3 | 外部ワークフロー参照のSHA/タグ固定 | 高 | 10分 |
| S4 | WebStoreError の details ログ出力抑制 | 中 | 10分 |

### Phase 2: 機能改善

| ID | 項目 | 重要度 | 工数 |
|----|------|--------|------|
| F1 | action.yml に outputs 定義追加 | 高 | 20分 |
| F2 | ネットワークエラーハンドリング追加 | 高 | 30分 |
| F3 | ファイルパス検証の強化 | 中 | 15分 |
| F4 | 型定義の厳密化 (Union型) | 中 | 10分 |

### Phase 3: テスト追加

| ID | 項目 | 重要度 | 工数 |
|----|------|--------|------|
| T1 | validateExtensionId のテスト | 高 | 20分 |
| T2 | WebStoreError のテスト | 中 | 15分 |
| T3 | auth/upload/publish のモックテスト | 中 | 60分 |

### Phase 4: ドキュメント・設定整備

| ID | 項目 | 重要度 | 工数 |
|----|------|--------|------|
| D1 | deno.json バージョン同期 (0.3.0) | 中 | 2分 |
| D2 | README の Usage例修正 | 中 | 10分 |
| D3 | action.yml に branding 追加 | 低 | 5分 |
| D4 | CHANGELOG.md 作成 | 低 | 15分 |

## 詳細実装計画

### S1: シークレットマスキング実装

**ファイル**: `src/main.ts`

```typescript
// loadEnv() 後に追加
core.setSecret(env.clientSecret);
core.setSecret(env.refreshToken);

// requestAccessToken() 後に追加
core.setSecret(accessToken);
```

### S2: action.yml のネットワーク権限制限

**ファイル**: `action.yml`

```yaml
# 変更前
deno run --allow-read=. --allow-env --allow-net ${{ github.action_path }}/src/main.ts

# 変更後
deno run --allow-read=. --allow-env --allow-net=accounts.google.com:443,www.googleapis.com:443 ${{ github.action_path }}/src/main.ts
```

### S3: 外部ワークフロー参照の固定

**ファイル**: `.github/workflows/ci.yml`, `.github/workflows/create-tag-on-merge.yml`

- `@master` → `@<commit-sha>` または `@v1.x.x` に変更
- ※ユーザー判断必要: 自己管理リポジトリならタグ運用も可

### S4: WebStoreError の details ログ出力抑制

**ファイル**: `src/main.ts`

```typescript
if (error instanceof WebStoreError) {
  core.setFailed(`${error.message} (Code: ${error.code})`);
  // details は debug レベルで出力（本番ログには含まれない）
  core.debug(`Error details: ${JSON.stringify(error.details)}`);
}
```

### F1: outputs 定義追加

**ファイル**: `action.yml`, `src/main.ts`

action.yml:
```yaml
outputs:
  item-id:
    description: 'Chrome Web Store item ID'
    value: ${{ steps.upload.outputs.item-id }}
  upload-state:
    description: 'Upload state (SUCCESS, FAILURE, etc.)'
    value: ${{ steps.upload.outputs.upload-state }}
```

src/main.ts:
```typescript
import * as core from "@actions/core";

// uploadPackage 成功後
core.setOutput("item-id", response.data.item_id);
core.setOutput("upload-state", response.data.uploadState);
```

### F2: ネットワークエラーハンドリング

**ファイル**: `src/auth.ts`, `src/upload.ts`, `src/publish.ts`

```typescript
import { GaxiosError } from "gaxios";

export const requestAccessToken = async (...): Promise<...> => {
  try {
    const response = await request<AccessTokenResponse>(options);
    if (response.status === 200) {
      return response.data;
    }
    throw new WebStoreError("Failed to get access token", response.status, response.data);
  } catch (error) {
    if (error instanceof GaxiosError) {
      throw new WebStoreError(
        `Network error: ${error.message}`,
        error.response?.status ?? 0,
        error.response?.data
      );
    }
    throw error;
  }
};
```

### F3: ファイルパス検証

**ファイル**: `src/upload.ts`

```typescript
import { resolve } from "jsr:@std/path";

const validateFilePath = (filePath: string): string => {
  const resolved = resolve(filePath);
  const cwd = Deno.cwd();
  if (!resolved.startsWith(cwd)) {
    throw new Error("File path must be within workspace");
  }
  if (!resolved.endsWith(".zip")) {
    throw new Error("File must be a .zip file");
  }
  return resolved;
};
```

### F4: 型定義の厳密化

**ファイル**: `src/interfaces.ts`

```typescript
export interface UploadResponse {
  kind: string;
  item_id: string;
  uploadState: "SUCCESS" | "FAILURE" | "IN_PROGRESS";
  itemError?: {
    error_code: string;
    error_detail: string;
  }[];
}

export interface PublishResponse {
  kind: string;
  item_id: string;
  status: ("OK" | "ITEM_PENDING_REVIEW" | "NOT_AUTHORIZED" | "INVALID_DEVELOPER" | "DEVELOPER_NO_OWNERSHIP" | "DEVELOPER_SUSPENDED" | "ITEM_NOT_FOUND" | "ITEM_PENDING_UPLOAD")[];
  statusDetail?: string[] | {
    status: string;
    detail: string;
  }[];
}
```

### T1-T3: テスト追加

**ファイル**: `src/main_test.ts`

```typescript
import { assertEquals, assertThrows } from "jsr:@std/assert";

Deno.test("validateExtensionId - valid ID", () => {
  const result = validateExtensionId("abcdefghijklmnopqrstuvwxyzabcdef");
  assertEquals(result, "abcdefghijklmnopqrstuvwxyzabcdef");
});

Deno.test("validateExtensionId - invalid length", () => {
  assertThrows(
    () => validateExtensionId("abc"),
    Error,
    "Invalid extension ID format"
  );
});

Deno.test("validateExtensionId - invalid characters", () => {
  assertThrows(
    () => validateExtensionId("ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF"),
    Error,
    "Invalid extension ID format"
  );
});
```

**ファイル**: `deno.json` にタスク追加

```json
{
  "tasks": {
    "test": "deno test --allow-read --allow-env --allow-net"
  }
}
```

## ユーザー判断が必要な項目

以下の項目は、ユーザーの方針確認後に実装します：

1. **S3: 外部ワークフロー参照方式**
   - 選択肢A: SHA固定（最もセキュア）
   - 選択肢B: タグ固定（自己管理リポジトリなら妥当）
   - 選択肢C: 現状維持（リスク受容）

2. **F1: outputs の項目**
   - `item-id`, `upload-state` 以外に必要な出力はあるか？

3. **D4: CHANGELOG の形式**
   - Keep a Changelog 形式？
   - 自動生成（conventional commits）？

4. **CI の `pull-requests: write` 権限**
   - PRコメント機能を使用しているか？
   - 不要なら削除してよいか？

## 実行順序

```
Phase 1 (セキュリティ) → Phase 2 (機能) → Phase 3 (テスト) → Phase 4 (ドキュメント)
```

全体工数: 約 4-5 時間
