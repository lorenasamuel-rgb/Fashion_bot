export function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M4 10.2L11 4l7 6.2V18a1 1 0 0 1-1 1h-4.2v-5.2H9.2V19H5a1 1 0 0 1-1-1v-7.8z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M11 4L6 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 1.4l1.45 3.05 3.35.42-2.47 2.28.65 3.3L7 8.85 4.02 10.45l.65-3.3L2.2 4.87l3.35-.42L7 1.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Person({ kind }: { kind: "men" | "women" | "unisex" | "kids" }) {
  if (kind === "women") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9.2 24V14.2c0-1.4 2-2.4 4.8-2.4s4.8 1 4.8 2.4V24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M11 16.5h6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "unisex") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="10" cy="7.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="18" cy="7.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.2 23v-7.2C6.2 14 8 13 10 13s3.8 1 3.8 2.8V23M14.2 23v-7.2C14.2 14 16 13 18 13s3.8 1 3.8 2.8V23" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "kids") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="11" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="18.2" cy="11.2" r="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M7 23v-6.2C7 15 8.6 14 11 14s4 1 4 2.8V23M15.2 23v-5.2c0-1.4 1.2-2.3 3-2.3s3 .9 3 2.3V23" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.5 24v-8.2C8.5 14 10.6 12.6 14 12.6s5.5 1.4 5.5 3.2V24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconAudience({ kind }: { kind: "men" | "women" | "unisex" | "kids" }) {
  return <Person kind={kind} />;
}

export function IconShirt() {
  return (
    <svg viewBox="0 0 120 148" className="h-full w-full" aria-hidden="true">
      <path
        d="M38 18l22 10 22-10 18 16-14 12v88H34V46L20 34l18-16z"
        fill="#d7ebf6"
        stroke="#1d1d1f"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M52 28c2 8 14 8 16 0" fill="none" stroke="#1d1d1f" strokeWidth="1.4" />
      <path d="M46 58h28M60 58v62" fill="none" stroke="#9ec3d6" strokeWidth="1.2" />
    </svg>
  );
}
