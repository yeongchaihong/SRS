import { HandWrittenTitle } from "../ui/hand-writing-text";
import { BODY_AREAS } from "@/constants/bodyAreas";

export default function BodyAreaSelection({ selectedPatient, onBack, onBodyAreaSelect }) {
  return (
    <div className="flex flex-col w-full h-full relative">
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      {/* Header */}
      <div className="w-full flex justify-center mt-4 mb-4 h-40 shrink-0 z-10">
        <HandWrittenTitle title="CHOOSE BODY AREA" subtitle="" className="py-12" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 w-full max-w-[1400px] mx-auto px-12 gap-16 items-center justify-center h-full pb-8 z-10">

        {/* Left: Body Image Card */}
        <div className="w-[50%] h-full flex items-center justify-center relative -mt-10 overflow-hidden">
          <img
            src={selectedPatient === 'adult' ? "/photo/humanbody.png" : "/photo/humanbodychild.png"}
            alt="Body Reference"
            className="h-[120%] w-full object-contain scale-[1.35] relative z-0"
          />
        </div>

        {/* Right: Grid Selection */}
        <div className="w-[50%] h-full flex items-center justify-center pl-4">
          <div className="grid grid-cols-6 gap-3 w-full">
            {BODY_AREAS.map((item, index) => (
              <div
                key={index}
                className={`aspect-square bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group hover:shadow-md hover:scale-105 hover:border-blue-400 hover:bg-blue-50/30 p-1 relative overflow-hidden ${item.action ? '' : 'opacity-100'}`}
                onClick={(e) => {
                  if (item.action) {
                    e.stopPropagation();
                    onBodyAreaSelect(item.action, item.model || null);
                  }
                }}
              >
                {/* Clinical Accent - Static for all */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />

                {item.image ? (
                  <>
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform mix-blend-multiply" />
                    <div className="flex flex-col items-center leading-tight z-10">
                      <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">{item.name}</span>
                      {item.subtitle && <span className="font-medium text-[10px] text-slate-500">{item.subtitle}</span>}
                    </div>
                  </>
                ) : (
                  <span className="font-bold text-sm text-slate-700 text-center uppercase break-words px-1 tracking-tight group-hover:text-slate-900">{item.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
