# Agent Lint Yol Haritasi (Master)

Bu dokuman, Agent Lint'in bir web-demo aracindan gunluk gelistirici akisina giren bir urune evrilmesi icin ana yol haritasini tanimlar.

Bu dosyanin hedefi:
- Oncelikleri netlestirmek
- Fazlari bagimliliklara gore siralamak
- Teknik uygulama adimlarini ilgili kod dosyalariyla eslemek
- Kod asistanlarinin (Cursor, Windsurf, Codex, Claude Code vb.) dogrudan uygulayabilecegi net bir referans sunmak

Iliskili plan dokumanlari:
- `docs/phased_implementation_plan.md`
- `docs/engineering_guardrails.md`
- `docs/agent_execution_backlog.md`

Temel referans dokumanlari:
- `docs/core_doc_1.txt`
- `docs/core_doc_2.md`
- `docs/PRD.md`
- `docs/rules.md`
- `AGENTS.md`

---

## 1) Stratejik Hedef

Agent Lint'in stratejik hedefi 3 asamada tanimlanir:

1. Dogru analiz veren guvenilir Judge cekirdegi (kalite + guvenlik)
2. Vibe coding akisina uygun hizli UX (anlik geri bildirim + streaming)
3. IDE icine gomulu calisma (MCP + CLI) ile copy/paste surtunmesini kaldirmak

Bu hedef, su anki sistemin ana darbogazlarina dayanir:
- Tekil girdi analizi (baglamsiz degerlendirme) `src/server/api/routers/artifacts.ts`
- Regex merkezli kirilgan risk tespiti `src/server/services/artifact-analyzer.ts`
- Kisa ve genel prompt seti `src/server/services/prompt-templates.ts`
- Streaming eksikligi `src/trpc/react.tsx`
- Hardcoded template yapisi `src/components/editor-workbench.tsx`

---

## 2) Onceliklendirme (P0 -> P3)

### P0 (Bloklayici, once bunlar)
- Judge prompt parity: `core_doc_2` type-specific promptlarin koda tasinmasi
- Project Context Mode: tek dosya yerine coklu artefakt baglamiyla analiz
- Static + semantic iki katmanli risk analizi (regex sadece sinyal)
- Provider fallback seffafligi (UI'da neden fallback oldugu gorunur)

### P1 (Yuksek deger)
- Streaming analiz geri bildirimi
- Client-side instant pre-lint (anlik warning)
- Diff + rationale annotation (neden degisti?)
- Selective apply (kabul et / reddet)

### P2 (Urunlesme ivmesi)
- MCP server (stdio + streamable HTTP)
- CLI komutlari
- Dynamic template registry
- URL import + House Rules

### P3 (Surdurulebilirlik)
- Analyzer modulerlestirme
- CI/checklist otomasyonu
- Dokuman-plan senkronizasyonu

---

## 3) Fazlar ve Milestone Ciktilari

## Faz 0 - Baseline ve Hazirlik
Hedef:
- Mevcut performans, hata ve kalite durumunu olculebilir hale getirmek.

Cikti:
- Baseline metrik raporu
- Golden test corpus taslagi

Ana dosyalar:
- `src/server/api/routers/artifacts.ts`
- `tests/integration/artifacts-router.test.ts`

## Faz 1 - Judge Cekirdegi V2
Hedef:
- Prompt kalitesi ve analiz guvenilirligini artirmak.

Cikti:
- V2 prompt templates
- Static+semantic analiz katmani

Ana dosyalar:
- `src/server/services/prompt-templates.ts`
- `src/server/services/artifact-analyzer.ts`
- `src/server/services/judge-pipeline.ts`

## Faz 2 - Project Context Mode
Hedef:
- Coklu artefakt ve capraz celiski tespiti.

Cikti:
- Genisletilmis API schema
- Context bundle builder
- UI context ekleme akisi

Ana dosyalar:
- `src/lib/artifacts.ts`
- `src/server/api/routers/artifacts.ts`
- `src/components/editor-workbench.tsx`

## Faz 3 - Dayaniklilik ve Seffaflik
Hedef:
- Provider/fallback davranisini operasyonel olarak netlestirmek.

Cikti:
- Typed fallback reason
- Provider status badge + warning siniflandirmasi

Ana dosyalar:
- `src/server/ai/judge-provider.ts`
- `.env.example`
- `src/components/score-display.tsx`

## Faz 4 - Vibe UX Hizlandirma
Hedef:
- Bekleme hissini azaltmak, akis bazli deneyim sunmak.

Cikti:
- Streaming event akis modeli
- Anlik lint paneli

Ana dosyalar:
- `src/trpc/react.tsx`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/components/input-panel.tsx`

## Faz 5 - Explainable Diff ve Selective Apply
Hedef:
- Diff'in yalnizca ne degistigini degil, neden degistigini gostermesi.

Cikti:
- Hunk-level rationale
- Parca parca apply

Ana dosyalar:
- `src/components/diff-viewer.tsx`
- `src/components/analysis-dashboard.tsx`
- `src/components/editor-workbench.tsx`

## Faz 6 - MCP + CLI Entegrasyonu
Hedef:
- Aracin IDE icine alinmasi.

Cikti:
- MCP server
- CLI komutlari

Planlanan yeni dizinler:
- `src/mcp/`
- `src/cli/`

## Faz 7 - Dynamic Templates, URL Import, House Rules
Hedef:
- Esnek, stack/organizasyon bazli kullanim.

Cikti:
- Template registry
- URL import analyzer
- House rules precedence modeli

Ana dosyalar:
- `src/components/editor-workbench.tsx`
- `src/server/api/routers/artifacts.ts`
- `src/server/db/schema.ts`

## Faz 8 - Refactor, CI, Dokuman Senkronu
Hedef:
- Surdurulebilir kod tabani ve canli dokumanlar.

Cikti:
- Analyzer moduler yapisi
- Checklist script + CI gate
- Guncel roadmap dokumanlari

---

## 4) KPI ve Basari Kriterleri

Kalite:
- Guvenlik bulgularinda precision artisi
- False positive oraninda belirgin dusus

Performans:
- Ilk geri bildirim <= 500ms (pre-lint veya stream stage)
- P95 tam analiz <= 10s (makul giris boyutunda)

Kullanim:
- Selective apply ile tam replace ihtiyacinin azalmasi
- MCP/CLI ile web copy-paste adiminin opsiyonel hale gelmesi

Seffaflik:
- Her analizde provider + fallback nedeni + confidence gorunurlugu

---

## 5) Yol Haritasi Uygulama Sirasinda Okunacak Dosyalar

Her fazda coding assistant asagidaki sirayla baglam yuklemelidir:

1. `AGENTS.md`
2. `docs/rules.md`
3. `docs/PRD.md`
4. `docs/core_doc_2.md` (ozellikle judge ve test bolumleri)
5. Fazin ilgili teknik dokumani: `docs/phased_implementation_plan.md`

---

## 6) Mimarik Kararlar (Kisa)

- Veri mutasyonlari tRPC uzerinden kalacak (`src/server/api/routers`)
- DB erisimi Drizzle ile kalacak (`src/server/db/schema.ts`)
- Client component yalnizca interaktivite icin kullanilacak (`AGENTS.md` kurali)
- Guvenlikte "asla otomatik destruktif komut" ilkesi korunacak

---

## 7) Harici Arac Kullanimi (Plan Asamasi)

Context7 (dokuman dogrulama):
- MCP SDK: `/modelcontextprotocol/typescript-sdk`
- tRPC: `/trpc/trpc`
- Next.js streaming: `/vercel/next.js/v16.1.1`

Playwright:
- Streaming state ve selective apply akisini E2E dogrulamada kullan

Web fetch:
- URL import fazinda GitHub raw/gist cekme ve sanitize islemi

---

## 8) Bu Dokuman Nasil Kullanilacak?

1. Once `docs/phased_implementation_plan.md` ile fazin detayina gir.
2. Sonra `docs/engineering_guardrails.md` ile risk/sinir kontrollerini uygula.
3. Gorevleri `docs/agent_execution_backlog.md` sirasiyla uygula.
4. Her faz sonunda test ve dogrulama adimlarini calistir.

---

## 9) Uygulama Durumu (2026-02-14)

Tamamlanan fazlar:
- Faz 0 - Baseline ve telemetry standardizasyonu
- Faz 1 - Judge Core V2 (prompt + static/signal + semantic)
- Faz 2 - Project Context Mode (schema + router + UI context panel)
- Faz 3 - Provider dayanıklilik/seffaflik (fallback reason + confidence + env config)
- Faz 4 - Streaming UX v1 (SSE stage stream + client stage progress)
- Faz 5 - Explainable diff + selective apply (ilk surum)
- Faz 6 - MCP + CLI (stdio + streamable-http + auth/session + CLI)

Bekleyen ana bloklar:
- Faz 4 advanced telemetry alignment (stage events'in gercek runtime adimlariyla 1:1 baglanmasi)
- Faz 7 dynamic templates + URL import + house rules
- Faz 8 analyzer modulerlestirme + CI checklist otomasyonu
