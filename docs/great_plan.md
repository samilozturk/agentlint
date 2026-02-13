# 🚀 Great Plan: Context/Prompt Perfection Tool

Bu proje, AI kodlama ajanları için optimize edilmiş bağlam dosyaları (AGENTS.md, Rules, Skills vb.) üreten ve denetleyen bir SaaS aracıdır.

## 🎯 Hedef
Kullanıcı girdilerini analiz eden, best-practice standartlarına göre puanlayan (Judge LLM) ve "Diff" tabanlı iyileştirme önerileri sunan bir Next.js uygulaması geliştirmek.

## 🛠️ Faz 1: Temel Kurulum ve Altyapı (Setup & Boilerplate)
- [ ] **Proje Başlatma:** `create-next-app` (App Router, TypeScript).
- [ ] **UI Kütüphanesi:** Shadcn UI ve Tailwind CSS kurulumu.
- [ ] **Veritabanı & ORM:** Drizzle ORM + SQLite (yerel geliştirme için) kurulumu.
- [ ] **API Katmanı:** tRPC (Server Actions veya App Router adapter) kurulumu.
- [ ] **Tema:** Dark/Light mode desteği (Geliştiriciler dark sever).
- [ ] **Repo Yapısı:** Klasör yapısının `src/components`, `src/server`, `src/lib` olarak düzenlenmesi.

## 🧱 Faz 2: Çekirdek Mantık ve Veri Modelleri (The Brain)
- [ ] **Schema Tasarımı:** `Artifacts` tablosu (id, type, original_content, refined_content, score, user_id).
- [ ] **Type Definitions:** 5 temel artefakt türü için (Skills, Agents, Rules, Workflows, Plans) TypeScript interface'leri.
- [ ] **Parser Modülü:** Markdown frontmatter ve içerik ayrıştırıcı (regex/gray-matter).
- [ ] **Mock Judge Engine:** LLM bağlantısı öncesi, dummy veri dönen bir "Mock Judge" servisi yazılması (Frontend'i bloklamamak için).
- [ ] **Prompt Templates:** Rapordaki "Judge System Prompts" metinlerinin kod içine sabitlenmesi.

## 🖥️ Faz 3: Kullanıcı Arayüzü (The Face)
- [ ] **Dashboard:** Geçmiş taramaların listelendiği ana ekran.
- [ ] **Editor Layout:** Sol panel (Girdi), Sağ panel (Çıktı/Diff), Alt panel (Skor/Analiz).
- [ ] **Artifact Selector:** 5 türden birini seçmek için görsel kartlar.
- [ ] **Diff Viewer:** `diff` kütüphanesi kullanılarak Before/After görselleştirmesi.
- [ ] **Action Buttons:** "Analyze", "Fix", "Copy", "Export".

## 🧠 Faz 4: LLM Entegrasyonu (The Intelligence)
- [ ] **AI Provider Setup:** OpenAI (veya Anthropic) SDK entegrasyonu.
- [ ] **Judge Pipeline:**
    1. Input -> Parse
    2. Select System Prompt (Type-based)
    3. LLM Request -> JSON Output (Score + Diff + Rationale)
    4. UI Update
- [ ] **Streaming:** Uzun analizler için tRPC üzerinden stream yanıt desteği (opsiyonel ama önerilir).

## 🛡️ Faz 5: Güvenlik ve Doğrulama
- [ ] **Input Sanitization:** Kullanıcı girdisindeki zararlı prompt injection girişimlerini temizleme.
- [ ] **Rate Limiting:** LLM çağrıları için basit bir limit mekanizması (Upstash veya memory).
- [ ] **Export Validation:** Çıktıların valid markdown/yaml olduğunun son kontrolü.

## 🚀 Faz 6: Cila ve Teslim
- [ ] **Landing Page:** Basit bir tanıtım sayfası.
- [ ] **E2E Test:** Kritik akış (Input -> Fix -> Copy) testi.
- [ ] **Dokümantasyon:** Projenin kendi `AGENTS.md` dosyasının oluşturulması (Meta!).