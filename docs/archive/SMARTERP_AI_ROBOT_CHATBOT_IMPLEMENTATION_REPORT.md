# SmartERP AI Robot Chatbot Implementation Report

## Existing architecture found

- `app/layout.tsx` mounts `FloatingActionHub` once at the authenticated application root. `components/floating-action-hub.tsx` renders the existing `SmartAIPanel`; this is the live shared chatbot for the supported portals.
- The panel sends JSON messages through the existing `apiClient` to `POST /api/ai/agent`, with the current page, portal, module, recent conversation history, and selected specialist context. Conversations remain in browser storage under a key scoped to the signed-in user ID.
- The backend mounts `routes/ai.routes.js` under the `/api` and `/api/v1` routers. The agent route uses `authenticateToken` and `loadPlan`, sanitizes prompts, applies the existing user-scoped Redis rate limit when Redis is available, builds role/company context through `ai/context/context.engine.js`, and selects tools through `ai/plugins/index.js`. Tool access is filtered and checked by role on the server. No chatbot backend or database changes were needed.
- The regular agent path is request/response JSON; it does not stream tokens. Existing voice support uses `VoiceInputModal` and the same protected agent endpoint.
- `components/ai-chat-bot.tsx` is a legacy component. It is imported in Owner/HR layouts but is not rendered there; the app-level `SmartAIPanel` is the actual launcher and chat window.
- The global assistant currently hides itself on public and `/customer*` routes. This implementation preserves that existing customer-portal boundary; it does not add a new customer-facing AI capability.

## Changes made

- Replaced the live purple sparkle launcher with a project-owned SVG robot mascot: pearl shell, violet/blue accents, dark face, antenna, expressive eyes, and reduced-motion-aware movement. The launcher remains fixed near the lower right and does not invent an unread count.
- Redesigned the live chat as a rounded floating desktop panel with a compact robot header, minimize, expand, and close controls, dark-mode styling, a mobile full-height safe-area layout, and a composer that stays at the bottom and grows with text.
- Added actual mascot states for thinking, successful responses, errors, and microphone listening. The listening state follows `VoiceInputModal`'s real speech-recognition state; the header does not claim the service is online.
- Kept the mascot inside the launcher button and reserved the success animation for an explicit server-confirmed action; ordinary AI answers and voice responses no longer imply that a business operation completed. Voice failures now drive the mascot's error state. The mobile full-screen panel locks background scrolling and restores the prior body setting when closed or minimized.
- Changed welcome prompts by role and filtered backend follow-up suggestions for employees so owner-only financial, tax, and payroll topics are not advertised to them. Backend authorization remains authoritative.
- Added an in-flight guard against duplicate sends. Retrying a failed text prompt reuses the prompt without adding a duplicate user message and exposes a retry action on its error bubble.
- Added a synchronous confirmation lock so rapid repeated taps cannot submit the same confirmation twice before React updates the loading state.
- Avoided offering an automatic retry when a state-changing confirmation request has an uncertain result; the response instructs the user to check the related module first, preventing a blind duplicate action.
- Corrected the existing fake action-confirmation toast. A confirmation now calls the existing authenticated `/api/ai/confirm-action` route with its real `toolName` and parameters and displays the server result. Uncertain outcomes ask the user to verify the related module rather than blindly retrying a possible state change. A confirmation without an executable tool reference is disabled and clearly marked as not submitted.
- Kept the current API request/response format, conversation storage, navigation, model selection, plan UI, existing feedback flow, and voice modal. No new dependency, backend endpoint, schema, or migration was added.

## Files changed for this task

- `components/smart-ai-panel.tsx`
- `components/smart-ai-robot.tsx` (new)
- `components/voice-input-modal.tsx`
- `SMARTERP_AI_ROBOT_CHATBOT_IMPLEMENTATION_REPORT.md` (this report)

No backend files were changed. No production API or data was accessed.

## Portal and permission coverage

The shared panel remains mounted once at the app root and derives its current portal from the route for Owner, Employee, HR, and Super Admin pages. Customer pages remain excluded as before. Welcome prompts vary by role, and the backend continues to enforce authentication, tenant context, plan limits, and role permissions. The UI filtering is only a presentation aid, not a security control.

## Verification

- `npm run lint`: **PASS**. It completed with existing warnings in other application files; no new chatbot-specific lint error was reported.
- Focused strict TypeScript check for `smart-ai-panel.tsx`, `smart-ai-robot.tsx`, `voice-input-modal.tsx`, and their imports: **PASS**.
- Focused ESLint run on the three chatbot components after the finishing changes: **PASS**.
- Focused `git diff --check` on the modified chatbot files: **PASS**.
- Full `npx tsc --noEmit`: **PASS** after the finishing changes. An earlier run raced Next's `.next/types` regeneration and failed on missing generated files; that was transient.
- `npm run build`: **BLOCKED** by local filesystem errors creating route folders under `.next/server/app` (`EPERM: operation not permitted`). A retry with Sentry source-map upload disabled failed at a different route directory, so there is no full-build result.
- No dedicated chatbot component/integration test script was present in the frontend package scripts. No browser-based visual test or authenticated live AI request was run; visual behavior is source-checked only.
- A repository-wide `git diff --check` reports trailing whitespace in the separately modified `app/owner/page.tsx`. That file is outside this task and was left untouched; the focused chatbot diff check passes.

## Remaining limitations

- Customer portal access to SmartERP AI remains intentionally unavailable because the existing panel explicitly suppresses `/customer*` routes. Enabling it requires a separate product and permission review.
- The launcher has no unread badge because the assistant has no unread-message source. It does not show a fabricated indicator.
- A live visual comparison at desktop/tablet/mobile widths remains to be done in an authenticated browser session.
- Other worktree edits observed during this task—including `app/owner/page.tsx`, `components/proactive-ai-insights.tsx`, and `components/subscription-status.tsx`—were not changed or included in this implementation.
