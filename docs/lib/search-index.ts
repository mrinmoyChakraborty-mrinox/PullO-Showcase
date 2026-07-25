import { allNavItems, type NavItem } from "./nav";

export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  section?: string;
}

// Build-time static search index — consumed by CommandPalette via Fuse.js
export const searchIndex: SearchEntry[] = allNavItems.map((item: NavItem) => ({
  title: item.title,
  description: item.description ?? "",
  href: item.href,
}));
