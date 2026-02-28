# Do's and Don'ts: AgentLint OSS Pivot

> Pivot boyunca uyulması gereken kurallar ve kaçınılması gereken anti-patternler.

---

## Altın Kurallar (İhlal Edilemez)

### DO: MCP Server Stateless Kalmalı
```
Her tool çağrısı bağımsız. Global değişken, cache, singleton, veritabanı YOK.
```

### DON'T: Hiçbir Zaman State Tutma
```
❌ let cachedResults = {};  // Global state
❌ const db = new Database(); // Veritabanı bağlantısı
❌ class AnalyzerSingleton { static instance; } // Singleton
```

### DO: Read-Only İşlem
```
MCP server dosya OKUR, analiz eder, rapor döner. YAZMAZ.
Tek istisna: apply_patches — ve o da guard'lı.
```

### DON'T: Korumasız Dosya Yazma
```
❌ fs.writeFileSync(path, content); // Asla doğrudan yazma
❌ fs.appendFileSync(log, data);    // Asla doğrudan log yazma
```

### DO: Logları stderr'e Yaz
```typescript
// DOĞRU
console.error('[agent-lint]', message);
process.stderr.write(`[agent-lint] ${message}\n`);
```

### DON'T: stdout'a Log Yazma
```typescript
// YANLIŞ — MCP protokolünü bozar
❌ console.log('Analyzing...');
❌ process.stdout.write('Debug info');
```

---

## Mimari Do's and Don'ts

### DO: Paketler Arası Temiz Bağımlılık

```
shared ← core ← mcp
shared ← core ← cli
```
Ok yönü: "bağımlıdır" anlamında. `mcp` → `core` → `shared`.

### DON'T: Circular Dependency
```
❌ core → mcp → core (döngüsel)
❌ shared → core → shared (döngüsel)
```

### DO: Public API Export
```typescript
// packages/core/src/index.ts
export { analyzeArtifact } from './analyzer.js';
export { instantLint } from './instant-lint.js';
export type { AnalysisResult, Finding } from './types.js';
```

### DON'T: Internal Modüle Doğrudan Erişim
```typescript
// Başka paketten:
❌ import { internalHelper } from '@agent-lint/core/src/helpers/internal.js';
✅ import { analyzeArtifact } from '@agent-lint/core';
```

### DO: Zod ile Input Validation
```typescript
const AnalyzeInput = z.object({
  type: z.enum(['agents', 'skills', 'rules', 'workflows', 'plans']),
  content: z.string().min(1).max(500_000),
});
```

### DON'T: Validasyonsuz Input
```typescript
❌ function analyze(input: any) { ... }
❌ function analyze(type: string, content: string) { // no validation
```

---

## MCP Tool Do's and Don'ts

### DO: Tool Açıklamaları Net ve Actionable
```typescript
{
  name: "analyze_artifact",
  description: "Analyze a single AI agent context artifact (AGENTS.md, rules, skills, workflows, or plans) and return quality score with detailed metric breakdown and findings.",
  inputSchema: { ... }
}
```

### DON'T: Vaag Tool Açıklamaları
```typescript
❌ { description: "Analyzes stuff" }
❌ { description: "Use this tool to do analysis" }
```

### DO: MCP Server Veri Üretir
```typescript
// Tool sonucu: veri + bulgular + öneriler
return {
  score: 72,
  metrics: { clarity: 8, safety: 5, ... },
  findings: [
    { metric: "safety", message: "Missing confirmation gate for destructive operations", severity: "high" }
  ],
  hints: ["Add '## Safety' section with explicit guards"]
};
```

### DON'T: MCP Server Talimat Verir
```typescript
// YANLIŞ — server ne yapılacağını dikte etmemeli
❌ return {
    action: "rewrite",
    command: "Replace line 15 with ...",
    autoApply: true
  };
```

### DO: Tool Timeout'ları
```typescript
// Her tool'un makul bir timeout'u olmalı
const TOOL_TIMEOUTS = {
  analyze_artifact: 30_000,     // 30s
  scan_workspace: 60_000,       // 60s
  propose_patches: 30_000,      // 30s
  apply_patches: 15_000,        // 15s
  validate_export: 10_000,      // 10s
};
```

### DON'T: Sınırsız İşlem
```typescript
❌ async function scanWorkspace(dir) {
    // 100K dosyalık monorepo'da sonsuza kadar çalışır
    return glob('**/*', { cwd: dir });
  }
```

---

## apply_patches Güvenlik Do's and Don'ts

### DO: Hash Guard
```typescript
// Okuma anında hash al
const fileContent = fs.readFileSync(filePath, 'utf-8');
const originalHash = crypto.createHash('sha256').update(fileContent).digest('hex');

// Yazma anında doğrula
const currentHash = crypto.createHash('sha256').update(fs.readFileSync(filePath, 'utf-8')).digest('hex');
if (currentHash !== originalHash) {
  throw new Error('File modified since read — aborting patch');
}
```

### DON'T: Hash Kontrolü Atla
```typescript
❌ fs.writeFileSync(filePath, patchedContent); // Hash kontrolü yok
```

### DO: Allowlist + Path Normalization
```typescript
const ALLOWED_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.txt']);
const resolvedPath = path.resolve(workDir, targetPath);

// Working directory içinde olduğunu doğrula
if (!resolvedPath.startsWith(path.resolve(workDir))) {
  throw new Error('Path traversal detected');
}

// Uzantı kontrolü
if (!ALLOWED_EXTENSIONS.has(path.extname(resolvedPath))) {
  throw new Error(`Extension not allowed: ${path.extname(resolvedPath)}`);
}
```

### DON'T: Kontrolsüz Path Kabul Etme
```typescript
❌ const target = userInput.filePath; // Doğrudan kullanma
❌ fs.writeFileSync(path.join(dir, '../../../etc/hosts'), content);
```

### DO: Backup Önce, Yaz Sonra
```typescript
const backupDir = path.join(workDir, '.agentlint-backup');
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(filePath, path.join(backupDir, `${basename}.${timestamp}.bak`));
// Şimdi güvenle yaz
fs.writeFileSync(filePath, patchedContent);
```

### DON'T: Backup'sız Yazma
```typescript
❌ fs.writeFileSync(filePath, patchedContent); // Geri dönüş yolu yok
```

### DO: Explicit Flag Gereksinimi
```typescript
// apply_patches sadece --allow-write flag'i ile çalışır
if (!options.allowWrite) {
  return {
    success: false,
    error: 'apply_patches requires --allow-write flag. Use propose_patches for read-only mode.',
    preview: patchPreview
  };
}
```

---

## TypeScript & Kod Kalitesi Do's and Don'ts

### DO: Strict Typing
```typescript
interface Finding {
  metric: ClientMetricId;
  message: string;
  severity: 'high' | 'medium' | 'low';
  line?: number;
  evidence?: string;
}
```

### DON'T: Type Safety İhlalleri
```typescript
❌ as any
❌ @ts-ignore
❌ @ts-expect-error
❌ interface Foo { [key: string]: any }
```

### DO: Error Handling
```typescript
try {
  const result = analyzeArtifact(input);
  return { success: true, data: result };
} catch (error) {
  console.error('[agent-lint] Analysis failed:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

### DON'T: Boş Catch veya Swallow
```typescript
❌ try { ... } catch (e) {}  // Sessiz yutma
❌ try { ... } catch (e) { return null; } // Hata bilgisi kayıp
```

### DO: Const ve Immutable Tercih Et
```typescript
const METRIC_IDS = [
  'clarity', 'specificity', 'scope-control', 'completeness',
  'actionability', 'verifiability', 'safety', 'injection-resistance',
  'secret-hygiene', 'token-efficiency', 'platform-fit', 'maintainability'
] as const;

type ClientMetricId = typeof METRIC_IDS[number];
```

### DON'T: Mutable Global State
```typescript
❌ let config = {};  // Mutable global
❌ var results = []; // var kullanımı
```

---

## Bağımlılık Yönetimi Do's and Don'ts

### DO: Minimum Bağımlılık
```
İzin verilen temel bağımlılıklar:
✅ @modelcontextprotocol/sdk  — MCP protokolü (zorunlu)
✅ zod                        — Schema validation (zorunlu)
✅ gray-matter                — Frontmatter parse (zorunlu)
✅ commander / yargs          — CLI (packages/cli için)
✅ tsup / esbuild             — Build (devDependency)
✅ vitest                     — Test (devDependency)
```

### DON'T: Gereksiz Bağımlılık
```
❌ lodash         → Native JS/TS yeterli
❌ axios          → Node fetch yeterli
❌ moment         → Intl.DateTimeFormat yeterli
❌ express        → MCP stdio için gereksiz
❌ winston        → console.error yeterli
❌ chalk          → Minimal renk için node:util styleText veya basit ANSI
```

### DO: Bağımlılık Ekleme Protokolü
```
Her yeni dependency için cevapla:
1. Bu olmadan yapılamaz mı? (Yerleşik Node API?)
2. Bundle size etkisi nedir? (bundlephobia.com kontrol et)
3. Bakım durumu nedir? (Son commit, issue sayısı)
4. Güvenlik geçmişi nasıl? (npm audit, snyk)
5. ONAY → ekle. Bir bile "hayır" → ekleme.
```

### DON'T: Her Şeye Paket Yükle
```typescript
❌ npm install is-odd is-even is-number  // Ciddi değiliz
❌ npm install left-pad                   // Tarih dersi
```

---

## Test Do's and Don'ts

### DO: Her Metrik İçin Test
```typescript
describe('clarity metric', () => {
  it('scores high for well-structured artifact', () => { ... });
  it('scores low for vague, generic content', () => { ... });
  it('detects missing headings', () => { ... });
  it('handles empty content gracefully', () => { ... });
});
```

### DON'T: Happy Path Only
```typescript
❌ it('works', () => {
    expect(analyze(goodInput)).toBeDefined();
  });
// Edge case'ler nerede? Error case'ler nerede?
```

### DO: Fixture-Based Testing
```typescript
// fixtures/good-agents.md → yüksek skor beklenen
// fixtures/bad-agents.md → düşük skor beklenen (injection, secret leak)
const goodResult = analyzeArtifact('agents', readFixture('good-agents.md'));
expect(goodResult.score).toBeGreaterThan(80);

const badResult = analyzeArtifact('agents', readFixture('bad-agents.md'));
expect(badResult.score).toBeLessThan(50);
```

### DON'T: Testleri Sil veya Skip Et
```typescript
❌ it.skip('temporarily disabled because...', () => { ... });
❌ // Test kaldırıldı çünkü fail ediyordu
```

---

## Publish & Dağıtım Do's and Don'ts

### DO: files Whitelist
```json
{
  "files": ["dist/", "README.md", "LICENSE", "CHANGELOG.md"]
}
```

### DON'T: Tüm Repo'yu Publish Et
```json
❌ // "files" alanı yok = her şey publish olur
❌ // src/, tests/, .env, .git/ dahil
```

### DO: Dry Run Önce
```bash
npm pack --dry-run  # Ne publish edileceğini gör
npm publish --dry-run  # Simüle et
```

### DON'T: Direkt Publish
```bash
❌ npm publish  # İlk seferde dry-run yapmadan
```

### DO: Semantic Versioning
```
0.1.0 → İlk alpha release
0.2.0 → Yeni tool eklendi
0.2.1 → Bug fix
1.0.0 → API stabil, production-ready
```

### DON'T: Breaking Change Patch'te
```
❌ 0.1.0 → 0.1.1 ama tool schema değişti (bu minor veya major olmalı)
```

---

## README & Doküman Do's and Don'ts

### DO: "One Command" Öncelikli
```markdown
## Quick Start

\```bash
npx -y @agent-lint/mcp
\```

That's it. Add to your MCP client config and start analyzing.
```

### DON'T: Kurulumu Karmaşıklaştır
```markdown
❌ ## Installation
❌ First install Node.js 18+
❌ Then install pnpm
❌ Then clone the repo
❌ Then run npm install
❌ Then build
❌ Then configure
❌ Then... (kullanıcı çoktan gitmiş)
```

### DO: Çalışan Örnekler
```markdown
### Cursor Setup (.cursor/mcp.json)
\```json
{
  "mcpServers": {
    "agent-lint": {
      "command": "npx",
      "args": ["-y", "@agent-lint/mcp"]
    }
  }
}
\```
```

### DON'T: Soyut Açıklamalar
```markdown
❌ "Configure your MCP client to point to Agent Lint"
❌ "See the documentation for setup instructions"
// Kullanıcıya kopyala-yapıştır verilebilir config ver
```

---

## CI/CD Do's and Don'ts

### DO: Multi-Platform Test Matrix
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [18, 20, 22]
```

### DON'T: Sadece Tek Platform
```yaml
❌ runs-on: ubuntu-latest  # Windows'ta kırık olabilir
❌ node: [20]              # Node 18'de çalışmayabilir
```

### DO: Automated Release
```yaml
# Tag push → otomatik npm publish
on:
  push:
    tags: ['v*']
```

### DON'T: Manuel Publish
```bash
❌ # SSH into laptop, npm publish, hope nothing breaks
```

---

## Özet Tablosu

| Konu | DO | DON'T |
|------|-----|--------|
| State | Stateless, her çağrı bağımsız | Global state, cache, DB |
| Dosya | Read-only (apply_patches hariç) | Korumasız fs.write |
| Log | stderr'e yaz | stdout'a log (MCP bozar) |
| Type | Strict TypeScript, Zod validation | `any`, `@ts-ignore` |
| Deps | Minimum, gerekçeli | Her şeye npm install |
| Test | Her metrik, edge case, fixture | Happy path only, skip |
| Güvenlik | Hash guard, allowlist, backup | Kontrolsüz path, hash'siz write |
| Publish | files whitelist, dry-run, semver | Tüm repo, direkt publish |
| Doküman | Kopyala-yapıştır örnekler | "See docs" yönlendirmeleri |
| CI | Multi-platform matrix | Tek OS, tek Node versiyonu |
