export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rare-border/70">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-5 py-8 text-center text-sm text-rare-muted">
        <p>
          For further details, write to{" "}
          <a
            href="mailto:bridges@rareindia.com"
            className="font-semibold text-rare-green-deep underline-offset-2 hover:underline"
          >
            bridges@rareindia.com
          </a>
        </p>
        <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} RARE India</p>
          <p className="italic">In a Regular World, Be RARE</p>
        </div>
      </div>
    </footer>
  );
}
