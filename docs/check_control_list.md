# ✅ Check Control List

## Mimari ve Teknoloji
- [ ] **Next.js App Router:** `pages/` klasörü kullanılmamalı, tüm route'lar `app/` altında olmalı.
- [ ] **Type Safety:** `any` kullanımı yasak. Drizzle şemaları ve tRPC router'ları tam tip güvenliğine sahip olmalı.
- [ ] **Tailwind:** Inline style yok, tüm stiller Tailwind class'ları veya `shadcn` komponentleri üzerinden.
- [ ] **Server Actions / tRPC:** Veri mutasyonları doğrudan API route yerine tRPC procedure'leri ile yapılmalı.

## Özellik ve Fonksiyon
- [ ] **Parser Sağlamlığı:** Frontmatter (YAML) hatalı olsa bile uygulamanın çökmemesi (Graceful degradation).
- [ ] **LLM Judge Entegrasyonu:** System prompt'ların rapordaki 5 kategoriye göre dinamik değişmesi.
- [ ] **Diff Görünümü:** Kullanıcı eski ve yeni metni yan yana net bir şekilde görebilmeli.

## UI / UX
- [ ] **Loading States:** Analiz sırasında kullanıcıya "Judge is thinking..." gibi geri bildirim verilmeli (Skeleton loader).
- [ ] **Copy to Clipboard:** Çıktıların tek tıkla kopyalanabilmesi.
- [ ] **Error Handling:** LLM servisi hata verirse kullanıcıya dostça bir hata mesajı ("Rate limit exceeded" vb.) gösterilmeli.

## Güvenlik
- [ ] **Environment Variables:** API Key'ler asla client-side bundle'a sızmamalı.
- [ ] **Input Limit:** Aşırı büyük metin girişleri (örn. 1MB+) backend'e gitmeden engellenmeli.