# BeatScape production fonts

These WOFF2 files are the Latin and Latin Extended subsets served by the
official Google Fonts CDN. They are bundled by Vite into `/assets`, which also
places them inside the service worker's verified offline shell.

- Anton 400, release v27
- Sora variable 600–800, release v17
- IBM Plex Sans variable 400–700 and italic 400, release v23
- IBM Plex Mono 600 and 700, release v20

The fonts are licensed under the SIL Open Font License 1.1. Copyright notices
and the complete license ship at `/licenses/fonts/FONT-LICENSES.txt`.

## Provenance

Downloaded 2026-09-13 from the official `fonts.gstatic.com` URLs returned by
Google Fonts CSS. SHA-256 is recorded so a future refresh cannot silently swap
font binaries.

| File | Upstream URL | SHA-256 |
|---|---|---|
| `anton-latin-ext.woff2` | `https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3K9-C8QSw.woff2` | `0d17b7880f389deeb6663a52fa4eadc6d9116bdda725f0aa1f3d404fbb7d3d59` |
| `anton-latin.woff2` | `https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8.woff2` | `d0fa07ff63dd60cbc0e2f58e29c802dca2a5ae0276c999f59c6111ab7bbaec3b` |
| `sora-latin-ext.woff2` | `https://fonts.gstatic.com/s/sora/v17/xMQ9uFFYT72X5wkB_18qmnndmSdSnh2BAfO5mnuyOo1lfiQwWa-xsaQ.woff2` | `08e1ba85bcb55277782f56766af09467dfe18cbeea49704203100c5797ac4cc5` |
| `sora-latin.woff2` | `https://fonts.gstatic.com/s/sora/v17/xMQ9uFFYT72X5wkB_18qmnndmSdSnh2BAfO5mnuyOo1lfiQwV6-x.woff2` | `811e11966d29f3a01fcb19b087b61ac067d380665a55aebb7fcdf2cda95e4a93` |
| `ibm-plex-sans-latin-ext.woff2` | `https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxQKYbABA.woff2` | `d160e20920ae4d6556518d352d3af27a74e9b0de3d8fe17b1c1044fc75aa2f81` |
| `ibm-plex-sans-latin.woff2` | `https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYY.woff2` | `e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470` |
| `ibm-plex-sans-italic-latin-ext.woff2` | `https://fonts.gstatic.com/s/ibmplexsans/v23/zYXEKVElMYYaJe8bpLHnCwDKhdTEG46kmUZQCX598fQbM4jw8V78x9OWIhqbQ5g0voKW6g.woff2` | `c5c00e8a32022dfedd2e7e864898ed007232e1450c6de1d6b847fe8825c2c5ce` |
| `ibm-plex-sans-italic-latin.woff2` | `https://fonts.gstatic.com/s/ibmplexsans/v23/zYXEKVElMYYaJe8bpLHnCwDKhdTEG46kmUZQCX598fQbM4jw8V78x9OWIhqbQ5g6voI.woff2` | `6de912e531b6c98084f1b2d5e5a91bad77be4e68bc4e396e43c46fc435e5f3d9` |
| `ibm-plex-mono-600-latin-ext.woff2` | `https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3vAOwl5FgtIU.woff2` | `32057cf50dd14bdb21a2c93766c4a2c43e4abe688ea3922df3203cac7751a98b` |
| `ibm-plex-mono-600-latin.woff2` | `https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3vAOwlBFgg.woff2` | `0d1f0b8d0722224e32e9f28261bdc86c79115be73444ae5eceb73976a1bcdf83` |
| `ibm-plex-mono-700-latin-ext.woff2` | `https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3pQPwl5FgtIU.woff2` | `5b9b81f54dd69635c7adcaacd4c4545a73fe4809c528e22734b238a83a74135f` |
| `ibm-plex-mono-700-latin.woff2` | `https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3pQPwlBFgg.woff2` | `4f84d86cfd060f4ded334358ff8a4c81d4db2ed5addd568359d693f44a87765a` |
