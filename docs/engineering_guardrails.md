# Engineering Guardrails ve Dikkat Edilecekler

Bu dokuman, yol haritasi uygulanirken teknik, guvenlik, performans ve urun riski acisindan uyulmasi gereken sinirlari tanimlar.

Ilk okunacak dosyalar:
- `AGENTS.md`
- `docs/rules.md`
- `docs/roadmap_master.md`

---

## 1) Mimari Guardrail'ler

1. Server/client ayrimi korunacak.
   - Varsayilan server component; sadece interaktivite gerektiginde client component.
   - Referans: `AGENTS.md`
2. Tum mutasyonlar tRPC uzerinden yurutulecek.
   - Referans: `src/server/api/routers/artifacts.ts`
3. Veri katmani Drizzle merkezli kalacak.
   - Referans: `src/server/db/schema.ts`
4. `any` kullanimi yok.
   - Zod ve TypeScript strict ile tip guvenligi korunacak.

---

## 2) Guvenlik Guardrail'leri

## 2.1 Prompt Injection ve Harici Icerik
- Harici URL/import icerigi "guvenilmeyen kaynak" olarak kabul edilmeli.
- "Ignore previous instructions" vb. kaliplar sadece sinyal; nihai karar semantic katmanda verilmeli.
- "Dogrudan execute" eden hicbir otomasyon adimi varsayilan olmamali.

Referans dosyalar:
- `src/server/security/sanitize.ts`
- `src/server/services/artifact-analyzer.ts`

## 2.2 Secret Hygiene
- API key, token, `.env` degerleri output veya log icerigine dusmemeli.
- Warning uretimi deterministic olmali, secret degeri ifsa etmemeli.

## 2.3 Destructive Action Gating
- Asla otomatik force push / prod deploy / destructive fs komutlari calismayacak.
- Bu adimlar sadece explicit user confirmation ile gecilebilir.

---

## 3) Performans Guardrail'leri

Hedefler:
- Ilk geri bildirim <= 500ms
- P95 tam analiz <= 10s

Kurallar:
1. Pre-lint hesaplamalari client tarafinda hafif regex/signal bazli olmali.
2. Agir semantic degerlendirme server tarafinda kalmali.
3. Stream event payload'lari kucuk ve asamali olmali.
4. Gereksiz tekrar parse/serialize adimlarindan kacinilmali.

---

## 4) UX Guardrail'leri

1. Kullanici bekleme durumunda bile sistemin ne yaptigini gormeli.
   - Stage bazli progres gorunmeli.
2. Diff sadece renklendirme degil, neden bilgisini de gostermeli.
3. Selective apply yapisinda geri alma/iptal yolu net olmali.
4. Error metinleri teknik ama kullanici dostu olmali.

Referans dosyalar:
- `src/components/editor-workbench.tsx`
- `src/components/diff-viewer.tsx`
- `src/components/score-display.tsx`

---

## 5) Veri ve Schema Evrimi Guardrail'leri

Schema degisikliklerinde:
1. Geriye uyumluluk korunacak (mevcut `content` ile calisma devam etmeli).
2. Yeni alanlar opsiyonel baslatilacak.
3. Migration adimlari asamali olacak.

Ornek genisleme alanlari:
- `analysisJson` iceriginde yeni telemetry/fallback reason alanlari
- Context bundle metadata (source/path/priority)

Referans:
- `src/server/db/schema.ts`

---

## 6) Test Guardrail'leri

## 6.1 Minimum test kapsami
- Unit: parser/sanitize/analyzer kurallari
- Integration: tRPC router + pipeline fallback
- E2E: analyze akisi, diff, error handling, quality panel

Referans dizinler:
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

## 6.2 Yeni ozellik icin zorunlu testler
1. Context mode ekleniyorsa:
   - Celiski tespiti integration testi
2. Streaming ekleniyorsa:
   - Event sirasinin E2E testi
3. Selective apply ekleniyorsa:
   - Kismi apply davranisi E2E testi
4. MCP/CLI ekleniyorsa:
   - Contract/smoke test

---

## 7) Observability Guardrail'leri

Log standartlari:
- Tek satir parse-edilebilir metrik loglari
- PII ve secret icermez
- `provider`, `durationMs`, `fallbackReason`, `analysisMode` icermeli

Debug bilgisi:
- Development ortaminda detayli
- Production ortaminda kontrollu ve guvenli

---

## 8) MCP ve Harici Entegrasyon Guardrail'leri

Context7 bilgi dogrulama politikasi:
- MCP server ve streaming implementasyonunda once resmi dokumana bak
- Dogrudan internetten alinan ornekler dogrulanmadan birebir alinmaz

Playwright dogrulama politikasi:
- UI state degisimleri mutlaka E2E ile test edilir

MCP server guvenlik politikasi:
- Varsayilan read-only
- Yazma/apply aksiyonlari acik onay gerektirir

---

## 9) Rollout ve Geri Alma (Rollback) Stratejisi

Feature flag onerisi:
- `ANALYSIS_V2_ENABLED` benzeri flaglerle asamali rollout
- Yeni stream veya context mode gibi buyuk degisiklikler flag arkasinda acilmali

Rollback ilkeleri:
1. Kritik hata varsa once feature flag kapatilir
2. DB migration geri alma adimlari onceden belirlenir
3. Gecici fallback (mock/local analyzer) acikca kullaniciya bildirilir

---

## 10) Dokuman Senkronizasyon Kurali

Asagidaki durumlarda dokuman guncellemesi zorunludur:
- Yeni faz tamamlandiginda
- Yeni API field eklendiginde
- Test stratejisi degistiginde
- MCP/CLI arayuzu degistiginde

Guncellenmesi gereken ana dosyalar:
- `docs/great_plan.md`
- `docs/PRD.md`
- `docs/roadmap_master.md`
- `docs/phased_implementation_plan.md`

---

## 11) Kirmizi Cizgiler (Asla Ihlal Edilmez)

- Destructive komutlari otomatik calistirma
- Secret ifsasi
- tRPC disinda mutasyon
- Tip guvenligini bozan kisa yol cozumleri
- Dokuman/plani guncellemeden sessizce davranis degisikligi
