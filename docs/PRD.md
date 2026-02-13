# 📋 Product Requirements Document (PRD)

## Proje Tanımı
**Prompt Perfector**, geliştiricilerin AI ajanları (Windsurf, Cursor, Roo Code, vb.) için oluşturdukları yapılandırma ve bağlam dosyalarını (Artifacts) analiz eden, puanlayan ve otomatik olarak iyileştiren bir web aracıdır.

## Hedef Kitle
- AI Coding Agent kullanan Yazılım Mühendisleri.
- Takım içi kodlama standartlarını belirleyen Tech Lead'ler.
- Prompt Mühendisleri.

## Temel Özellikler (MVP)

### 1. Artefakt Tipi Seçimi
Kullanıcı şu 5 tipten birini seçebilmelidir:
1.  **Skills:** (Yetenekler, araç tanımları)
2.  **AGENTS.md / CLAUDE.md:** (Repo bağlamı)
3.  **Rules:** (.cursorrules, .windsurfrules)
4.  **Workflows / Slash Commands:** (Otomasyon)
5.  **Great Plan / ExecPlans:** (Fazlı uygulama planları)

### 2. "Judge & Fix" Motoru
- **Analiz:** Girdiyi alır, en iyi uygulama kurallarına (raporda belirtilen) göre değerlendirir.
- **Puanlama:** Anlaşılırlık, Güvenlik, Token Verimliliği, Eksiksizlik kriterlerinde 0-100 puan verir.
- **Otomatik Düzeltme:** Hatalı kısımları (örn: aşırı verbose AGENTS.md, frontmatter eksiği olan Skill) düzeltir.

### 3. Kullanıcı Arayüzü (UI)
- **Split View:** Sol tarafta kullanıcının ham metni, sağ tarafta AI'ın önerdiği "Perfected" versiyon.
- **Diff Highlighting:** Değişikliklerin renkli gösterimi (Yeşil: Eklendi, Kırmızı: Silindi).
- **Kritik Uyarılar:** Güvenlik riskleri (örn: Prompt Injection riski) kırmızı alert ile gösterilmeli.

### 4. Şablon Desteği
- Kullanıcı boş başlarsa, seçilen tür için "Best Practice" şablonunu (Doldurulabilir alanlarla) yükle.

## Teknik Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Backend/API:** tRPC
- **Database:** SQLite (LibSQL/Turso uyumlu yapı), Drizzle ORM
- **AI Logic:** OpenAI API (GPT-4o) veya Anthropic API (Claude 3.5 Sonnet) - *Model-agnostik tasarım.*

## Fonksiyonel Olmayan Gereksinimler
- **Hız:** Analiz sonucu 10 saniye içinde dönmeli.
- **Güvenlik:** Kullanıcı verileri (kod parçaları) loglanmamalı veya eğitim için kullanılmamalı.
- **UX:** Minimalist, geliştirici odaklı "Dark Mode" arayüz.