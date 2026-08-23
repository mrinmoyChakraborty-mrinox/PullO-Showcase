export interface NavItem {
  title: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Home",
    items: [
      { title: "Overview", href: "/" },
    ],
  },
  {
    title: "Docs",
    items: [
      { title: "Getting Started", href: "/getting-started" },
      { title: "Reference", href: "/reference" },
      { title: "Guides", href: "/guides" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Changelog", href: "/changelog" },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);