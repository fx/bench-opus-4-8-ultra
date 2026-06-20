// Hardcoded colours the AgentPanel paints as TEXT on a light background (see
// docs/changes/0007 › contrast). Unlike the status lozenge (white text ON a
// colour), the agent panel's "done" banner and step-check render the colour AS
// text on the near-white panel surface (bg-panel ≈ #F4F5F7, plus a 10% tint on
// the banner). White-on-colour AA is a DIFFERENT requirement than colour-on-light
// AA, so these need their own AA-safe shades and their own guard.
//
// AGENT_DONE_COLOR is the success green used for the done banner text + the
// per-step done check. It is a DARKENED Atlaskit "done" green: the original
// #1F845A (the status lozenge green, fine for WHITE text at 4.66:1) renders at
// only ~3.79:1 as text on the 10%-tinted panel — a FAIL — so this darker shade is
// used wherever the green is text on light. Guarded by agent-colors.contrast.test.ts.
export const AGENT_DONE_COLOR = "#176B49"; // green on light ≥ 5.1:1 (AA)

// The near-white panel surface the agent panel sits on (Jira theme `--panel`).
// Kept here so the contrast guard checks the REAL rendered background, not pure
// white.
export const AGENT_PANEL_BG = "#F4F5F7";

// The done banner's background: a PRECOMPUTED 10% AGENT_DONE_COLOR tint composited
// over AGENT_PANEL_BG. Computed as a static hex (rather than CSS `color-mix()`,
// whose support only reaches Chrome 111+/Safari 16.2+/Firefox 113+) so it renders
// identically on every evergreen browser. The contrast guard verifies the green
// text clears AA on exactly this background.
export const AGENT_DONE_BANNER_BG = "#DEE7E6";

// AGENT_CANCEL_COLOR is the destructive RED used as TEXT for the agent panel's
// Cancel button (a ghost button). This is the INVERSE direction of the theme's
// `--destructive` (#DA3016): that token is darkened+guarded for WHITE text ON red
// (the notification badge), but here the red is TEXT on a LIGHT surface, which the
// theme token does NOT satisfy — #DA3016 is only 4.44:1 on the panel and 4.27:1 on
// the hover-accent, both FAILING AA for normal text. This darker red clears AA on
// BOTH surfaces with margin. Guarded by agent-colors.contrast.test.ts.
export const AGENT_CANCEL_COLOR = "#BD3015"; // red on light ≥ 5.2:1 (AA)

// The two LIGHT surfaces the Cancel red sits on, as the live Jira theme resolves
// them: the panel (`--panel`, the ghost button's transparent default → the panel
// shows through) and the hover-accent (`--accent`, the ghost button's :hover
// background). The contrast guard checks AGENT_CANCEL_COLOR against BOTH so the
// Cancel label clears AA in its default AND hover states.
export const AGENT_PANEL_SURFACE = "#F6F7F9";
export const AGENT_HOVER_ACCENT = "#ECF3FF";
