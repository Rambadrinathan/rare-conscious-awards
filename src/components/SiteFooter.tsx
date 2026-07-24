export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rare-border/70">
      <div className="mx-auto flex max-w-3xl flex-col gap-1 px-5 py-8 text-center text-sm text-rare-muted sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} RARE India</p>
        <p className="italic">In a Regular World, Be RARE</p>
      </div>
    </footer>
  );
}
