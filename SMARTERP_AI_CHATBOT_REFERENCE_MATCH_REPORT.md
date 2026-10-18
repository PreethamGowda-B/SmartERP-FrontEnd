# SmartERP AI Chatbot Reference Match Report

## Summary

Updated the existing shared SmartERP AI panel to follow the supplied robot-chat reference more closely. The change is limited to the chatbot panel and its existing robot component. The visual result could not be confirmed in a browser because the local app port was unreachable from the in-app browser, so this report does not claim a verified reference match.

## Root causes of the mismatch

- The panel opened as a tall 430 × 720 px chat window with a generic app-like silhouette.
- A large gradient header and duplicate model/status badges consumed space and competed with the conversation.
- The existing robot appeared only as a small avatar; there was no larger robot perched over the desktop panel.
- The composer used three separate, oversized controls instead of one compact input group.
- Minimized mode showed only a header and did not offer the quick-input row shown in the reference.
- Welcome suggestions and personalized actions could appear together, creating duplicate chips.

## Files changed

- `components/smart-ai-panel.tsx`
  - Reduced the default desktop panel to a 400 px-wide, 620 px-high floating window and gave the card a restrained white surface, rounded corners, and a narrow purple top accent.
  - Added a larger centered robot above the desktop panel. The launcher and small response avatars remain available.
  - Reworked the header into a compact brand/description row. History, new conversation, expand, minimize, and close remain available; AUTO and Multi-Agent remain in the model toolbar.
  - Tightened chat spacing, assistant/user bubbles, and the welcome message. Welcome prompts remain role-specific and are shown as chips without duplicating personalized actions.
  - Reworked the composer into one rounded container with the existing voice input and a circular send button. Enter-to-send and Shift+Enter behavior are unchanged.
  - Added a minimized quick-input row that shares the existing input state, voice modal, send handler, and conversation transcript.
  - Kept the existing full-screen mobile panel, added safe-area padding, and prevented the minimized mobile layout from inheriting full-screen dimensions.
  - Applied reduced-motion behavior to the launcher, panel entrance, message entrance, robot animations, and secondary panel transitions.
  - Replaced the unsupported-sounding footer claim with a plain AI accuracy note.
- `components/smart-ai-robot.tsx`
  - Added a `hero` size using the existing SVG artwork, including small arm/paw details for the perched pose.
  - Preserved existing moods and reduced-motion behavior.

The chatbot is a shared component used by the portals; no portal-specific copy of the panel or backend/API file was changed. Existing role handling, tenant context, API endpoints, conversation history, model selection, CNC machine context, voice input, retry behavior, tool confirmation, and user permissions remain in the existing flow.

## State and responsive verification

| State or behavior | Source check | Browser visual check |
|---|---|---|
| Collapsed robot launcher and hover/tap | Present in shared component; reduced-motion branch preserved | Not verified |
| Expanded floating panel and perched robot | Implemented for the normal desktop panel | Not verified |
| Welcome message and role-specific prompt chips | Existing welcome flow retained and compacted | Not verified |
| Thinking indicator | Still driven by the real request loading state | Not verified |
| AI response and message history | Existing request and conversation state unchanged | Not verified |
| Error and retry | Existing error message and retry handler unchanged | Not verified |
| Minimized quick input | Uses the same input state and send/voice handlers | Not verified |
| Mobile full-screen layout and safe areas | Responsive classes and body scroll lock inspected | Not verified |
| Keyboard and reduced-motion behavior | Enter/Shift+Enter retained; motion preference used in animated states | Not verified |

## Checks run

- `npx tsc --noEmit` — passed.
- `npm run lint -- --file components/smart-ai-panel.tsx --file components/smart-ai-robot.tsx` — passed with no warnings or errors.
- `git diff --check` — passed after the final code and report changes.
- `npm run build` — did not complete on two attempts. Next.js failed with `EPERM: operation not permitted` while creating generated route directories under `.next/server/app` (the final attempt failed at `.next/server/app/[adminRoute]`). This is not treated as a successful build or as evidence of a source compile failure.

## Visual verification and remaining limitations

The local development server reported ready on `http://127.0.0.1:3000` with the API base explicitly overridden to `http://127.0.0.1:4000` to avoid production API calls. The in-app browser then failed to open `http://127.0.0.1:3000/owner` with `net::ERR_CONNECTION_TIMED_OUT`. No production portal was used for this preview. Therefore:

- No before/after screenshot was available.
- Desktop and mobile sizing, overlap, colors, and the hero robot placement have only been reviewed in source, not visually.
- The welcome, thinking, response, error, minimized, and collapsed states were not exercised in a running browser.
- The build output directory permission failure remains unresolved.

The remaining safe verification step is to reopen the local app in a browser that can reach the local dev server, then compare desktop and mobile screenshots and exercise each listed state. No production readiness or runtime behavior is claimed here.

No commit, push, deployment, production API call, or data change was performed.
