# キックオフ3D

ニューカッスル・バルセロナ・アーセナルで遊べる3Dサッカー（CPU対戦／同じ画面で2人／オンライン）。

## Cloudflareに公開（ブラウザだけ）

Cloudflareダッシュボード → Workers & Pages → 作成 → リポジトリをインポート → このリポジトリを選んでデプロイ。

## パソコンから公開する場合

必要なもの：Cloudflareの無料アカウント、パソコンに Node.js

```
cd このフォルダ
npm install
npx wrangler login      # ブラウザが開くのでCloudflareにログインして許可
npx wrangler deploy
```

最後に出てくる https://kick3d.〇〇.workers.dev をiPadで開けば遊べる。
友達にも同じURLを送れば「オンライン」で対戦できる（部屋を作る→4桁コードを伝える→相手が入る）。

- 初回 deploy で workers.dev のサブドメイン名を聞かれたら好きな名前をつける
- 中身を直したら npx wrangler deploy をもう一回するだけ
