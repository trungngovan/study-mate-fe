export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "StudyMate",
  description: "Find study buddies near you and learn together.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Discover",
      href: "/discover",
    },
    {
      label: "Connections",
      href: "/connections",
    },
    {
      label: "Chat",
      href: "/chat",
    },
    {
      label: "Profile",
      href: "/profile",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Discover",
      href: "/discover",
    },
    {
      label: "Connections",
      href: "/connections",
    },
    {
      label: "Chat",
      href: "/chat",
    },
    {
      label: "Profile",
      href: "/profile",
    },
  ],
  links: {
    github: "https://github.com/studymate",
    twitter: "https://twitter.com/studymate",
    docs: "/",
    discord: "https://discord.gg/studymate",
    sponsor: "https://patreon.com/studymate",
  },
};
