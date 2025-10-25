"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <Logo />
            <p className="font-bold text-inherit text-xl">StudyMate</p>
          </NextLink>
        </NavbarBrand>
        
        {/* Desktop Navigation - Only show main nav items when authenticated */}
        {isAuthenticated && (
          <ul className="hidden lg:flex gap-4 justify-start ml-2">
            {siteConfig.navItems.slice(1).map((item) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                    pathname === item.href && "text-primary font-medium"
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        )}
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        
        {isAuthenticated && user ? (
          <NavbarItem className="hidden md:flex">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={user.full_name}
                  size="sm"
                  isBordered
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user.email}</p>
                </DropdownItem>
                <DropdownItem key="dashboard" href="/dashboard" as={NextLink}>
                  Dashboard
                </DropdownItem>
                <DropdownItem key="discover" href="/discover" as={NextLink}>
                  Discover
                </DropdownItem>
                <DropdownItem key="connections" href="/connections" as={NextLink}>
                  Connections
                </DropdownItem>
                <DropdownItem key="chat" href="/chat" as={NextLink}>
                  Chat
                </DropdownItem>
                <DropdownItem key="profile_page" href="/profile" as={NextLink}>
                  Profile Settings
                </DropdownItem>
                <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        ) : (
          <>
            <NavbarItem>
              <Button
                as={NextLink}
                color="default"
                href="/login"
                variant="flat"
              >
                Sign In
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={NextLink}
                color="primary"
                href="/register"
                variant="shadow"
              >
                Get Started
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              {/* User info */}
              {user && (
                <div className="px-2 py-4 border-b border-divider">
                  <div className="flex items-center gap-3">
                    <Avatar
                      color="primary"
                      name={user.full_name}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-sm text-default-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Authenticated menu items */}
              {siteConfig.navMenuItems.map((item, index) => (
                <NavbarMenuItem key={`${item.href}-${index}`}>
                  <Link
                    as={NextLink}
                    className="w-full"
                    color={pathname === item.href ? "primary" : "foreground"}
                    href={item.href}
                    size="lg"
                  >
                    {item.label}
                  </Link>
                </NavbarMenuItem>
              ))}
              
              <NavbarMenuItem>
                <Button
                  className="w-full"
                  color="danger"
                  variant="flat"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              {/* Unauthenticated menu items */}
              <NavbarMenuItem>
                <Link
                  as={NextLink}
                  className="w-full"
                  color="foreground"
                  href="/login"
                  size="lg"
                >
                  Sign In
                </Link>
              </NavbarMenuItem>
              <NavbarMenuItem>
                <Button
                  as={NextLink}
                  className="w-full"
                  color="primary"
                  href="/register"
                  variant="shadow"
                >
                  Get Started
                </Button>
              </NavbarMenuItem>
            </>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
