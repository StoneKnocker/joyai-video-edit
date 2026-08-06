# React Router v7 with Better auth template code

## 环境变量
- .env 用来保存 VITE_开头的环境变量，VITE_开头的环境变量会被 Vite 注入到代码中，可以通过 import.meta.env.VITE_XXX 来访问。
- .env 中保存线上版本的配置，提交到 git 版本管理
- .dev.vars 用来保存本地环境的密钥， 只用来设置密钥. 不用 git 管理
- wrangler.jsonc 用来保存文本的环境变量，区分 dev 和 prod.
- 上线部署的时候，将密钥设置在worker的环境变量中.


## 新站上线步骤
### P1
- cf 域名解析,
  - 不阻止 / 内容信号策略
  - 爬虫开启配置: 域名 => 缓存 => 配置 => Crawler Hints
- preject-rebrand skill:
  - .env配置修改
  - wrangler.jsonc  配置
  - APP_NAME env（.env / wrangler）— 品牌名唯一来源
- setup-cloudflare-resource skill:
  - support邮箱配置, www跳转配置
  - cdn.xxx.com r2配置
- logo-surf skill
- sitemap 内容修改
- app/locales/json 文件内容处理
  - playground 文案
  - footer description 文案
- policy markdown文件内容处理
- og-image-gen && section-image-gen skill
  - 图片： introduce / benefit / hero / og-image
- pnpm wrangler secret put R2_SECRET_ACCESS_KEY --env=prod
- pnpm wrangler secret put BETTER_AUTH_SECRET --env=prod
- 提交gsc前进行审计

- indexnow skill 提交索引

如果需要登录, 还需配置
- google 授权
- signin 文案
- pricing

### P2
- D1, R2 配置
- plausible & ga4 & clarity
- gsc/webmaster提交

## 模型套壳使用流程
rsync -av --exclude .git --exclude node_modules source/ dest/

## 内容
- google trends + 过去 1 年, 看语言
- google ads + ahref 看长尾词
