# 👤 User Use Case Scenarios

## Senaryo 1: "Acemi" Windsurf Kullanıcısı
**Kullanıcı:** Ahmet, Windsurf kullanmaya yeni başladı. `.windsurfrules` dosyasının ne işe yaradığını tam bilmiyor.
**Akış:**
1. Araçta "Rules" seçeneğini seçer.
2. "Generate Template" butonuna basar.
3. Araç, Windsurf için optimize edilmiş, 12k karakter limitini gözeten, `global` ve `workspace` ayrımlı taslağı yükler.
4. Ahmet projesine özgü "Next.js" kuralını ekler ve "Analyze" der.
5. Araç, Ahmet'in kuralını XML tagleri (`<thinking_process>`) ile zenginleştirip geri verir.

## Senaryo 2: Kurumsal AGENTS.md Optimizasyonu
**Kullanıcı:** Elif, büyük bir monorepo yönetiyor. `AGENTS.md` dosyası 5000 satır olmuş ve token maliyeti çok yüksek.
**Akış:**
1. Elif mevcut devasa dosyasını "Input" alanına yapıştırır.
2. "Analyze" butonuna basar.
3. **Judge LLM** uyarır: "Bu dosya 32KiB limitini zorluyor ve gereksiz README bilgileri içeriyor."
4. **Fix:** Araç, dosyayı "Minimal Operasyonel Gereksinimler"e indirger ve geri kalanını referans linklerine (`@docs/architecture.md`) dönüştürür.
5. Elif "Diff" görünümünde ne kadar tasarruf ettiğini görür ve "Copy" ile alır.

## Senaryo 3: Güvenlik Denetimi (Security Gate)
**Kullanıcı:** Can, internetten bulduğu bir "Deploy Skill"ini kullanmak istiyor.
**Akış:**
1. Skill içeriğini yapıştırır.
2. Araç analiz eder ve **KIRMIZI ALARM** verir: "Bu yetenek, kullanıcı onayı almadan `force push` yapma yetkisine sahip."
3. **Fix:** Araç, `disable-model-invocation: true` satırını ekler ve bir "Confirmation Step" (Onay Adımı) kodu enjekte eder.
4. Can, güvenli hale getirilmiş skill'i kullanır.