// components/GlobalBackButton.jsx
export default function GlobalBackButton({ onClick, visible }) {
  if (!visible) return null;

  return (
    <div className="absolute top-0 -left-2 w-full pt-6 px-6 md:px-12 z-[70] pointer-events-none">
      <button
        onClick={onClick}
        className="pointer-events-auto text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 bg-slate-50/50 backdrop-blur-sm px-2 rounded-lg"
      >
        &lt; Back
      </button>
    </div>
  );
}