# Deno vs npm/pnpm/aube 評価結果

## エグゼクティブサマリー

**現状の Deno 維持を推奨します。**

このリポジトリは GitHub Action として、外部の Chrome Web Store API とのみ通信するシンプルな構成です。Deno の明示的パーミッションフラグ（`--allow-read=.`, `--allow-net=accounts.google.com:443,www.googleapis.com:443`）により、**実行時レベル**でのセキュリティ制御が可能であり、これは npm/pnpm/aube のいずれも提供できない独自の強みです。aube は優れたセキュリティ機能を持ちますが、これらは「パッケージインストール時」の保護であり、Deno の「実行時」保護とは補完的な関係にあります。移行コストに見合うメリットがありません。

## 比較表

| 観点 | Deno | npm | pnpm | aube |
|------|------|-----|------|------|
| **セキュリティモデル** | ⭐⭐⭐⭐⭐ 実行時権限制御 | ⭐⭐ 制御なし | ⭐⭐⭐ 厳格な依存分離 | ⭐⭐⭐⭐ インストール時保護 |
| **サプライチェーン攻撃耐性** | ⭐⭐⭐⭐ 実行時に緩和 | ⭐⭐ postinstall リスク | ⭐⭐⭐ phantom deps 防止 | ⭐⭐⭐⭐⭐ cooling window + jail |
| **GitHub Actions 相性** | ⭐⭐⭐⭐ setup-deno 公式提供 | ⭐⭐⭐⭐⭐ ネイティブサポート | ⭐⭐⭐⭐ actions/setup-node + pnpm/action-setup | ⭐⭐⭐ mise経由での設定必要 |
| **CI キャッシュ効率** | ⭐⭐⭐⭐ グローバルキャッシュ | ⭐⭐⭐ node_modules | ⭐⭐⭐⭐ グローバルストア | ⭐⭐⭐⭐⭐ CAS + 高速インストール |
| **エコシステム成熟度** | ⭐⭐⭐ npm 互換あり | ⭐⭐⭐⭐⭐ 最大 | ⭐⭐⭐⭐⭐ 成熟 | ⭐⭐ 新しい（2026年） |
| **TypeScript サポート** | ⭐⭐⭐⭐⭐ ネイティブ | ⭐⭐⭐ tsc 必要 | ⭐⭐⭐ tsc 必要 | ⭐⭐⭐ tsc 必要 |
| **移行コスト** | — (現状) | ⭐⭐ 中程度 | ⭐⭐ 中程度 | ⭐⭐ 中程度 |

## 詳細分析

### セキュリティモデル比較

#### Deno（現状）

- **実行時セキュリティ**: `--allow-read=.`, `--allow-net=accounts.google.com:443,www.googleapis.com:443` で明示的に許可された操作のみ実行可能
- 悪意のあるコードが混入しても、ファイルシステムの任意読み取りやネットワーク接続は不可能
- **このプロジェクトでの適用**: 現在の `action.yml` で権限を最小限に制限済み

#### aube

- **インストール時セキュリティ**: lifecycle scripts のデフォルトブロック、24時間 cooling window、trust downgrade 検知
- `paranoid: true` でビルドjail（Seatbelt/Landlock）有効化
- exotic transitive deps ブロックで `git+`, `file:` プロトコルを拒否
- **制限**: 実行時の権限制御は提供しない

#### npm/pnpm

- npm: postinstall スクリプトが自動実行されるリスク
- pnpm: strict なモジュール分離でファントム依存関係を防止するが、スクリプト実行は制限しない

**結論**: Deno と aube のセキュリティは**補完的**だが、GitHub Action のユースケースでは Deno の実行時権限制御がより重要。

### GitHub Actions との相性

| ツール | セットアップ方法 | キャッシュ |
|--------|------------------|------------|
| Deno | `denoland/setup-deno@v2` 公式 | `actions/cache` + `~/.cache/deno` |
| npm | ネイティブ（setup-node内蔵） | `actions/cache` or `cache: 'npm'` |
| pnpm | `pnpm/action-setup` | `actions/cache` + pnpm store |
| aube | `mise` 経由 or npm global | 独自設定が必要 |

**現状の CI 構成**: `deno-ci.yml` を共通テンプレートとして使用しており、既に最適化されている。

### CI/CD ビルド時間・キャッシュ効率

このプロジェクトの依存関係はわずか **2パッケージ**（`@actions/core`, `gaxios`）であり、パッケージマネージャーの速度差は実質的に無視できる。

| シナリオ | Deno | npm | pnpm | aube |
|----------|------|-----|------|------|
| 初回インストール | ~1-2秒 | ~3-5秒 | ~2-3秒 | ~1秒 |
| キャッシュヒット | ~0.5秒 | ~1-2秒 | ~0.5秒 | ~0.2秒 |

**依存関係が少ないため、差は数秒以内**。

### 長期的なメンテナンス性

| 観点 | Deno | npm | pnpm | aube |
|------|------|-----|------|------|
| 安定性 | Deno 2.x LTS | Node.js LTS | 安定 | 新しいプロジェクト |
| 破壊的変更リスク | 低 | 低 | 低 | 中〜高（v1.x） |
| ドキュメント | 充実 | 最大 | 充実 | 発展途上 |

aube は 2026年時点で v1.5.x であり、メジャーバージョンアップ時の破壊的変更リスクがある。

## 推奨事項

### 1. 推奨オプション: Deno を維持

- 実行時セキュリティ制御が GitHub Action のユースケースに最適
- 移行コストゼロ
- TypeScript ネイティブで設定不要
- 依存関係が少ないため、パッケージマネージャーの速度メリットは限定的

### 2. 次点オプション: pnpm

- aube への移行を検討するなら、まず成熟した pnpm を検討
- strict モジュール分離でファントム依存関係を防止
- GitHub Actions でのサポートも確立済み

### 3. aube は将来的に検討

- セキュリティ機能は優れているが、エコシステムの成熟度が不十分
- 1-2年後に再評価推奨

## 移行する場合の注意点

**Deno → Node.js (npm/pnpm/aube) への移行時:**

### 1. コード変更

- `Deno.env.get()` → `process.env.VAR`
- `Deno.readFile()` → `fs.readFileSync()` or `fs/promises`
- `.ts` 拡張子を `.js` にするか、tsc/esbuild 等でトランスパイル
- `/// <reference lib="deno.ns" />` の削除

### 2. 設定ファイル追加

- `package.json` の作成
- `tsconfig.json` の作成
- ロックファイル生成

### 3. action.yml 変更

- `setup-deno` → `setup-node`
- npm/pnpm/aube の install コマンド追加
- `node dist/main.js` への変更（バンドル必要）

### 4. セキュリティ観点での損失

- **Deno の実行時パーミッション制御は失われる**
- 代替策なし（Node.js にはこの機能がない）

**移行工数見積もり: 約 2-4 時間**（テスト含む）

---

**最終結論**: 現在の Deno 構成は、このユースケースに対して最適なセキュリティモデルを提供しています。移行の必要性はありません。
