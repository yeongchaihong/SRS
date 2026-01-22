import { useMemo, useState } from "react";
import { preloadModel } from "../../utils/preload";

// UPDATED MAPPING based on your file structure
const ASSET_MAP = {
  head: { model: "/3d-model/head_study.glb" },
  neck: { model: "/3d-model/neck.glb" },
  chest: { model: "/3d-model/chest.glb" },
  breast: { model: "/3d-model/human_female_breast_anatomy.glb" },
  abdomen: { model: "/3d-model/abdomen_anatomy.glb" },
  pelvis: { model: "/3d-model/VH_F_Pelvis.glb" },
  spine: { model: "/3d-model/the_human_spinal_column.glb" },
  cardiac: { model: "/3d-model/stylizedhumanheart.glb" },

  // Using the full body model for extremities since separate files aren't shown
  "upper extremity": { model: "/3d-model/arms_hands_head_legs_and_feet_low_poly_female.glb" },
  "lower extremity": { model: "/3d-model/arms_hands_head_legs_and_feet_low_poly_female.glb" },
  wholebody: { model: "/3d-model/arms_hands_head_legs_and_feet_low_poly_female.glb" },

  // Fallback
  default: { model: "/3d-model/arms_hands_head_legs_and_feet_low_poly_female.glb" },
};

export default function BodyAreaSelection({
  selectedPatient,
  masterData,
  onBack,
  onBodyAreaSelect,
}) {
  // 1. State for the Search Bar
  const [searchTerm, setSearchTerm] = useState("");

  // 2. Process masterData into a unique list of available areas
  const availableAreas = useMemo(() => {
    if (!masterData || masterData.length === 0) return [];

    const uniqueSet = new Set();
    const areas = [];

    masterData.forEach((item) => {
      // Robust check for Body Area key
      const areaName = item["Body Area"] || item.body_area || item.bodyArea;

      if (!areaName) return;

      const normalized = areaName.trim();
      const lowerKey = normalized.toLowerCase();

      if (!uniqueSet.has(lowerKey)) {
        uniqueSet.add(lowerKey);

        // Lookup specific model, otherwise use default
        const assets = ASSET_MAP[lowerKey] || ASSET_MAP.default;

        areas.push({
          name: normalized,
          model: assets.model,
        });
      }
    });

    return areas.sort((a, b) => a.name.localeCompare(b.name));
  }, [masterData]);

  // 3. Filter the areas based on the Search Term
  const filteredAreas = useMemo(() => {
    if (!searchTerm) return availableAreas;
    
    const lowerTerm = searchTerm.toLowerCase();
    return availableAreas.filter((item) => 
      item.name.toLowerCase().includes(lowerTerm)
    );
  }, [availableAreas, searchTerm]);

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden bg-slate-50">
      {/* Back Button */}
      <div className="flex w-full pt-6 px-6 md:px-12">
        <button
          onClick={onBack}
          className="text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
        >
          &lt; Back
        </button>
      </div>

      {/* Header & Search Bar */}
      <div className="flex flex-col items-center pt-6 px-6">
        <h1 className="font-extrabold md:text-4xl text-2xl mb-4">
          CHOOSE BODY AREA
        </h1>

        {/* Search Bar */}
        <div className="w-full max-w-md mb-6 relative">
          <input
            type="text"
            placeholder="Search body area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex lg:hidden w-full px-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col lg:flex-row flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-12 gap-4 lg:gap-16 items-center lg:items-start justify-center h-full pb-4 md:pb-8 z-10 overflow-hidden">
        
        {/* Left: Body Image Card - HIDDEN ON MOBILE/TABLET */}
        <div className="hidden lg:flex w-full lg:w-[50%] h-full items-center justify-center relative lg:-mt-10 overflow-hidden shrink-0">
          <img
            src={
              selectedPatient === "adult"
                ? "/photo/humanbody.png"
                : "/photo/humanbodychild.png"
            }
            alt="Body Reference"
            className="lg:h-[120%] w-auto object-contain lg:scale-[1.35] relative z-0"
          />
        </div>

        {/* Right: Grid Selection */}
        <div className="w-full lg:w-[50%] h-full flex flex-col justify-start lg:justify-center overflow-hidden">
          <div className="w-full max-h-full overflow-y-auto p-2 md:p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full pb-20 lg:pb-0">
              {filteredAreas.length > 0 ? (
                filteredAreas.map((item, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group hover:shadow-md hover:scale-105 hover:border-blue-400 hover:bg-blue-50/30 p-1 relative overflow-hidden"
                    onMouseEnter={() => preloadModel(item.model)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBodyAreaSelect(item.name, item.model);
                    }}
                  >
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                    <span className="font-bold text-xs md:text-sm text-slate-700 text-center uppercase break-words px-1 tracking-tight group-hover:text-slate-900 leading-tight">
                      {item.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10 font-medium">
                  No areas match "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}