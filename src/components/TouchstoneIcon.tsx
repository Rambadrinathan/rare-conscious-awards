import Image from "next/image";

type Props = {
  touchstoneKey: string;
  kind: "cardinal" | "ordinal";
  className?: string;
};

/** Official RARE Pinwheel icons extracted from touchstones artwork */
const ICON_SRC: Record<string, string> = {
  energy: "/icons/ts-energy.png",
  water: "/icons/ts-water.png",
  waste: "/icons/ts-waste.png",
  wellbeing: "/icons/ts-wellbeing.png",
  inclusivity: "/icons/ts-inclusivity.png",
  heritage: "/icons/ts-heritage.png",
  biodiversity: "/icons/ts-biodiversity.png",
  light_footprint: "/icons/ts-light_footprint.png",
  community: "/icons/ts-community.png",
};

export function TouchstoneIcon({
  touchstoneKey,
  kind,
  className = "h-12 w-12",
}: Props) {
  const src = ICON_SRC[touchstoneKey];
  if (!src) {
    return (
      <span
        className={`inline-block rounded-full ${className} ${
          kind === "cardinal" ? "bg-rare-green/20" : "bg-rare-gold/25"
        }`}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-rare-white shadow-sm ring-1 ring-rare-border/80 ${className}`}
    >
      <Image
        src={src}
        alt=""
        width={128}
        height={128}
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}
