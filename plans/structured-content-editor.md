# Plan: Structured Content Editor for /admin/content

## Context

`/admin/content` currently exposes one `<textarea>` per top-level section
(meta, header, hero, about, menu, location, contact, footer, jsonLd).
Each textarea holds the section's JSON. Editors paste JSON, hit Save &
Publish, action parses + decodes against `SiteContent` schema, writes
`content/site.json` to the bucket, and triggers a Railway redeploy.

This is unfriendly: editors deal with JSON syntax, bilingual fields buried
in nested objects, no asset discovery, no draft mode, every save is a
deploy. We're replacing it with a real form UI.

User picked (2026-05-06):
- Full schema-driven forms (every leaf has a real input)
- Asset picker integrated with the bucket-managed asset list
- Two-step save: Draft (no deploy) + Publish (deploy)

Follow-up decision (2026-05-07): collapse admin to a single page at
`/admin`. The old `/admin/content` route is removed rather than kept as
a compatibility alias.

Follow-up decision (2026-05-07): remove the standalone Assets admin
surface. Editors upload the menu PDF from the Menu section of the
structured content editor; image assets stay available through the
section-level asset pickers backed by bucket listing.

Follow-up decision (2026-05-07): split the editor's menu controls into
two collapsible admin sections. `menu carousel` owns heading, intro, and
carousel rows; `menu PDF` owns the PDF copy, uploader, and disclaimer.
Both sections still write to the same `menu.*` schema branch.

## Scope

- **In**: structured rendering of every section in `SiteContent`,
  bilingual EN/FR side-by-side inputs, array add/remove/reorder, image
  picker against bucket assets, menu PDF upload inside the Menu section,
  draft + publish workflow.
- **Out**: revision history, multi-user concurrency beyond the existing
  90s in-flight lock, role-based access (admin remains single-password),
  schema migrations / content versioning, undo/redo beyond browser back.
- **Stretch (defer to follow-up)**: WYSIWYG / rich-text for `description`
  fields, AI-assisted FR↔EN translation, preview-as-public-site iframe.

## Constraints

- Stack stays as-is: React Router 7 (v8_middleware), Effect v4, Bun.S3Client,
  Tailwind. No new framework deps without justification.
- UI primitives must use the local shadcn component layer
  (`app/components/ui/*`) instead of bespoke button/input/dialog styling.
  Add missing shadcn primitives through the existing project convention
  before composing custom editor UI.
- Wire format from form to action stays JSON-per-section. Server-side
  parsing, decoding, idempotency, in-flight lock, Railway trigger remain
  byte-identical. We change rendering only.
- Type safety: every section component accepts a `value` typed as the
  schema's section type and an `onChange`. Adding a schema field must
  produce a TS error if the form doesn't render it.
- Public site pre-renders against `content/site.json`. Drafts live at
  `content/site.draft.json` and are visible only inside `/admin`.
- Strict-mode loader (`ALLOW_DEFAULT_CONTENT` unset in prod) must keep
  working — the new draft path must not bypass it.
- Mobile-friendly: admin already passes mobile. Don't regress.
- Tests use `effect-bun-test`, Effect v4 control flow, and repo-local test
  layers. No `async`/`await`, raw Promise chains, `Promise.all`, or
  `new Promise(...)` in tests.

## Critical files

| File | Role | Touched |
|------|------|---------|
| `app/content/schema.ts` | Effect Schema for SiteContent | read-only |
| `app/content/defaults.ts` | bundled defaults | read-only |
| `app/content/loader.ts` | bucket → SiteContent (strict mode) | C5 (draft branch) |
| `app/routes/admin/content.tsx` | the page being rebuilt | C4, C5 |
| `app/routes/admin/_components/` | new shared form primitives | C1 (new) |
| `app/services/Storage.ts` | bucket put/get/head | C3 (add `list`) |
| `app/lib/managed-assets.ts` | static asset list | reference for picker fallback |
| `app/services/Railway.ts` | deploy trigger | unchanged |
| `app/content/publish-state.ts` | hash + in-flight lock | reused as-is |

## Applicable skills

- `effect-v4` — for any Storage extensions, Schema reads
- `bun` — `Bun.file().exists()`, `Bun.S3Client`
- (no `use-railway` work — Railway integration is already done)

## Gate command

```bash
bun run typecheck && bun run lint && bun test && bun run build
```

Must pass after every commit. `bun run build` exercises the prerender
which reads the bucket via the loader, so it catches loader regressions
end-to-end.

## Tooling migration added during implementation

This plan now includes the strict-tooling migration required to keep the
structured editor honest:

- `tsconfig.json` must use the `@effect/language-service` plugin through
  `@effect/tsgo`, with Effect warnings/suggestions/errors all counting in
  the `tsgo` exit code.
- The Effect diagnostic map should be maximally strict for correctness
  rules, but keep `missedPipeableOpportunity` and
  `strictBooleanExpressions` off because they are low-signal style churn
  for this app.
- Test files must relax only `strictEffectProvide` through
  `plugins[].overrides[].include`, matching the Effect v4/Gent pattern.
- Add an oxlint JS plugin rule, modeled after Gent's
  `no-promise-control-flow-in-tests`, that errors on test-file
  `async`/`await`, `try/finally`, Promise chains, `Promise.*`, and raw
  `new Promise(...)`.
- Add a `bun run lint` script and keep lint in the gate. Do not leave the
  repository in a state where lint only proves the config exists; it must
  pass.
- Convert existing async tests to `effect-bun-test` / Effect control flow
  as part of this plan. Where services are needed, create `.test` layers
  (for example `Storage.layerTest`) and provide those layers through Effect
  v4 DI instead of mutating globals or mocking module state.
- Tests should compose Effects directly rather than hiding Promise control
  flow in helpers; batch independent effects with Effect APIs, not
  `Promise.all`.

### Lint migration workstream

The lint migration is a first-class part of this goal, not an incidental
cleanup:

1. Add root oxlint config and the async-test guard plugin.
2. Add strict `@effect/language-service` config to `tsconfig.json`.
3. Convert affected tests to `effect-bun-test` and `.test` DI layers.
4. Fix or explicitly justify every new strict diagnostic surfaced by the
   migration.
5. Keep `bun run lint` in the canonical gate and run it with the rest of
   the gate before completion.

---

## Commit batching

Five commits. C1–C2 are pure additions (no behavior change). C3 adds
optional plumbing. C4 is the swap. C5 layers draft mode on top.

Each commit independently shippable + gates green.

---

## Commit 1: form primitives

**Justification**: a small kit of typed, controlled React components
that map cleanly onto Schema shapes. Built once, reused by every
section. No content-specific logic — just generic primitives.

**Principles**: `redesign-from-first-principles` (don't bolt onto raw
JSON); `migrate-callers-then-delete-legacy-apis` (primitives first,
sections second, swap last).

**Skills**: none (pure React/TSX).

**Changes**:

| File | Change | Lines |
|------|--------|-------|
| `app/routes/admin/_components/form-fields.tsx` | new — primitives | ~250 |

All primitives are **uncontrolled wrappers around plain HTML inputs**.
Every prop named `name` becomes the input's `name` attribute (the
FormData key). Every prop named `defaultValue` becomes the input's
`defaultValue`. No `value` / `onChange` props anywhere except inside
`<ArrayField>` (which manages its own local row-key state).

**Components to export**:

- `<TextField name defaultValue label multiline? />` — renders TWO
  uncontrolled inputs side-by-side: `name="${name}.en"` and
  `name="${name}.fr"`. `defaultValue: { en: string; fr: string }`.
  `multiline` switches to `<textarea>`.
- `<StringField name defaultValue label type? placeholder? />` — single
  uncontrolled `<input type="text|url|email|tel">`.
- `<NumberField name defaultValue label min? />` — uncontrolled
  `<input type="number">`. Numeric coercion happens server-side via
  Schema.
- `<SelectField name defaultValue label options />` — uncontrolled
  `<select>` for closed enums (e.g., `SocialKind`).
- `<ArrayField<T> name defaultValue renderItem newItem label />` —
  manages its own `useState<string[]>` of stable row keys. Renders
  `renderItem(item, rowName)` per row, where `rowName = ${name}.${i}`.
  `newItem(): T` produces defaults for added rows. Add/remove/up/down
  buttons mutate the row-key list only — leaf inputs in unaffected rows
  stay mounted. `defaultValue: readonly T[]`.
- `<StructField label children />` — pure visual `<fieldset><legend>`
  wrapper. No state, no name, just layout.

**Verification**:
- typecheck: every component has explicit prop types, no `any`.
- visual: render in isolation in `/admin/content` *just below* the
  existing form (temporarily) to eyeball EN/FR pairing, array
  add/remove, struct nesting. Remove the eyeball block before commit.
- gate: `bun run typecheck && bun test && bun run build` green.

---

## Commit 2: section components

**Justification**: one component per top-level section, composing the
C1 primitives. Each takes the section's schema type as `defaultValue`
plus a `name` prefix (e.g., `name="meta"`). Inputs inside compose names
hierarchically (`meta.title.en`, etc.). Adding a schema field forces a
TS error here.

**Principles**: `redesign-from-first-principles`.

**Skills**: none.

**Changes**:

| File | Change | Lines |
|------|--------|-------|
| `app/routes/admin/_components/sections.tsx` | new — section components | ~450 |

**Components to export** (one per top-level key in `SiteContent`).
Each accepts `{ name: string; defaultValue: SectionType }` and renders
its inputs with names prefixed by `name`:

- `<MetaSection name defaultValue />` — title, description, ogImage
  (raw struct fields in C2; picker in C3).
- `<HeaderSection ... />` — logo, navLinks (`<ArrayField>` of
  `{href, label}`), orderOnlineUrl, orderLong/Short, open/closeMenuLabel.
- `<HeroSection ... />` — since/headline/tagline, ctaPrimary +
  ctaSecondary (struct: href, label).
- `<AboutSection ... />` — heading/subheading/intro, storyBullets
  (`<ArrayField>` of Text), valueBullets, image.
- `<MenuSection ... />` — heading/intro, carousel (`<ArrayField>` of
  `{image, description}`), pdfHref/pdfHeading/pdfBody/pdfCta, disclaimer.
- `<LocationSection ... />` — heading/mapEmbedSrc/mapTitle, address
  (text + array of NonEmptyString lines), hoursHeading, hours
  (`<ArrayField>` of `{day, hours}`).
- `<ContactSection ... />` — heading/formHeading, phone/email fields,
  socials (`<ArrayField>` of `{kind: SocialKind via SelectField, href, ariaLabel}`).
- `<FooterSection ... />` — logo, tagline, quickLinks (array of NavLink),
  contactInfoLines (array of NonEmptyString), rightsLine.
- `<JsonLdSection ... />` — name/telephone/email/imageKey (raw string —
  picker in C3), menuPath, servesCuisine (array of strings), priceRange,
  address (struct of 5 strings), openingHours (array of struct), sameAs
  (array of strings).

Each section component owns no data, no state, no submit logic. It
renders inputs with the right `name` prefix and `defaultValue` from
props. The browser owns input state. The action owns submit handling.

**Verification**:
- typecheck: section component prop types reference `typeof
  XxxSchema.Type` directly. Adding/renaming a schema field breaks the
  build here.
- not yet wired into `content.tsx` — purely additive.
- gate: green.

---

## Commit 3: bucket asset listing + image picker + ImageRefField

**Justification**: image refs (`{key, alt, width, height}`) are not
free-text — they must point at an existing bucket asset, with auto-filled
dimensions. This commit introduces the picker plus a `<ImageRefField>`
that uses it, and wires it into the section components from C2.

**Principles**: `single-source-of-truth` (asset keys validated against
the bucket, not the static `MANAGED_ASSETS` list).

**Skills**: `bun` (S3Client list pagination), `effect-v4` (Storage
extension follows existing service shape).

**Changes**:

| File | Change | Lines |
|------|--------|-------|
| `app/services/Storage.ts` | add `list(prefix?)` op | +30 |
| `app/services/Storage.test.ts` | add list test | +15 |
| `app/routes/admin/_components/asset-picker.tsx` | new | ~120 |
| `app/routes/admin/_components/sections.tsx` | swap raw image structs to `<ImageRefField>` | ~60 modified |
| `app/routes/admin/content.tsx` | loader: include asset list | +15 |
| `package.json`, `bun.lock` | add `image-size` dep (optional, see below) | +1 |

**Key design choices**:

- **Storage.list**: thin wrapper over `Bun.S3Client.list(...)`. Returns
  `Effect<readonly { key: string; size: number; lastModified: Date }[],
  StorageError>`. Filters out `content/*` keys from the picker (those
  are CMS data, not display assets).
- **Loader change**: `/admin/content` loader now also returns
  `assetKeys: readonly string[]` from `Storage.list`. Failure is
  non-fatal — picker falls back to `MANAGED_ASSETS` and shows a banner.
- **Asset picker UX**: a button per ImageRef ("Pick image…") opens a
  dialog with thumbnail grid (using `imageSrc(key)` against the public
  prefix). Selecting an image fills `key`, `width`, `height`.
- **Width/height auto-fill**: two options:
  - **(a) `image-size` dep** (~50kb, pure JS). Server-side endpoint
    `/admin/content/asset-meta?key=…` reads bucket image, returns
    dimensions. Picker calls this on selection. Cleanest UX.
  - **(b) editor types width/height by hand**. Skip the dep. Picker
    fills `key` only; width/height inputs stay hand-edited. Fastest.
  - **Decision**: (a). The CLS-prevention story is the whole point of
    width/height in `ImageRef` — making editors hand-fill defeats it.
    `image-size` is unmaintained-ish but stable; alternative is
    `probe-image-size` (heavier).
- **ImageRefField shape**: shows current thumbnail + key + dimensions
  (read-only, derived from selection), plus an `<TextField>` for `alt`.

**Verification**:
- typecheck: green.
- `bun test` includes new Storage.list test.
- manually exercise the picker against a local seeded bucket — pick an
  image, confirm dimensions auto-fill, confirm rendered thumbnails.
- gate: green.

---

## Commit 4: wire structured editor into /admin/content

**Justification**: replace the per-section `<textarea>` loop with the
section components. Hidden inputs serialize each section's state to
JSON at submit time so the action stays unchanged.

**Principles**: `migrate-callers-then-delete-legacy-apis` — the action
side keeps the same wire format; we delete the textarea path
*completely* in this commit, not in parallel.

**Skills**: none.

**Changes**:

| File | Change | Lines |
|------|--------|-------|
| `app/routes/admin/content.tsx` | swap textarea loop for section components + hidden inputs | net ~+50, -80 |

**State shape — uncontrolled, FormData-only, no refs, no client JS at submit**:

Every leaf input is a plain HTML `<input>` / `<textarea>` / `<select>`
with a `name` attribute and a `defaultValue` from the loader's content.
There is **no** `useState<SiteContent>`, **no** `formRef`, **no**
`onSubmit` JS handler. The page does NOT re-render on keystroke. State
lives in the DOM, where the browser already manages it for free.

The `<Form method="post">` submit just sends FormData. The action does
all the work.

**Naming convention** (form `name` attribute → JSON path):

- `meta.title.en` → `content.meta.title.en`
- `header.navLinks.0.href` → `content.header.navLinks[0].href`
- `header.navLinks.0.label.fr` → `content.header.navLinks[0].label.fr`
- `meta.ogImage.key` → `content.meta.ogImage.key`
- `meta.ogImage.width` → `content.meta.ogImage.width` (number — action coerces)

Wide-format key. No parent JS work to assemble it.

**Action change** (`app/routes/admin/content.tsx`):

The current action expects per-section JSON blobs. The new action
expects the wide naming convention. Rewrite the FormData-decoding step:

```ts
// Server-side: walk every FormData entry, build nested object,
// then decode against SiteContent.
function assembleFromFormData(form: FormData): unknown {
  const root: Record<string, unknown> = {};
  for (const [name, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    if (name.startsWith('_') || name === 'intent') continue; // meta keys
    setPath(root, name.split('.'), value);
  }
  return root;
}
```

`setPath` walks the path, creating objects/arrays as it goes (numeric
segments → arrays). Schema-side `Schema.NumberFromString` /
`Schema.IntFromString` handles coercion for width/height — we don't
parseInt in the action.

Per-section error grouping continues to work: the existing
`fieldErrorsFromIssue` function already keys by `path[0]`, which is the
section name in the new naming convention.

**Array add/remove (the ONE place we need React state)**:

Arrays need a way for the editor to add/remove rows. We can't avoid
client state here, but we keep it tiny: each `<ArrayField>` owns a
component-local `useState<string[]>` of stable per-row keys (e.g.,
`crypto.randomUUID()`), used only for React's reconciliation when rows
are added/removed/reordered. The row's leaf inputs are still uncontrolled
— their `name` is computed from the row's index in render order.

```tsx
function ArrayField<T>({ name, items, newItem, renderItem }: ...) {
  const [keys, setKeys] = useState(() => items.map(() => crypto.randomUUID()));
  return (
    <div>
      {keys.map((rowKey, i) => (
        <div key={rowKey}>
          {renderItem(items[i] ?? newItem(), `${name}.${i}`)}
          <button type="button" onClick={() => setKeys(k => k.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setKeys(k => [...k, crypto.randomUUID()])}>
        Add
      </button>
    </div>
  );
}
```

When a row is removed, its inputs are removed from the DOM; FormData
doesn't include them. `setPath` only walks indices that exist — gaps
are fine because the editor sees a contiguous list. (We just iterate the
keys array in render order; the index in `name` always matches.)

When a row is added, `renderItem` receives `newItem()` for the new row's
`defaultValue`s. New leaves go straight to FormData on submit.

This keeps re-renders confined to the array's row list — typing in any
leaf input does not trigger a re-render.

**Submit flow**:

1. User clicks Save & Publish.
2. `<Form method="post">` posts FormData. No JS.
3. Action's `assembleFromFormData` builds nested object, decodes against
   SiteContent schema (catches type errors, missing fields, empty
   arrays, AssetKey constraints — all already covered by existing
   `app/content/schema.test.ts`).
4. Idempotency check → write `content/site.json` → Railway redeploy.
   **Existing flow.**

**Per-section error handling**:

- Action returns `fieldErrors: Partial<Record<SectionKey, string[]>>`
  same as today.
- Section component accepts an `errors?: string[]` prop, renders a
  rose-bordered banner + scroll-into-view on first invalid section
  (existing behavior, ported).
- We *lose* the "errors point to specific paths inside a section"
  granularity from the current Standard Schema formatter — for now,
  keep the same per-section list; per-leaf error mapping is a stretch
  goal for a follow-up.

**Verification**:
- typecheck: green.
- `bun test` unchanged (no new test files; existing
  `app/content/schema.test.ts` covers schema constraints).
- manual: edit each section type at least once, save, verify
  `content/site.json` round-trips through both directions
  (form → JSON → schema → form).
- gate: green.

---

## Commit 5: draft mode (Save Draft + Publish)

**Justification**: editors should be able to iterate on copy without
burning Railway builds. Drafts live at `content/site.draft.json`. The
public loader continues reading `content/site.json`. /admin/content
reads draft first, falls back to published.

**Principles**: `migrate-callers-then-delete-legacy-apis` — the public
loader signature stays exactly the same; the draft-aware path is admin-only.

**Skills**: `effect-v4` (loader dispatch).

**Changes**:

| File | Change | Lines |
|------|--------|-------|
| `app/content/loader.ts` | add `loadAdminContent()` returning `{ content, source: 'draft' \| 'published' \| 'defaults' }` | +30 |
| `app/content/loader.test.ts` | tests for the draft branch | +40 |
| `app/routes/admin/content.tsx` | two buttons (Save Draft, Publish), discard-draft button, "viewing draft" banner | +60 |

**Action variants** (use a hidden `intent` input):

- `intent=save-draft` → write `content/site.draft.json`, no Railway
  trigger, no publish-state mutation. Returns `{ ok: true, message: 'Draft saved' }`.
- `intent=publish` → existing flow. Promotes draft → site.json:
  - read draft (or current form state)
  - write `content/site.json` with the content
  - delete `content/site.draft.json` if present
  - run idempotency + Railway redeploy as today
- `intent=discard-draft` → delete `content/site.draft.json`. Reload
  loader serves published content again.

**UI**:

- If draft exists, banner above the form: "You're viewing an unpublished
  draft. Last saved: <timestamp>. [Discard draft]".
- Bottom bar: `[Save Draft]  [Save & Publish]`. Save Draft is the
  default (less destructive). Publish is the prominent dark button.

**Edge cases**:

- Draft + idempotency: if the draft exactly equals published content,
  Save Draft still writes the draft file (so editor sees the
  "viewing draft" banner). Publish still no-ops via existing hash check.
- Draft + Railway disabled: Publish writes site.json without redeploy
  (existing fallback). Save Draft is identical regardless.
- Decode failure on Save Draft: drafts must still validate against the
  schema. We don't allow unparseable drafts.

**Verification**:
- typecheck: green.
- `bun test`: new loader tests for draft-priority + draft-not-present
  + draft-decode-failure.
- manual: edit content, Save Draft, refresh — banner appears, content
  matches draft. Click Publish — banner disappears, site.json updated,
  Railway deploys.
- gate: green.

---

## Risks & open questions

- **`image-size` choice**: if the dep proves flaky on AVIF (the format
  most assets use), fall back to `probe-image-size` or skip auto-fill
  in C3 and leave width/height hand-edited.
- **Mobile UX of array reordering**: drag-and-drop is hard on touch.
  Plan ships `[↑] [↓]` buttons (touch-friendly) instead of HTML5 drag.
- **Draft scope**: only one draft at a time. No per-user drafts. Two
  editors hitting Save Draft concurrently → last write wins. Acceptable
  given the existing single-password admin and the in-flight lock on
  Publish.
- **Lost-work scenario**: uncontrolled forms have no JS-side dirty
  tracking. To warn on tab close, register a `beforeunload` listener
  that compares `new FormData(formEl)` to a snapshot taken on mount.
  Snapshot is just an array of `[name, value]` pairs (cheap). Do in C4.

## Verification end-to-end (post-C5)

1. Land C1–C5, all gates green, branch pushed.
2. Railway deploys.
3. Hit `pauloetsuzanne.com/admin/content`, log in.
4. Edit hero tagline EN. Click Save Draft. Refresh.
5. Banner shows draft. Site (in another tab) shows old tagline.
6. Click Discard. Banner gone. Form reverts.
7. Edit again. Click Save & Publish. Wait ~60s.
8. Site shows new tagline. Status banner shows new deployment id.
9. Edit an image: click "Pick image" on `meta.ogImage`, choose a
   different asset, dimensions auto-fill, alt text remains editable.
10. Re-publish. Verify `og:image` meta tag updates on the live page.

## Sequencing summary

| Commit | What | Risk | Rollback |
|--------|------|------|----------|
| C1 | Form primitives | Low — pure additions | Delete the file |
| C2 | Section components | Low — pure additions | Delete the file |
| C3 | Asset picker + Storage.list | Medium — new dep + bucket I/O on loader | Revert; sections fall back to raw fields |
| C4 | Wire into content.tsx | Medium — replaces user-facing form | Revert single file |
| C5 | Draft workflow | Medium — touches loader + action | Revert; admin loses draft button |

Stop after C4 and review before C5 if scope feels too large in one
session.

## Definition of done

- All 5 commits land on main, gate green for each.
- /admin/content has zero textareas (except optional rich-text fields).
- Asset picker pulls live bucket listing.
- Save Draft writes to `content/site.draft.json`, doesn't deploy.
- Publish writes to `content/site.json`, deploys, clears draft.
- Decoded content from a Save+Publish cycle round-trips through the
  schema unchanged from what the editor entered.
- Existing `app/content/*.test.ts` plus new Storage.list and loader
  draft tests all pass.
