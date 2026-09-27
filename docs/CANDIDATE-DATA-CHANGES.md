# Candidate seed changes (24 September 2026)

Applied to `data/catalogue.json` and `data/migration-provenance.json` by `scripts/candidate-data-migration.mjs` (idempotent). The shared Google Sheet was **not** changed; each item lists the manual Sheet edit needed before the reader is connected, otherwise the Sheet will overwrite these values.

| Change | IDs | Why | Sheet edit needed |
|---|---|---|---|
| Coding section order: Editors 1, Builders 2, Components 3, APIs 4, Agent skills 5, Hosting 6, Learning 7 | coding-1…7 (IDs unchanged) | Owner request (R02/R03) | Categories tab, Subcategory order for the seven Coding rows |
| Added **Codex**, rank 1 in Editors & coding assistants | `h-f97516a261`, https://openai.com/codex/ | Official OpenAI product, checked 24 Sep 2026 | New Resources row, Sort order 1 |
| Added **Claude Code**, rank 2 | `h-bd01975189`, https://claude.com/product/claude-code | Official Anthropic product, checked 24 Sep 2026 | New Resources row, Sort order 2 |
| Cursor rank 1 → 3 | `h-d8864b187c` | So Codex and Claude Code lead | Resources, Sort order |
| Hugging Face Learn: home Learning / Coding & technology learning, also Coding / Learning resources | `h-34dd482cd0` | Course catalogue misfiled into Agent skills by the migration's fallback | Resources Category/Subcategory; add Additional placements row |
| Optional `Sort order` column on Additional placements | schema | Rank a cross-listing within one subject without changing its home rank | Add the column when needed; older sheets parse unchanged |

The general Claude assistant (`h-5502a6be3b`, https://claude.ai/) is unchanged in Productivity. `opencodex` and `OpenClaude` remain separate third-party records.

Totals: 721 resources (682 Published, 32 Archived, 7 Draft); provenance 728 source entries (699 Codex, 700 Claude Code). The master markdown (v35) is outside this folder and was not edited; add entries 699–700 in v36 when the owner accepts them.
