---
trigger: always_on
scope: all_code_files
---

# Kod Kalitesi Kuralları

## Do

- Temiz, okunabilir ve modüler kod yaz
- TypeScript'te katı tiplendirme kullan (any kullanma)
- Shadcn UI bileşenlerini tercih et
- Server Components kullan (interaktivite gerekmedikçe)
- Tailwind CSS utility class'ları kullan
- Drizzle ORM ile veritabanı işlemlerini yap
- tRPC üzerinden mutation'ları yönlendir

## Don't

- `any` tipini kullanma
- Ham SQL yazma (Drizzle yerine)
- Büyük, monolitik komponentler oluşturma
- İşlevsiz yorumlar ekleme
- Kullanıcı onayı olmadan yıkıcı komutlar çalıştırma

## Verification

- Tip hatası yok: `npx tsc --noEmit`
- Lint temiz: `npm run lint`
- Format kontrolü: `npx prettier --check src/`

## Security

- API anahtarlarını asla hardcode etme (`.env.local` kullan)
- Kullanıcı onayı olmadan dosya silme/yazma işlemi yapma
- Dış API çağrılarında hata mesajlarını sanitize et
