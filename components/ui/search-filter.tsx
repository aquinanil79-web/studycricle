"use client";

import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlStyles } from "./action-form";
import { buttonStyles } from "./button";

/**
 * Search box with an optional dropdown filter.
 * It puts the values in the URL (?q=robotics&category=Technical); the page
 * reads them from searchParams and filters its database query on the server.
 *
 * <SearchFilter action="/clubs" query={q} placeholder="Search clubs"
 *   filter={{ name: "category", label: "All categories", value: category, options: CLUB_CATEGORIES }} />
 */
export function SearchFilter({
  action,
  query = "",
  placeholder,
  filter,
}: {
  action: string;
  query?: string;
  placeholder: string;
  filter?: { name: string; label: string; value?: string; options: readonly string[] };
}) {
  const isFiltered = Boolean(query || filter?.value);

  return (
    // The key remounts the form when the URL changes, so "Clear" also empties the inputs.
    <Form
      key={`${query}|${filter?.value ?? ""}`}
      action={action}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(controlStyles, "h-10 pl-9")}
        />
      </div>
      {filter && (
        <select
          name={filter.name}
          defaultValue={filter.value ?? ""}
          aria-label="Filter"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={cn(controlStyles, "h-10 sm:w-56")}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className={buttonStyles({ variant: "outline" })}>
        Search
      </button>
      {isFiltered && (
        <Link href={action} className={buttonStyles({ variant: "ghost" })}>
          Clear
        </Link>
      )}
    </Form>
  );
}
