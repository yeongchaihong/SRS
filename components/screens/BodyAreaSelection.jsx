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

export default function BodyAreaSelection({
  selectedPatient,
  masterData,
  onBack,
  onBodyAreaSelect,
  onMultiBodyAreaSelect,
}) {
  // 1. State for the Search Bar
  const [searchTerm, setSearchTerm] = useState("");
  // 2. State for Multi-Select Mode
  const [isMultiSelect, setIsMultiSelect] = useState(false);
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

        // Lookup specific model from BODY_AREAS, otherwise use default
        const assets = ASSET_MAP[lowerKey] || { model: DEFAULT_MODEL };

        areas.push({
          name: normalized,
          model: assets.model,
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

  // 5. Multi-select toggle handler
  const toggleMultiSelect = () => {
    setIsMultiSelect((prev) => {
      if (prev) {
        // Turning OFF multi-select — clear selections
        setSelectedAreas([]);
      }
      return !prev;
    });
  };

  // 6. Toggle an area in the selected list
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

  // 7. Handle area click (single or multi)
  const handleAreaClick = (item, e) => {
    e.stopPropagation();
    if (isMultiSelect) {
      toggleAreaSelection(item);
    } else {
      onBodyAreaSelect(item.name, item.model);
    }
  };

  // 8. Check if area is selected
  const isAreaSelected = (areaName) => {
    return selectedAreas.some(
      (a) => a.name.toLowerCase() === areaName.toLowerCase()
    );
  };

  // 9. Handle continue with multi-select
  const handleContinueMulti = () => {
    if (selectedAreas.length > 0 && onMultiBodyAreaSelect) {
      onMultiBodyAreaSelect(selectedAreas);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden bg-slate-50 pt-18 md:pt-23">

      {/* Header & Search Bar */}
      <div className="flex flex-col items-center pt-6 px-6">
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

          {/* Multi-Select Toggle Button */}
          <button
            onClick={toggleMultiSelect}
            className={`
                ml-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide
                border-2 transition-all duration-200 flex items-center gap-1.5 shrink-0
                ${isMultiSelect
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 hover:bg-blue-700"
                : "bg-white text-slate-500 border-slate-300 hover:border-blue-400 hover:text-blue-500"
              }
              `}
            title={isMultiSelect ? "Disable multi-select" : "Enable multi-select"}
          >
            {/* Layers icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="hidden sm:inline">{isMultiSelect ? "Multi ON" : "Multi"}</span>
          </button>
        </div>

        {/* Selected areas chips (visible in multi-select mode) */}
        {isMultiSelect && selectedAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 justify-center max-w-2xl">
            {selectedAreas.map((area) => (
              <span
                key={area.name}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200"
              >
                {area.name}
                <button
                  onClick={() => toggleAreaSelection(area)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

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
                filteredAreas.map((item, index) => {
                  const selected = isMultiSelect && isAreaSelected(item.name);
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group p-1 relative overflow-hidden
                        ${selected
                          ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100 ring-2 ring-blue-400/40 scale-[1.02]"
                          : "border-slate-200 hover:shadow-md hover:scale-105 hover:border-blue-400 hover:bg-blue-50/30"
                        }
                      `}
                      onMouseEnter={() => preloadModel(item.model)}
                      onClick={(e) => handleAreaClick(item, e)}
                    >
                      {/* Selection indicator */}
                      {isMultiSelect ? (
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${selected
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white border-slate-300 group-hover:border-blue-400"
                          }`}
                        >
                          {selected && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                      )}

                      <span className={`font-bold text-xs md:text-sm text-center uppercase break-words px-1 tracking-tight leading-tight
                        ${selected ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"}
                      `}>
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
        </div>
      </div>

      {/* Floating Continue Button for Multi-Select */}
      {isMultiSelect && selectedAreas.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.2s_ease-in-out]">
          <button
            onClick={handleContinueMulti}
            className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-base shadow-2xl shadow-slate-400/40 hover:bg-black hover:scale-105 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            Continue
            <span className="bg-white/20 text-white text-sm px-2.5 py-0.5 rounded-full font-semibold">
              {selectedAreas.length} selected
            </span>
          </button>
        </div>
      )}
    </div>
  );
}