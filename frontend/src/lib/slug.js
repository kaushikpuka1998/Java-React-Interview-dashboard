// URL slug from a question's text, e.g. "What are the four..." -> "what-are-the-four-..."
export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
