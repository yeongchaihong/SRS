import { useState } from "react";
import ModelViewer from "../ui/model-viewer";
import TypingSelection from "../ui/typing-selection";

export default function PanelAndCondition({
  selectedModelSrc,
  hasMoved,
  currentModelIndex = 0,
  totalModels = 0,
  currentModelLabel = null,
  panels,
  conditions,
  activeBodyArea,
  activeBodyAreas = [],
  selectedPanel,
  selectedCondition,
  onBack,
  onUserInteract,
  onPrevModel,
  onNextModel,
  onPanelSelect,
  onConditionSelect,
  onNext,
}) {
  // STATE LOCK: Tracks if mouse is over the UI
  const [isHoveringUI, setIsHoveringUI] = useState(false);

  // Display label for body area(s)
  const areaLabel = activeBodyAreas.length > 1
    ? activeBodyAreas.map(a => (typeof a === 'string' ? a : a.name)).join(", ")
    : activeBodyArea;

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen relative overflow-hidden bg-white md:pt-0">


      {/* --- LEFT COLUMN: 3D MODEL --- */}
      <div
        className={`flex-1 h-full relative bg-slate-100/50 flex items-center justify-center overflow-hidden z-0 transition-opacity duration-200 
        ${isHoveringUI ? "pointer-events-none opacity-90" : "pointer-events-auto"}`}
      >
        <div className="h-[65%] w-[65%] relative flex items-center justify-center">
          {selectedModelSrc ? (
            <ModelViewer
              src={selectedModelSrc}
              alt="3D Model"
              cameraControls={true}
              onUserInteract={onUserInteract}
              className="w-full h-full cursor-move"
            />
          ) : (
            <div className="text-slate-400 font-medium animate-pulse">
              Loading Model...
            </div>
          )}
        </div>

        {totalModels > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <button
                onClick={onPrevModel}
                className="w-10 h-10 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-slate-700"
                aria-label="Previous model"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <button
                onClick={onNextModel}
                className="w-10 h-10 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-slate-700"
                aria-label="Next model"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
              {currentModelIndex + 1} / {totalModels}
              {currentModelLabel ? ` • ${currentModelLabel}` : ""}
            </div>
          </>
        )}

        {!hasMoved && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-sm text-slate-400 font-medium">
            (Rotate model to inspect)
          </div>
        )}
      </div>

      {/* --- RIGHT COLUMN: INTERACTION PANEL --- */}
      <div
        className="w-full lg:w-[450px] shrink-0 h-full bg-white  border-slate-200 shadow-sm z-50 flex flex-col pt-8 md:pt-0"
        onMouseEnter={() => setIsHoveringUI(true)}
        onMouseLeave={() => setIsHoveringUI(false)}
      >

        {/* HEADER */}
        <div className="p-6 md:p-8 shrink-0 bg-white z-10 border-b border-slate-100 pt-16 lg:pt-8">
          {/* Added pt-16 on mobile to prevent Back Button from overlapping text */}
          <div className="flex flex-row items mb-1">
            <button
              onClick={onBack}
              className="text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20 pr-2 md:hidden"
            >
              &lt;
            </button>
            <h2 className={`font-extrabold uppercase text-slate-900 leading-tight ${activeBodyAreas.length > 1 ? 'text-xl' : 'text-3xl'}`}>
              {areaLabel}
            </h2>
          </div>
          <p className="text-slate-500 text-sm">
            Select the specific panel and condition observed.
          </p>
        </div>

        {/* SPLIT SCROLL AREA */}
        <div className="flex-1 min-h-0 flex flex-col">

          {/* TOP HALF: PANEL LIST */}
          <div className="flex-1 min-h-0 flex flex-col p-6 md:px-8 md:pt-6 md:pb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">
              Panel
            </label>
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm relative flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TypingSelection
                  key={`panel-${activeBodyArea}`}
                  listMaxHeight="h-auto"
                  className="w-full border-none shadow-none"
                  text="Select Panel..."
                  options={panels.map((p) => ({ label: p.panel }))}
                  showHeader={false}
                  onSelect={(opt) => {
                    const val = typeof opt === "string" ? opt : opt.label;
                    onPanelSelect(val);
                  }}
                />
              </div>
            </div>
          </div>

          {/* BOTTOM HALF: CONDITION LIST */}
          {selectedPanel && (
            <div className="flex-1 min-h-0 flex flex-col p-6 md:px-8 md:pt-2 md:pb-6 border-t border-slate-50 bg-slate-50/30">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">
                Condition
              </label>
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm relative flex flex-col bg-white">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <TypingSelection
                    key={`condition-${selectedPanel}`}
                    listMaxHeight="h-auto"
                    className="w-full border-none shadow-none"
                    text="Select Condition..."
                    options={conditions}
                    showHeader={false}
                    onSelect={(opt) => {
                      const val = typeof opt === "string" ? opt : opt.label;
                      onConditionSelect(val);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 md:p-8 pt-4 border-t border-slate-100 bg-white shrink-0 z-20">
          <button
            onClick={onNext}
            disabled={!selectedCondition}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
              ${selectedCondition
                ? "bg-slate-900 text-white hover:bg-black active:scale-[0.99] shadow-lg shadow-slate-200"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }
            `}
          >
            Next Step
          </button>
        </div>

      </div>
    </div>
  );
}