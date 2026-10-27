# ピンチに強いのは誰だ！？NEXUSキャットアンドチョコレート

ゲームマスター一人で進行できる、ブラウザ版のパーティーゲーム進行アプリです。

## 公開サイト

GitHub Pages: https://yuzuran0902-crypto.github.io/nexus-cat-and-chocolate/

ChatGPT Sites: https://cat-chocolate-gm-1027.laborobo.chatgpt.site


## 主な機能

- 2〜6チームの編成
- 各チームへのアイテムカード5枚の配布
- ピンチエピソードと使用枚数1〜3枚のランダム抽選
- 選択したカードの発表用全画面表示
- 複数審査員を想定したチーム別の自由な配点
- 使用カードの山札返却と自動補充
- ブラウザ内へのカスタムカード追加
- エピソードの音声読み上げ

## ローカルで起動

ビルドは不要です。リポジトリのルートで次を実行してください。

```bash
python3 -m http.server 8000 --directory dist
```

その後、`http://localhost:8000` を開きます。

## 構成

- `dist/index.html` — 画面構造
- `dist/styles.css` — レスポンシブデザイン
- `dist/app.js` — ゲーム進行・カード・得点処理
- `dist/assets/` — エピソード用画像
