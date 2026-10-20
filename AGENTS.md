<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture rules

- Catalogue, home images and settings are read from the database via `src/lib/queries.ts`; never hardcode products — the admin (step 3) will edit them.
- Orders are created only through the `create_order` SQL function, which recomputes the price; `src/lib/pricing.ts` must mirror it exactly.
- All colors/buttons come from utilities in `src/styles.css` (btn-manga, manga-panel…) to keep the manga theme consistent.
