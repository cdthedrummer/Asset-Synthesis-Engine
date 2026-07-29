/**
 * One place for the product's name, so the next rename is one edit.
 *
 * `urlPath` is deliberately NOT derived from the name. The app is called
 * Shortlist and served from /next-leap/, and that mismatch is intentional:
 * there are no accounts, so a board's URL *is* its account. Changing the path
 * would 404 every link anyone has saved or shared, plus the demo tokens.
 *
 * If the path is ever migrated, the web app manifest's `id` must STAY
 * "/next-leap/" — it is the permanent identity of an installed app, and
 * changing it forks every existing installation into a duplicate.
 */
export const BRAND = {
  name: 'Shortlist',
  tagline: 'What to drop, the order for the rest.',
  urlPath: '/next-leap/',
} as const;
