import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { PinwheelBackground } from "./PinwheelBackground";

export function PageShell({
  children,
  compactHeader = false,
}: {
  children: React.ReactNode;
  compactHeader?: boolean;
}) {
  return (
    <div className="paper-grain relative flex min-h-screen flex-col">
      <PinwheelBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader compact={compactHeader} />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
