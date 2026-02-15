# MCP Client Conventions (Auto-Use)

Bu dokuman Agent Lint MCP'nin "kullanici acikca istemese de" daha dogru zamanda secilmesi icin istemci tarafi convention'lari tanimlar.

## 1) Server Selection

- Artifact kalite gorevlerinde ayni anda hem `agentlint-local` hem `agentlint-remote` acik tutmayin.
- Local repository taramasi gerekiyorsa `agentlint-local` kullanin.
- Remote endpoint (`https://.../mcp`) sadece paylasimli/online kullanim icin tercih edin.

## 2) Tool Crowding Reduction

- Artifact yazimi/review task'larinda alakasiz MCP'leri gecici kapatmak model secimini iyilestirir.
- Minimum set: `agentlint-*` (+ gerekirse tek bir dokuman kaynagi MCP).

## 3) Recommended Invocation Policy

Artifact tipleri: AGENTS.md, CLAUDE.md, skills, rules, workflows, plans.

Default policy:

1. `prepare_artifact_fix_context`
2. Resource oku: `scoring-policy`, `assessment-schema`, `artifact-spec`, `artifact-path-hints`
3. Repo tarama + metric evidence cikarma
4. `submit_client_assessment`
5. Rewrite + `quality_gate_artifact` (`candidateContent` + `clientAssessment`)
6. `validate_export` (final donus oncesi)

Patch gerekiyorsa:

- `suggest_patch` ile secmeli duzeltme uygulanir.
- `quality_gate_artifact` icinde patch merge kullanmak icin `candidateContent` gonderin.
- Iteration takibi icin `iterationIndex` ve `previousFinalScore` alanlarini quality gate'e gonderin.
- `quality_gate_artifact` default olarak `clientAssessment` ister (`requireClientAssessment=true`).

## 4) Prompt and Resource Usage

Client prompt/resource destekliyorsa su endpointleri kullanin:

- Prompts:
  - `artifact_create_prompt`
  - `artifact_review_prompt`
  - `artifact_fix_prompt`
- Resources:
  - `agentlint://quality-metrics/<type>`
  - `agentlint://prompt-pack/<type>`
  - `agentlint://prompt-template/<type>`
  - `agentlint://artifact-path-hints/<type>`
  - `agentlint://artifact-spec/<type>`
  - `agentlint://scoring-policy/<type>`
  - `agentlint://assessment-schema/<type>`
  - `agentlint://improvement-playbook/<type>`

Client-led scoring notu:

- Asil puan authority: client weighted score (90%).
- Server guardrail dusuk agirlikla (10%) final skora etki eder.
- Export invalid veya kritik safety signal durumlari hard-fail sayilir.
- Icerik rewrite islemi MCP istemci LLM'i/editoru tarafinda yapilmali, sonra quality gate tekrar calistirilmalidir.

## 5) Workspace Scan Constraint

- Remote MCP server istemci dosya sistemini dogrudan tarayamaz.
- Repo tarama ihtiyaci icin iki yol vardir:
  - local stdio (`analyze_workspace_artifacts`),
  - veya dosya iceriklerini tool argumani olarak remote'a gondermek.

## 6) Windsurf Notes

- `agentlint-remote` icin `Authorization: Bearer <token>` header gerekli.
- `agentlint-local` `npx tsx <repo>/src/mcp/stdio.ts` ile tanimlanir.
- Config degisikliginden sonra MCP refresh/restart yapin.
- "server does not support resources" hatasinda once `<baseUrl>/readyz` kontrol edin (`capabilities.resources=true` olmali), sonra connector'u yeniden baslatin.
- Session header ile ilgili 400/404 hatalarinda server tarafinda `MCP_HTTP_STATELESS=true` ile stateless uyumluluk acin.

PowerShell token tanimlarken `:` karakteri nedeniyle su formati kullanin:

```powershell
$TOKEN = "your-token"
$env:MCP_BEARER_TOKENS = "windsurf=${TOKEN}:*"
```
