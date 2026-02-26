import { useMemo, useState } from "react";
import { preloadModel } from "../../utils/preload";
import { BODY_AREAS } from "../../constants/bodyAreas";

const DEFAULT_MODEL =
  BODY_AREAS.find((area) => area.action === "extremities")?.model ||
  "/3d-model/arms_hands_head_legs_and_feet__low_poly_female.glb";

const ASSET_MAP = BODY_AREAS.reduce((map, area) => {
  if (!area?.action || !area?.model) return map;
  map[area.action.toLowerCase()] = { model: area.model };
  return map;
}, {});

const AREA_META_MAP = BODY_AREAS.reduce((map, area) => {
  if (!area?.action) return map;
  map[area.action.toLowerCase()] = area;
  return map;
}, {});

const getAreaAssets = (lowerKey) => {
  const direct = ASSET_MAP[lowerKey];
  if (direct) {
    return {
      model: direct.model,
      linkedAreas: [],
    };
  }

  if (lowerKey.includes("-")) {
    const parts = lowerKey
      .split("-")
      .map((part) => part.trim())
      .filter(Boolean);

    const linkedAreas = parts
      .map((part) => {
        const meta = AREA_META_MAP[part];
        const model = ASSET_MAP[part]?.model;
        if (!model) return null;
        return {
          name: meta?.name || part,
          model,
        };
      })
      .filter(Boolean);

    if (linkedAreas.length > 0) {
      return {
        model: linkedAreas[0].model,
        linkedAreas,
      };
    }
  }

  return {
    model: DEFAULT_MODEL,
    linkedAreas: [],
  };
};

export default function BodyAreaSelection({
  selectedPatient,
  masterData,
  onBack,
  onBodyAreaSelect,
  onMultiBodyAreaSelect,
}) {
  // 1. State for the Search Bar
  const [searchTerm, setSearchTerm] = useState("");
  // 2. State for Multi-Select Mode (always enabled)
  const [selectedAreas, setSelectedAreas] = useState([]);

  // 3. Process masterData into a unique list of available areas
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

        // Lookup specific/composite model assets from BODY_AREAS
        const assets = getAreaAssets(lowerKey);

        areas.push({
          name: normalized,
          model: assets.model,
          linkedAreas: assets.linkedAreas,
        });
      }
    });

    return areas.sort((a, b) => a.name.localeCompare(b.name));
  }, [masterData]);

  // 4. Filter the areas based on the Search Term
  const filteredAreas = useMemo(() => {
    if (!searchTerm) return availableAreas;

    const lowerTerm = searchTerm.toLowerCase();
    return availableAreas.filter((item) =>
      item.name.toLowerCase().includes(lowerTerm)
    );
  }, [availableAreas, searchTerm]);

  // 5. Toggle an area in the selected list
  const toggleAreaSelection = (areaItem) => {
    setSelectedAreas((prev) => {
      const exists = prev.find(
        (a) => a.name.toLowerCase() === areaItem.name.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (a) => a.name.toLowerCase() !== areaItem.name.toLowerCase()
        );
      } else {
        return [...prev, areaItem];
      }
    });
  };

  // 6. Handle area click (always multi-select)
  const handleAreaClick = (item, e) => {
    e.stopPropagation();
    if (isMultiSelect) {
      toggleAreaSelection(item);
    } else {
      onBodyAreaSelect(item.name, item.model);
    }
  };

  // 7. Check if area is selected
  const isAreaSelected = (areaName) => {
    return selectedAreas.some(
      (a) => a.name.toLowerCase() === areaName.toLowerCase()
    );
  };

  // 8. Handle next step with selected areas
  const handleNext = () => {
    if (selectedAreas.length > 0 && onMultiBodyAreaSelect) {
      onMultiBodyAreaSelect(selectedAreas);
    }
  };

  return (
    <div 
      className="flex flex-col w-full h-full relative overflow-hidden pt-18 md:pt-23"
      style={{
        backgroundImage: "radial-gradient(circle at center, #93c5fd, transparent)",
        backgroundColor: "#fff",
      }}
    >
      {/* Mobile background */}
      <div className="absolute inset-0 z-0 lg:hidden" style={{background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #4180de 100%)"}}/>

      {/* Header & Search Bar */}
      <div className="flex flex-col items-center pt-6 px-6 relative z-10">
        <div className="flex flex-row items-center mb-4 gap-2">
          <button
            onClick={onBack}
            className="text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20 pr-2 md:hidden"
          >
            &lt;
          </button>
          <h1 className="font-extrabold md:text-4xl text-2xl">
            CHOOSE BODY AREA
          </h1>
        </div>

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
      <div className="flex flex-col lg:flex-row flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-12 gap-4 lg:gap-16 items-center lg:items-start justify-center h-full pb-4 md:pb-8 z-10 overflow-hidden" style={{marginTop: '-5px'}}>

        {/* Left: Body Image Card - HIDDEN ON MOBILE/TABLET */}
        <div className="hidden lg:flex w-full lg:w-[50%] h-full items-center justify-start relative lg:pt-8 lg:pb-16 overflow-visible shrink-0">
          <img
            src={
              selectedPatient === "adult"
                ? "/photo/humanbody.png"
                : "/photo/humanbodychild.png"
            }
            alt="Body Reference"
            className="lg:h-[110%] w-auto object-contain lg:scale-[1.35] relative z-0"
            style={{marginTop: '15px'}}
          />
        </div>

        {/* Right: Grid Selection */}
        <div className="w-full lg:w-[50%] h-full flex flex-col justify-start lg:justify-center overflow-hidden">
          <div className="w-full max-h-full overflow-y-auto p-2 md:p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full pb-4 lg:pb-0">
              {filteredAreas.length > 0 ? (
                filteredAreas.map((item, index) => {
                  const selected = isAreaSelected(item.name);
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group p-1 relative overflow-hidden backdrop-blur-md
                        ${selected
                          ? "bg-slate-900/90 border-white/30 text-white shadow-xl shadow-blue-900/80 scale-[1.08]"
                          : "bg-white/40 border-white/60 shadow-lg shadow-blue-900/50 hover:shadow-2xl hover:shadow-blue-900/70 hover:scale-105 hover:border-white/80 hover:bg-white/50"
                        }
                      `}
                      onMouseEnter={() => preloadModel(item.model)}
                      onClick={(e) => handleAreaClick(item, e)}
                    >
                      <span 
                        className={`font-bold text-center uppercase break-words px-1 leading-tight
                        ${selected ? "text-white" : "text-slate-800 group-hover:text-slate-900"}
                      `}
                        style={{fontSize: '12px'}}
                      >
                        {item.name}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10 font-medium">
                  No areas match "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Next Step Button */}
          <div className="px-2 md:px-4 pb-4">
            <button
              onClick={handleNext}
              disabled={selectedAreas.length === 0}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                ${selectedAreas.length > 0
                  ? "bg-slate-900 text-white hover:bg-black active:scale-[0.99] shadow-lg shadow-slate-500"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
                }
              `}
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}