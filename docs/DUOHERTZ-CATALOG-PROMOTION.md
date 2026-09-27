# duohertz 曲库暂存与签审边界

当前 duohertz 曲目只在 `apps/beatscape/candidates/duohertz/` 供内部试玩和审稿。旧版 `apps/beatscape/public/catalog.json`、线上 BeatScape 和旧发布器均不使用这些素材；旧发布器明确拒绝 `theme: duohertz` 和 `format: 2`。
旧站运行时的曲库读取现在也明确要求 `version: 1` 和 `theme: beatscape`，谱面读取要求对应曲目的 `format: 1`、ID 和难度一致。即使有人把 v2 暂存目录误放到旧站路径，旧页面会显示加载错误并可在恢复 v1 后重试，不会把新谱当成四轨谱播放。这只是隔离保护，**新品牌的正式曲库读取与玩家路径仍待实现**。
新建的 `src/duohertz/catalog.ts` 独立解析 v2 目录并读取 `format: 2` 新谱：结构需为 `brand: duohertz`、105 首、五类各 21 首，且曲目身份、时长、素材路径与谱面 ID／难度一致。仅开发构建中的 v2 首页／曲库／对局／音乐站预览会从独立 URL 读取该目录，明确拒绝 `site_and_deployment_approval: false`；对局只读取所选曲目的三档谱，音乐站只在播放时请求目录指定的长版音频，分别复用已从未审候选中拆出的玩法和电台组件。v2 审查页面有独立品牌外壳，开发 HTML 不预载旧版 v1 目录；旧站生产预载保留。此客户端检查**不核对素材字节或人工证据真实性**；合成目录浏览器测试不代表真实上线批准，正式玩家入口尚未接入。

同一页面会话内，已批准的 v2 目录按 URL 共用一次读取与解析：首页、曲库、对局、角色和音乐站切换不重复请求。网络失败、无效目录或未批准目录不会留在缓存；页面上的“Try again”会清除该 URL 的会话缓存并重新读取。独立审查包在合成目录下覆盖跨页单次请求与未批准后重试，这只验证浏览器行为，不是公开站点流量实测。

独立静态审查包可运行 `pnpm --filter @musicsaas/beatscape build:duohertz:preview` 生成于 `apps/beatscape/dist-duohertz/`，再运行 `pnpm --filter @musicsaas/beatscape test:duohertz:preview` 验证构建后的根首页→曲库→对局→音乐站与未批准目录拒绝。它采用新品牌 HTML、路由与 CSS，`noindex`，不复制旧 `public/`、旧曲库、旧 PWA 或旧 SEO URL；真实目录及发布地址尚未接入，不能部署为公开站点。根路径下的旧 ScapeMusic `/#/track/bs-*` 分享链接会直接进入旧曲过渡页，不请求新目录；这只保证链接到达新包之后的页面行为，独立旧域名的实际跳转仍待迁移。浏览器成功用例使用完整的**合成批准 fixture**，没有生成实际签审记录。

审查构建的站点页头同时显示 `Internal preview · not released`，手机也可见；这个可见状态由构建标志控制，不能只依赖网页源码里的 `noindex` 告知试玩者。标记不修改目录批准字段，也不会给未审素材开通正式玩家路径。

`pnpm --filter @musicsaas/beatscape build:duohertz:source` 另在本机生成 `apps/beatscape/dist-duohertz-source/`，供未来签审后的发布组装使用。此模式与审查包一样隔离旧站 `public/` 和旧页面 chunk，保留 `noindex`、不附真实目录或角色素材；它的玩家 UI 不显示内部预览标签，以便测试未来站点路径。`pnpm --filter @musicsaas/beatscape test:duohertz:source` 以合成完整目录覆盖首页和拒绝未批准内容。源码包不是网站发布候选，更没有授予 `site_and_deployment_approval`；须经下述组装器检查、真实站点级签审及最终产物验证才可能成为发布候选。

本地最终组装器现为 `scripts/duohertz-assemble-release.py`。它要求两类暂存产物及上述四份原始来源材料完整复核，再要求独立站点签审和四张**已批准**的站点 PNG（`icon-192.png` 192²、`icon-512.png` 512²、`apple-touch-icon.png` 180²、`og.png` 1200×630），并通过本机 `ffmpeg` 验证图片可解码。站点签审 JSON 必须由真实审稿流程提供：`schema: 1`、`scope: "duohertz_site_signoff"`、`siteApproval: true`、`approvedBy`、带时区 `approvedAt`、HTTPS 根地址 `siteOrigin`、最终英文 `shortSlogan`，以及当前 `sourceBuildTreeSha256`、`catalogJsonSha256`、`charactersJsonSha256` 和四张图各自的 `siteImagesSha256`。`checks` 须恰有 `branding`、`gameplay`、`accessibility`、`performance`、`legal` 五项；每项包含 `status: "pass"`、`reviewedBy`、早于总站点批准的带时区 `reviewedAt`、相对签审文件的 `evidence` 路径及其 `sha256`。证据和图像不得为软链接。所有哈希由当前字节计算，任一改动都需重新审查；工具仅核对格式、时序和字节，不能证明签字者身份或判断审查结论。合成测试记录绝不算正式签审。

英文短句尚待用户选定；当前开发／审查构建暂用目标文档的首选 `Music for you. Be your true hertz.`，这仍不是最终批准。确认后需以 `VITE_DUOHERTZ_SHORT_SLOGAN='<最终英文短句>' pnpm --filter @musicsaas/beatscape build:duohertz:source` 重建源码包，再以该包重新计算树哈希并签审。组装器要求已签短句真实出现在编译后的玩家 UI 中，避免 HTML 标题与页面口号不同。

材料齐备后才在本机运行（输出目录必须不存在，且不能与旧站 public、候选或输入目录重叠）：

```sh
python3 scripts/duohertz-assemble-release.py \
  --source-build apps/beatscape/dist-duohertz-source \
  --catalog-stage <曲库暂存目录> --character-stage <角色暂存目录> \
  --observations <人工观察导出.json> --catalog-signoff <曲库签审.json> \
  --roster <已审角色目录>/roster.json --character-signoff <角色签审.json> \
  --site-art <已审站点图片目录> --site-signoff <站点签审.json> \
  --out data/duohertz-site-release-candidate
```

成功时组装器把独立源码包、105 首曲目和三名角色复制到新目录；仅在这个最终包里把两份 `site_and_deployment_approval` 改为 `true`，并写入获批 slogan／站点根地址、canonical／OG、图标、PWA manifest、robots、sitemap、SPA 路由规则和来源指纹。提交输出目录前它会调用同一套最终产物核验；之后可独立在本机重跑 `python3 scripts/duohertz-verify-release.py --site <已组装目录>`，逐文件复核 105 首／315 谱、三人正侧图、代码资源树、站点图哈希与可解码性、目录批准位、canonical／OG／PWA／robots／sitemap／SPA 规则，并拒绝额外文件与软链接。独立核验**只证明包内一致性**，其 `source_evidence_rechecked: false` 表示它不重新读取外部签审；完整人工来源仍需组装时复核。单独拿 noindex 源码包给核验器会失败。

组装与核验都不改旧站、审查包或原暂存目录，也不触发远程访问、部署、push。输出还需真实最终产物浏览器／性能验收、发布门禁核查与单独的部署授权。目前四份人工来源、两类真实暂存目录、站点图和站点签审均不存在，因此组装命令按设计失败，**当前没有可发布网站包**。

角色页的未来数据入口与曲目暂存完全分离：`duohertz-v2/characters.json` 需包含 `version: 1`、`brand: "duohertz"`、三名唯一角色且 Attacker／Support／Buffer 各一、`source_character_signoff_sha256` 与 `site_and_deployment_approval: true`；每人的正面／侧面只允许 `/characters/<id>/front.png`、`/characters/<id>/side.png`。独立包及开发 v2 角色页先要求获批音乐目录，再尝试加载角色清单；目前仓库**没有**真实清单或生产角色图，故真实路径保持不可用。合成清单浏览器测试只证明路由、布局和拒绝边界，`source_character_signoff_sha256` 字段与客户端检查都不能证明人工签字、名称权利、图像原创性或文件哈希。角色签审证据核验、生产图打包与整个站点的发布批准需要独立完成，不由曲库暂存工具签署。

`python3 scripts/duohertz-build-characters.py` 是**角色暂存**入口。当前无参运行只报告缺少另行审查的三人 roster 与独立签审，返回非零，不写文件。完成真实人工审查后，先在候选和 `public/` 之外建立 `roster.json`：`schema: 1`、`brand: "duohertz"`、恰好三名角色，每人有 `id`、名称／称号／Role／地区／身高／身份／性格／台词／120–180 词故事、正侧面 alt，以及固定 `/characters/<id>/front.png`、`side.png` 路径和两张 PNG 的 `art_sha256`、`side_art_sha256`。对应文件放在 roster 同级的 `characters/<id>/`。工具核对角色不重名、三种 Role 各一、同源路径、图片 SHA-256、透明 RGBA PNG 的最低 512×768 尺寸及本机解码；这些技术检查不评价作品质量。

独立签审 JSON 必须有 `schema: 1`、`scope: "duohertz_character_signoff"`、`charactersApproval: true`、`approvedBy`、带时区的 `approvedAt`、当前 `roster_sha256`，并为三名 `id` 各附 `name`、`rights`、`art`、`copy` 四类人工记录。每类记录需有 `status: "pass"`、`reviewedBy`、早于总批准时间的 `reviewedAt`、相对签审文件的证据路径 `evidence` 及证据 `sha256`。不得用自动生成的假记录充数；工具能校验文件字节与时间顺序，不能证明签字者身份或判断法律／美术结论。真实资料齐备后仅在本机运行：

```sh
python3 scripts/duohertz-build-characters.py --roster <已审角色目录>/roster.json --signoff <角色签审.json> --out data/duohertz-character-release-candidate
```

输出到全新隔离目录，包含 `characters.json` 与三名角色的正／侧面 PNG，保留每张图的 SHA-256 和签审文件哈希，**始终写入 `site_and_deployment_approval: false`**。这一步不会复制旧角色或修改线上目录；最终站点批准、与音乐目录组合、发布产物核验和部署仍是后续独立门禁。即使手改暂存 JSON 的布尔值，客户端也无法证明人工审查，不能作为上线依据。

`python3 scripts/duohertz-build-catalog.py` 是新品牌**曲库暂存**入口，不是网站部署或发布批准。无参数运行只报告阻塞，不写文件。现有隔离技术候选 105/105 首、315/315 张新谱，五种子风格各 21 首，技术结构已完整；各有与游戏版不同且至少长 1.8 倍的 120／128 秒 stream 长版。前十六首分别编排后半段；其后 SA3 候选中《Pulse Terrace》《Foamstep》及第 96–105 首从各自单次生成的 180 秒母带取连续 32–160 秒，其余从单次 128 秒母带制作。全库仍未经人工耳检、内容／权利／美术核查，缺人工观察导出与独立目录签审，所以脚本返回非零、`site_and_deployment_approval` 为 false。数量达标不能称作已验收的电台曲库。

SA3 路径可复用 `scripts/duohertz-generate-sa3.py`、`scripts/duohertz-chartgen.py` 与 `scripts/duohertz-stage-sa3.py`：使用新曲配方、Gateway 任务回执、双声道母带和两张原创图，在隔离临时目录编码游戏版／电台版、按最终 AAC 起音生成新谱、记录来源哈希，并先过单曲 BS-D002、保守的过稀谱面异常检查与三个 AAC 的真峰值筛查才移入候选目录。该密度下限仅用于发现明显不稳的起音／拍点草谱，不是正式玩法难度或人工手感批准。暂存前预检会拒绝全段重复、静音、严重削波和相同左右声道；Worker 的 MLX 健康、任务回执和立体声文件仍只能排除已知单声道占位回退，不能独立证明逐任务模型执行；音频质量、可能的近似性和权利仍必须人工审查。源 WAV 位于本地忽略目录，正式证据需保存与候选 manifest 相同的哈希。

按 [BS-D003](BEATSCAPE-DECISIONS.md#bs-d003) 的本地范围，第 81 首《Braided Pulse》的封面和 OG 由仓内 `scripts/duohertz-art-sources/` 中的原创 SVG 经本机 `sips` 渲染；暂存时先复算 SVG 渲染 PNG 与输入图的字节哈希，再将源 SVG 路径／哈希和 PNG 哈希写入 manifest。脚本拒绝 SVG 内的脚本、外部图片及远程引用；技术门禁重放渲染与暂存缩放，拒绝来源文件变化或候选 PNG 不符。旧 imagegen 候选仍保留各自原始来源记录。这个可追溯制作方式不代替美术、原创性或目标受众审查。

从《Chromatic Fanout》起，SA3 暂存按最终游戏 AAC 的估计 BPM 制谱，并在 manifest 保留配方目标 BPM；仅当估计值距目标不超过 2% 才允许暂存，偏差更大需复查或重做母带。这样避免小幅实际速度漂移使固定目标网格漏掉大量起音；BPM 估计算法和自动贴合仍不能证明谱面手感或真实听感，必须人工验收。

暂存入口依次要求：

本机可先运行 `pnpm --filter @musicsaas/beatscape test -- src/duohertz/catalogPlayability.test.ts`，把当前 manifest 哈希绑定的 315 张谱逐一送入 duohertz 状态机：精确按谱输入应全部判为 Perfect、每张双键谱的两名玩家结果分别闭合；完全不输入则每张谱应完整结算为 Miss、不会因默认家庭玩法失败。此测试核对**当前候选与纯逻辑判定器**，不播放音频、不验证真人时序手感、实体输入或审稿批准；候选被改动后须重跑。

1. 五个电音方向各 21 首，共 105 首；每首三张 `format: 2` 新谱和完整素材哈希。结构审计还拒绝跨曲游戏版／电台版音频字节完全相同；旋律近似和不同编码的重复内容仍须人工盲测。
2. 每首运行 BS-D002 音频／谱面技术门禁，并对游戏、48 秒预览和电台长版分别检查解码后真峰值 ≤−1.0 dBTP；人工仍须判断响度平衡和听感。游戏音频与预览时长必须准确；`stream.m4a` 可比游戏版更长，暂存时必须为**不同文件**且时长至少为游戏版的 1.8 倍，沿用旧站对完整版的最低比例要求。
3. 本地[审稿工作表](../apps/beatscape/candidates/duohertz/review-worksheet.html)直接显示与未来目录一致的自包含 `cover-art.png`，并提供电台完整版、游戏版和 48 秒试听三个独立播放器及其哈希，方便核对各版本；谱面手感仍须进入本地试玩页。工作表可按曲名／ID 和待审／需修改／已完成筛选；六项均已填写、且需修改／拒绝附备注时才计入已审。导出 JSON 后可在同一素材哈希下导入续审，导入会替换浏览器本地草稿，旧素材或字段不匹配会拒绝。最终 JSON 需对当前全部素材六项观察为 Pass；`duohertz-review-audit.py` 校验导出记录与 manifest、逐文件哈希完全一致。观察记录本身始终 `releaseApproval: false`。

4. 独立目录签审 JSON 对每首当前 manifest 绑定 `earcheck`、`content`、`rights`、`art` 四类人工记录；每类记录包含 `status: "pass"`、`reviewedBy`、带时区的 `reviewedAt`、相对签审文件所在目录的证据路径 `evidence`，以及证据文件的 SHA-256 `sha256`。总签审包含 `schema: 1`、`scope: "duohertz_catalog_signoff"`、`catalogApproval: true`、`approvedBy`、`approvedAt`、`observations_sha256` 与覆盖全部 105 首的 `tracks`；每个 track 还要有 `track_id`、当前 `manifest_sha256` 和四类记录。工具检查格式、范围和哈希，**不能独立证明签字者身份或判断音乐／权利／美术质量**；这些由真实审稿和签审流程负责，不得用自动生成的假记录填充。

封面整批审稿可先运行 `python3 scripts/duohertz-cover-contact-sheet.py` 重建本地[封面联系表](../apps/beatscape/candidates/duohertz/cover-contact-sheet.html)：它复用工作表的逐文件哈希核对，按五类曲风并排展示 105 张当前候选与 56px 缩略图，点击直达同一曲的工作表记录。联系表与单曲替代稿都不改 manifest 或签审；任何正式美术替换仍须重制封面和 OG、重算来源／素材哈希并重新审稿。

曲库卡片使用由当前 `cover-art.png` 派生的 240×240 WebP，不在 240px 卡位直接请求 1024px 审稿原图。未来获批电台的 240px 主封面和 64px 列表同样读取该卡图；独立审查包浏览器合同拒绝原图请求。需本机 `cwebp`；可用 `tests/.venv/bin/python scripts/duohertz-cover-thumbs.py` 重建候选卡图、用 `--check` 对照原图和索引哈希；现有 105 张原图 136,228,923 字节，派生卡图合计 1,115,416 字节（约减少 99.2%）。派生图在 `thumbnails/`，不改原图、manifest 或人工审稿工作表；未来获批目录暂存器会从签审原图重新派生 `cover-thumb.webp`，写入路径与 SHA-256，并在复制过程中复核每个素材与原 manifest 哈希。对局的大图、OG 和人工美术判断仍使用原资产。当前独立审查包只含代码和合成测试素材，没有真实获批目录，流量改善尚未在真实公开站点测量。

曲间差异化可先在本机用 `tests/.venv/bin/python scripts/duohertz-similarity-prescreen.py` 重建[对照试听队列](../apps/beatscape/candidates/duohertz/similarity-listening.html)和 `similarity-prescreen.json`。脚本逐首核对候选素材哈希，经本机 `ffmpeg` 解码 48 秒试听，用每秒 12 音级能量和短时移位从全部 5,460 对中先取 400 对、再列 24 对相对高分线索；页面先显示 A/B 音频，展开后才显示曲名、预览哈希与对应审稿行。路径仍可被查看，故仅是遮名界面而非受控盲测。只分析试听前 48 秒，可能漏掉后段相似或旋律不同但编配近似的曲目，也可能把同曲风的正常共性排前；分数没有通过阈值，不授予原创性、差异化或发布批准。人工仍需听完整音频、记录具体时间点与比较对象，并在当前哈希绑定的工作表中留下真实判断。

曲间响度复听顺序可在本机运行 `tests/.venv/bin/python scripts/duohertz-loudness-review.py` 重建[响度对照页](../apps/beatscape/candidates/duohertz/loudness-review.html)及同名 JSON。脚本先复核 105 首候选 manifest 与全部资产哈希，再用 `ffmpeg` 对 315 份游戏／电台／试听 AAC 测量解码后 LUFS 和真峰值，测量后重新核对音频与 manifest 哈希。页面按“游戏版距全库中位数”与“电台版距同曲游戏版”的较大绝对差排序，逐曲显示三个版本、素材指纹和对应人工审稿行；排名只决定**先听哪里**，不是统一响度目标或通过阈值，不能替代前后曲连听、接缝、儿童可听性和人工母带判断。当前报告游戏版中位数 −20.94 LUFS、范围 −22.86 至 −15.36 LUFS；内容改动后必须重建报告。

真实证据齐全时，运行：

```sh
python3 scripts/duohertz-review-audit.py --report <人工观察导出.json>
python3 scripts/duohertz-build-catalog.py --observations <人工观察导出.json> --signoff <目录签审.json> --out data/duohertz-release-candidate
```

输出必须是尚不存在、且位于旧站 `public/` 和候选目录之外的隔离目录。工具复制通过门禁的素材，写入 `version: 2`、`brand: "duohertz"` 的新 `catalog.json` 和来源哈希；输出仍标注 `site_and_deployment_approval: false`。后续还须完成品牌短句选择、角色命名／美术、正式玩家路径、站点元数据／PWA／流媒体接入、性能与发布验收；这些不由曲库暂存命令代签。

两类真实暂存产物齐备后，可在本机运行 `python3 scripts/duohertz-check-staged-content.py --integrity-only --catalog-stage <曲库暂存目录> --character-stage <角色暂存目录>`。这只是只读的**包内一致性**模式：复核 105 首／五类各 21 首、315 张谱的身份和路径、manifest 与音频／谱面／封面／OG／卡图的字节哈希，以及三名角色的正侧图哈希、独立角色身份和故事长度；缺任一暂存目录、文件变化、软链接或手改批准位都会返回非零。此模式成功仍报告 `source_evidence_verified: false`，有人连同 manifest 改写素材时可能绕过这一层。无参运行会按默认的完整来源模式列出暂存目录和四份原始材料均缺失。

默认的正式发布准备检查须把原始材料一并提交给本地复核，四项来源参数缺一即失败；不加 `--integrity-only` 时，单有两个暂存目录也会非零退出：

```sh
python3 scripts/duohertz-check-staged-content.py \
  --catalog-stage <曲库暂存目录> --character-stage <角色暂存目录> \
  --observations <人工观察导出.json> --catalog-signoff <曲库签审.json> \
  --roster <已审角色目录>/roster.json --character-signoff <角色签审.json>
```

此模式重新核对观察导出与暂存的每首 manifest／资产哈希、105 首四类曲库签审与证据文件、角色 roster 的正侧透明图和三人四类签审，并要求暂存角色内容与已审 roster 一致；原始资料和暂存包同时改写仍需重新取得有效签审。自动工具只能验证格式、时间与文件哈希，不能证明签审者身份、审稿真实性或内容／权利结论。`source_evidence_verified: true` 仍保持 `site_and_deployment_approval: false`，不生成正式发布包；品牌短句、站点级批准、上线元数据、最终产物和部署门禁仍须独立完成。本机技术 PASS 不能作为公开部署许可。

新目录的 `cover` 指向自包含的 `cover-art.png`。候选 `cover.svg` 只是引用同目录图片的标题包装，在浏览器 `<img>` 中外部图片引用不能可靠显示；正式封面若需要嵌入标题，应在美术审查后生成自包含文件，并更新 manifest、哈希及签审记录。

专项真机验收按 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001) 已取消，不自动回到 TODO；取消不等于发布门禁通过。旧站签审与旧目录仍独立保留。
