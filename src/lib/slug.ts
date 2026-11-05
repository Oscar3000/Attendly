const MAX_SLUG_LENGTH = 60;

// The public URL segment for a title, /e/[slug]: "Pamela & Oscar" -> pamela-and-oscar
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // accents: é -> e
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
  return slug || "event";
}
