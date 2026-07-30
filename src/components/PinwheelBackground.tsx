export function PinwheelBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-[18%] h-[min(90vw,720px)] w-[min(90vw,720px)] -translate-x-1/2 opacity-[0.07]"
        style={{
          backgroundImage: "url(/pinwheel-bg.jpeg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "contain",
        }}
      />
      <div
        className="absolute bottom-[-8%] right-[-6%] h-[min(70vw,480px)] w-[min(70vw,480px)] opacity-[0.05]"
        style={{
          backgroundImage: "url(/pinwheel-mark.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "contain",
        }}
      />
    </div>
  );
}
