# Google広告レポート自動化WEBアプリケーション

複数のGoogle広告アカウントのパフォーマンスを一元管理・分析するWEBアプリケーション。
キャンペーン、広告グループ、広告文、アセットごとにメトリクスをグラフ化し、
運用効率を大幅に改善します。

## 📋 プロジェクト情報

- **リポジトリ**: [gomaazarashi/adreport](https://github.com/gomaazarashi/adreport)
- **言語**: TypeScript、JavaScript
- **フレームワーク**: Next.js 16+ (App Router)
- **スタイリング**: Tailwind CSS 4
- **バックエンド**: Supabase (PostgreSQL)
- **API**: Next.js API Routes
- **グラフ**: Recharts
- **ライセンス**: MIT

## 🚀 クイックスタート

### 必須環境

- Node.js 18.0 以上
- npm 9.0 以上
- Git
- Supabase アカウント

### インストール手順

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/gomaazarashi/adreport.git
   cd adreport
   ```

2. **依存パッケージをインストール**

   ```bash
   npm install
   ```

   または

   ```bash
   npm install --legacy-peer-deps
   ```

3. **環境変数を設定**

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` を編集して、以下の情報を入力してください：

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_api_key_here
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

   **Supabase認証情報の取得方法**:
   - [Supabase Console](https://app.supabase.com) にアクセス
   - プロジェクトを選択 → Settings → API
   - URL と Keys をコピー

4. **ローカルサーバーを起動**

   ```bash
   npm run dev
   ```

5. **ブラウザでアクセス**

   ```
   http://localhost:3000
   ```

## 📁 ファイル構造

```
adreport/
├── src/
│   ├── app/
│   │   ├── api/                    # API ルート
│   │   │   ├── accounts/           # アカウント管理API
│   │   │   ├── metrics/            # メトリクス取得API
│   │   │   ├── csv-import/         # CSV インポートAPI
│   │   │   └── analysis/           # AI分析API
│   │   ├── layout.tsx              # アプリケーションレイアウト
│   │   ├── page.tsx                # トップページ
│   │   ├── globals.css             # グローバルスタイル
│   │   └── favicon.ico
│   ├── components/
│   │   ├── Dashboard/              # ダッシュボード関連
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AccountSelector.tsx
│   │   │   ├── MetricsCards.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── DetailTable.tsx
│   │   ├── DataImport/             # データインポート関連
│   │   │   └── CSVUploader.tsx
│   │   ├── Charts/                 # チャートコンポーネント
│   │   │   ├── LineChart.tsx
│   │   │   └── BarChart.tsx
│   │   └── Ui/                     # 基本UIコンポーネント
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Select.tsx
│   ├── lib/
│   │   ├── supabase.ts             # Supabaseクライアント
│   │   ├── types.ts                # TypeScript型定義
│   │   ├── metrics-calculator.ts   # メトリクス計算ユーティリティ
│   │   └── api-clients.ts          # API クライアント
│   ├── hooks/
│   │   ├── useMetricsData.ts       # メトリクスデータ取得フック
│   │   └── useAccounts.ts          # アカウント管理フック
│   ├── styles/
│   │   └── globals.css             # グローバルスタイル
│   └── public/
│       └── sample-data/            # テスト用サンプルデータ
│           ├── google-ads-sample.csv
│           └── google-ads-sample-previous.csv
├── .env.example                    # 環境変数テンプレート
├── .env.local                      # 環境変数（ローカル、.gitignore済み）
├── .vscode/
│   ├── settings.json               # VS Code設定
│   └── extensions.json             # 推奨拡張機能
├── .prettierrc.json                # Prettier設定
├── .eslintignore                   # ESLint無視ファイル
├── tsconfig.json                   # TypeScript設定
├── next.config.js                  # Next.js設定
├── tailwind.config.ts              # Tailwind CSS設定
├── package.json                    # プロジェクト依存関係
├── package-lock.json               # 依存関係ロック
├── README.md                       # このファイル
└── .gitignore
```

## ✨ 機能（開発ロードマップ）

### ✅ Phase 1: 基盤構築（完了）

- [x] Next.js + TypeScript + Tailwind CSS セットアップ
- [x] Supabase クライアント設定
- [x] TypeScript型定義（Account、Campaign、Metricsなど）
- [x] メトリクス計算ユーティリティ
  - CTR（クリック率）、CVR（コンバージョン率）、CPA（顧客獲得単価）の自動計算
  - 期間比較分析
  - メトリクス集約機能
  - 異常値検出
  - パフォーマンススコア算出
- [x] サンプルCSVデータ（2期間分）
- [x] プロジェクト設定ファイル

### 🔄 Phase 2: CSVインポート機能（予定）

- [ ] CSVファイルアップロード UI（ドラッグ&ドロップ）
- [ ] CSVパース＆バリデーション機能
- [ ] Supabaseへのデータ挿入
- [ ] インポート履歴管理
- [ ] Looker Studio API連携（オプション）
- [ ] 自動スケジュール取得機能

### 📊 Phase 3: ダッシュボード構築（予定）

- [ ] アカウント別ダッシュボード
- [ ] キャンペーン分析ビュー
- [ ] 広告グループ分析ビュー
- [ ] 広告文別パフォーマンス表示
- [ ] クリエイティブ別分析
- [ ] 期間比較機能
- [ ] 各種グラフ（折れ線、棒グラフ、ヒートマップ）
- [ ] 詳細データテーブル（ソート・フィルター機能）

### 🧠 Phase 4: AI分析＆改善提案（予定）

- [ ] Claude API 連携
- [ ] パフォーマンス自動分析
- [ ] 改善提案の自動生成
- [ ] 異常検知アラート
- [ ] 運用者コメント機能
- [ ] レポート出力（PDF）

### 🎨 Phase 5: クリエイティブ自動生成（予定）

- [ ] アカウント別画像フォルダ管理
- [ ] クリエイティブパフォーマンス分析
- [ ] 高効果クリエイティブの自動抽出
- [ ] Claude Vision API による画像分析
- [ ] 類似高パフォーマンスデザイン提案
- [ ] A/Bテスト管理

## 🛠 開発コマンド

### ローカル開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プロダクション実行

```bash
npm start
```

### Linting チェック

```bash
npm run lint
```

### TypeScript チェック

```bash
npx tsc --noEmit
```

## 📦 依存パッケージ

### メインのフレームワーク
- **next**: 16.x - React フレームワーク
- **react**: 19.x - UI ライブラリ
- **typescript**: 最新 - 静的型チェック

### UI & スタイリング
- **tailwindcss**: 4.x - ユーティリティファーストCSSフレームワーク
- **recharts**: 2.x - React グラフコンポーネント

### バックエンド & DB
- **@supabase/supabase-js**: 2.x+ - Supabase クライアント
- **supabase**: 最新 - Supabase CLI

### ユーティリティ
- **papaparse**: 5.x+ - CSVパーサー
- **axios**: 1.x+ - HTTP クライアント

## 🔐 セキュリティ

- **環境変数**: .env.local は .gitignore に含まれています
- **Supabase認証**: Row Level Security (RLS) ポリシーで保護
- **API認証**: JWT トークンベース認証（実装予定）
- **入力検証**: すべてのAPI入力をバリデーション
- **CORS設定**: Supabase側で管理

## 🧪 テスト

サンプルデータ（public/sample-data/）を使用してテストできます：

```bash
# ローカルで動作確認
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# CSVアップロード機能をテスト（実装後）
```

## 📝 Git ワークフロー

### ブランチ戦略

- **main**: 本番環境用（安定版）
- **feature/***: 機能開発用
- **bugfix/***: バグ修正用

### コミット作成例

```bash
# 新機能の開発
git checkout -b feature/phase2-csv-import
# ... 開発 ...
git add .
git commit -m "feat: Implement CSV upload functionality

- Add CSVUploader component with drag & drop
- Implement CSV parsing using papaparse
- Add data validation"
git push origin feature/phase2-csv-import

# GitHub上でPull Requestを作成 → mainにマージ
```

## 🚨 トラブルシューティング

### Supabaseに接続できない

**症状**: コンソールに "Supabase credentials are not configured" エラー

**解決方法**:
1. .env.local ファイルが存在するか確認
2. Supabase の認証情報が正しく入力されているか確認
3. npm run dev を再起動

```bash
cat .env.local | grep NEXT_PUBLIC_SUPABASE
```

### ビルドエラーが発生

**症状**: npm run build で TypeScript エラーが出る

**解決方法**:
```bash
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### ポート 3000 が既に使用されている

**症状**: "Port 3000 is already in use" エラー

**解決方法**:
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# または別のポートで起動
npm run dev -- -p 3001
```

### TypeScript 型エラー

**症状**: VS Code で型エラー（赤波線）が表示される

**解決方法**:
1. VS Code を再起動
2. TypeScript サーバーをリロード (Cmd+Shift+P → "TypeScript: Restart TS Server")
3. 必要に応じて node_modules を削除して再インストール

## 💡 推奨 VS Code 拡張機能

- **Prettier**: ESLintと統合したコード整形
- **ESLint**: コード品質チェック
- **Tailwind CSS IntelliSense**: Tailwind CSS クラス補完
- **Thunder Client**: API テストツール
- **TypeScript Vue Plugin**: TypeScript サポート

これらは `.vscode/extensions.json` で推奨されています。

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)

## 🤝 貢献方法

1. このリポジトリを Fork
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'feat: Add AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. Pull Request を作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。

## 📞 サポート

問題が発生した場合：

1. [Issues](https://github.com/gomaazarashi/adreport/issues) を確認
2. 必要に応じて新しい Issue を作成
3. 詳細な情報を含める（エラーメッセージ、環境情報など）

## 🎯 プロジェクト目標

- ✅ 複数Google広告アカウントの一元管理
- ✅ 自動レポート生成による運用効率化
- ✅ AI分析による改善提案
- ✅ クリエイティブ自動生成による制作時間短縮
- ✅ 直感的なUIによる即座の数値把握

---

**最終更新**: 2024年4月
**バージョン**: 1.0.0 (Phase 1 完了)
**開発チーム**: gomaazarashi
