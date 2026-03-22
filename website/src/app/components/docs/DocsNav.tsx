"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavCategories } from "@/lib/docs";

export default function DocsNav() {
  const pathname = usePathname();
  const categories = getNavCategories();

  function isActive(href: string) {
    // Normalize: strip trailing slashes for comparison
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/docs";
    const normalizedHref = href.replace(/\/+$/, "") || "/docs";
    return normalizedPathname === normalizedHref;
  }

  return (
    <nav className="space-y-6">
      {categories.map((category) => (
        <div key={category.name}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#918C87]">
            {category.name}
          </h3>
          <ul className="space-y-1">
            {category.pages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive(page.href)
                      ? "bg-[#B5845A]/10 text-[#B5845A] font-medium"
                      : "text-[#6B6662] hover:bg-[#F0ECE7] hover:text-[#191716]"
                  }`}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
