import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robust active route matching for sidebars.
 * Handles exact matches, root dashboards, nested paths, trailing slashes, and sibling precedence.
 */
export function isRouteActive(pathname: string | null, itemHref: string, allHrefs: string[] = []): boolean {
  if (!pathname || !itemHref) return false
  const currentPath = pathname.replace(/\/$/, "") || "/"
  const targetPath = itemHref.replace(/\/$/, "") || "/"

  // 1. Exact match
  if (currentPath === targetPath) return true

  // 2. Base dashboards must match exactly
  const baseRoutes = ["/owner", "/hr", "/employee", "/superadmin", "/customer"]
  if (baseRoutes.includes(targetPath)) {
    return false
  }

  // 3. Prefix match for nested sub-routes (e.g. /owner/employees/123 -> /owner/employees)
  if (currentPath.startsWith(targetPath + "/")) {
    // Check if there is another menu item that matches the currentPath even more specifically
    const hasMoreSpecificMatch = allHrefs.some((otherHref) => {
      const otherTarget = otherHref.replace(/\/$/, "")
      return (
        otherTarget !== targetPath &&
        otherTarget.length > targetPath.length &&
        (currentPath === otherTarget || currentPath.startsWith(otherTarget + "/"))
      );
    })
    return !hasMoreSpecificMatch
  }

  return false
}

