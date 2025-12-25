import { useMemo } from "react";
import { HandWrittenTitle } from "../ui/hand-writing-text";

// Local mapping for 3D Models only (Icons removed)
const ASSET_MAP = {
  head: { model: "/models/head.glb" },
  neck: { model: "/models/neck.glb" },
  chest: { model: "/models/chest.glb" },
  breast: { model: "/models/chest.glb" }, 
  abdomen: { model: "/models/abdomen.glb" },
  pelvis: { model: "/models/pelvis.glb" },
  spine: { model: "/models/spine.glb" },
  "upper extremity": { model: "/models/arm.glb" },
  "lower extremity": { model: "/models/leg.glb" },
  cardiovascular: { model: "/models/chest.glb" },
  wholebody: { model: "/models/body.glb" }
};

export default function BodyAreaSelection({ selectedPatient, masterData, onBack, onBodyAreaSelect }) {
  
  const availableAreas = useMemo(() => {
    if (!masterData || masterData.length === 0) return [];

    const uniqueSet = new Set();
    const areas = [];

    masterData.forEach(item => {
      // Check "Body Area" (Space + Caps) based on your JSON
      const areaName = item["Body Area"] || item.body_area; 
      
      if (!areaName) return;
      
      const normalized = areaName.trim();
      const lowerKey = normalized.toLowerCase();
      
      if (!uniqueSet.has(lowerKey)) { 
        uniqueSet.add(lowerKey);
        
        const assets = ASSET_MAP[lowerKey] || {};
        
        areas.push({
          name: normalized,
          model: assets.model || null 
        });
      }
    });

    return areas.sort((a, b) => a.name.localeCompare(b.name));
  }, [masterData]);

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
          <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
            {availableAreas.length > 0 ? (
              availableAreas.map((item, index) => (
                <div
                  key={index}
                  className="aspect-square bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group hover:shadow-md hover:scale-105 hover:border-blue-400 hover:bg-blue-50/30 p-1 relative overflow-hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBodyAreaSelect(item.name, item.model);
                  }}
                >
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />

                  {/* Text Only Display */}
                  <span className="font-bold text-sm text-slate-700 text-center uppercase break-words px-1 tracking-tight group-hover:text-slate-900">
                    {item.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10 font-medium">
                 No areas found for this patient type.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}