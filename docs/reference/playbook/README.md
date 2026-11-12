# AI Native Full Stack Assignment

Process, design and architecture docs for a mini real-time collaborative
document editor. The rules, formats and processes are ready to use; the
placeholders (`<...>`) are filled in as the system is built. In the repo the
docs live under `docs/`, except `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`,
`FONTS.md` and `AGENT_LOG.md` at the root.

Read in this order:
1. AGENTS.md / CLAUDE.md - the agent contract: read order, git checks, hard rules, ship steps
2. HANDOFF.md - where the last agent stopped (starts as an empty template)
3. AI_CONTEXT.md + ARCHITECTURE.md - the system in two minutes
4. CONTEXT_INDEX.md - the map of every doc and when to update it
5. ENGINEERING_JUDGMENT.md - how to choose a design
6. CODE_QUALITY.md - the bar every change clears
7. INVARIANTS.md - rules that must always hold
8. DESIGN.md + FONTS.md - visual system and type taste
9. PLATFORMS.md - phone and PC, every browser, motion rules
10. DATA_PORTABILITY.md - keep data movable between databases and hosts
11. SECURITY_LEDGER.md - standing security rules and the findings record
12. DEPLOYMENT.md - one way to ship
13. AI_REGRESSION.md - every AI bug becomes a regression case
14. MISTAKES.md - every bug and mistake: steps, fix, replay test, undo, never again
