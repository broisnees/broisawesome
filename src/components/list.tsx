import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Icon } from "./icon";

/** Self-hosted (96px) so the byline never waits on a third-party host. */
const AVATAR = "/avatar.jpg";

/** Small facts (dates, counts, places): quiet, with even digits. */
export const metaClass = "text-sm tabular-nums";

/**
 * Centered title block every page opens with, so content starts at the same
 * height. `children` sits under the description (byline, actions).
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-14 text-center sm:mb-16">
      <h1 className="display text-[2rem]/[1.15] text-balance sm:text-[2.5rem]/[1.1]">
        {title}
      </h1>
      {description && (
        <p className="mx-auto mt-4 max-w-[30rem] text-lg/[1.6] tracking-[-0.01em] text-pretty text-muted">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}

/** Avatar, name, then any facts about the page. */
export function Byline({ children }: { children?: ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-muted">
      <img
        src={AVATAR}
        alt=""
        width={22}
        height={22}
        className="size-[22px] rounded-full outline-1 -outline-offset-1 outline-(--image-outline)"
      />
      <span className="text-sm text-fg">Nischal Dahal</span>
      {children}
    </div>
  );
}

/** A fact in the byline, set off with a blue dot. */
export function Fact({ children }: { children: ReactNode }) {
  return (
    <span className={`flex items-center gap-2.5 ${metaClass}`}>
      <span aria-hidden className="size-1 rounded-full bg-accent" />
      {children}
    </span>
  );
}

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconSvgElement;
  children: ReactNode;
}) {
  return (
    <section className="mt-20">
      <h2 className="display mb-4 flex items-center gap-2.5 text-[1.375rem]/8 sm:text-[1.625rem]/9">
        {icon && (
          <Icon icon={icon} size={22} className="shrink-0 text-accent" />
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Classes for the link that wraps a `RowBody`. Text stays on the column edge;
 * the hover brackets hang 12px outside it.
 */
export const rowClass =
  "corners -mx-3 flex flex-col gap-0.5 px-3 py-2.5 leading-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6";

/** One list row: title (and description) on the left, a quiet fact on the right. */
export function RowBody({
  title,
  description,
  meta,
  detail,
}: {
  title: string;
  description?: string;
  /** A third, smaller line: platforms and the like. */
  meta?: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <>
      <span className="min-w-0">
        <span className="block font-[550] text-fg">{title}</span>
        {description && (
          <span className="block text-pretty text-muted">{description}</span>
        )}
        {meta && (
          <span className="mt-1 block text-[0.8125rem] text-muted">{meta}</span>
        )}
      </span>
      {detail && (
        <span className={`shrink-0 whitespace-nowrap text-muted ${metaClass}`}>
          {detail}
        </span>
      )}
    </>
  );
}

export function More({
  to,
  children,
}: {
  to: "/projects" | "/writing";
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group mt-4 inline-flex items-center gap-1.5 text-sm text-muted transition-[color] duration-150 ease-out hover:text-fg"
    >
      {children}
      <Icon
        icon={ArrowRight02Icon}
        size={14}
        className="text-accent transition-[translate] duration-150 ease-out group-hover:translate-x-0.5"
      />
    </Link>
  );
}
