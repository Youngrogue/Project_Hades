# Suggest a tool: review, research and publishing

Updated 27 September 2026. The website side is implemented and verified locally. Nothing was submitted to the form, and the Google Sheet was not changed.

## How it works

1. A visitor selects **Suggest a tool**, which opens Sora's Tally form (https://tally.so/r/9qVrz1). Responses stay in Tally.
2. Sora reviews them in Tally from time to time and picks the promising ones.
3. Sora asks Claude or Codex, as an ordinary one-off task, to research that batch (prompt below).
4. The agent returns ready-to-add rows. Sora adds them to the catalogue Sheet, or separately authorises an agent with edit access to do it.
5. Rows marked **Published** appear on the site at its next Sheet check. That is at most six hours per running server instance (`REFRESH_SECONDS=21600`), and immediately on a fresh start or redeploy. No deployment is needed.

The site only reads prepared catalogue data. It has:

- no embedded form, Tally script or API key;
- no submission endpoint, database or webhook;
- no Inbox tab, review dashboard, scheduler, background agent or paid AI integration.

A suggestion can never publish itself or change the Sheet.

## On the website

- **Links:** two plain links, one in the collection toolbar (under the search bar) and one in the footer.
  - They work without JavaScript and open in a new tab with `rel="noopener noreferrer"`.
  - Screen readers hear "opens a form in a new tab".
  - They are 44px tall and show the standard focus ring.
- **Configuration:** the URL is set once, in `lib/site-config.mjs` (`SUGGEST_URL`). A test fails if it appears anywhere else in the page code.
- **Credit:** optional "Suggested by [name]" appears **only inside the tool popup**. It is a small, muted line after the description and "Useful for", before Visit website. It never appears in catalogue rows, cards or category lists. Without a name, the line is omitted entirely: no placeholder and no gap.

## Research request (copy into Claude or Codex when you have a batch)

> Research these suggested tools for the Hades catalogue: [paste the URLs, and each submitter's display name only if they ticked "credit me"]. For each one:
> 1. Confirm the official product website and that it is currently available.
> 2. Check for duplicates by name and domain in `hades-claude-version/data/catalogue.json`, including Archived and excluded entries (see `data/migration-provenance.json`).
> 3. Write a short, neutral description from the official page.
> 4. Choose an existing Category and Subcategory.
>
> Return rows ready to paste into the Resources tab, with the same headers. Use Status Published, a new ID in the `h-` + 10 hex style that is not already used, and today's date in Last verified. Put the display name in Suggested by only where consent is given. List anything unclear, discontinued or duplicate separately instead of making a row. Do not edit the Sheet or the site.

The agent may use its normal web access. Nothing in Hades runs this automatically.

## The form, as inspected (read only, no submission)

| Field | Current state | Needed |
|---|---|---|
| What's the website URL? | URL field, required | ✓ |
| What name should we know you by? | short text, required | ✓ |
| What makes it useful? | long text, optional | ✓ |
| Credit me if this is added to Hades. / Yes, credit me | checkbox, optional, **unchecked**, with "If we accept your suggestion, we may show your chosen name beside the resource." | ✓ |

**Suggested edits in Tally (none block the website):**

1. Under the URL question, add the help text: "Please link to the tool or app's official website."
2. Under the name question, add: "A first name or display name is fine."
3. Optionally rename the button from **Submit** to **Send suggestion**.
4. Optionally reword the credit help to "…we may show your chosen name in the tool's details on Hades." This matches the popup-only placement.
5. Check the confirmation message reads "Thanks for sharing your find. We'll review it for the collection." It can't be seen without submitting.
6. Submit one clearly labelled test response yourself and confirm it appears in Tally's responses.

A name alone is **not** permission to publish it. Credit a submitter only when the checkbox is ticked **and** the suggestion is accepted. Never copy an email address. Do not invent credits for tools found through research or other sources.

## Adding an accepted suggestion to the catalogue Sheet

1. In the **Resources** tab, add a row with:
   - a new permanent ID, Name, URL and a short neutral Description;
   - Category and Subcategory (from the Categories tab);
   - Status **Published**.

   Leave Sort order empty unless you want to rank it.
2. If the submitter ticked **Yes, credit me**, copy their chosen name into **Suggested by**. Otherwise leave it empty.
3. Nothing else from Tally is published.

**Rules the site enforces on Suggested by:**

- at most 60 characters;
- no email addresses;
- no `<` or `>`;
- shown as escaped plain text.

A row that breaks them fails validation, and the last valid catalogue stays live.

## Sheet changes needed before connecting the reader

- Add the header **`Suggested by`** in `Resources!T1`, the column after *Alternate URLs*. Existing rows stay empty. The reader requests `Resources!A:T` and matches columns by header name, so a Sheet without the column keeps working.
- Add the header **`Sort order`** in `Additional placements!E1`. The reader requests `A:E`.

Both are part of the combined update in `../handoff/claude-enhancements/sheet-update-2026-09-27/README.md`.
