import { useState } from "react";
import ModelViewer from "../ui/model-viewer";
import TypingSelection from "../ui/typing-selection";

export default function PanelAndCondition({
  selectedModelSrc,
  hasMoved,
  panels,
  conditions,
  activeBodyArea,
  selectedPanel,
  selectedCondition,
  onBack,
  onUserInteract,
  onPanelSelect,
  onConditionSelect,
  onNext,
}) {
  // STATE LOCK: Tracks if mouse is over the UI
  const [isHoveringUI, setIsHoveringUI] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen relative overflow-hidden bg-slate-50">
      
      {/* --- 1. BACK BUTTON (Moved to Root) --- */}
      {/* Placed here so it sits at the top-left on BOTH Mobile and Desktop, independent of columns */}
      <div className="absolute top-0 -left-2 w-full pt-6 px-6 md:px-12 z-60 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 bg-slate-50/50 backdrop-blur-sm px-2 rounded-lg"
        >
          &lt; Back
        </button>
      </div>

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
        
        {!hasMoved && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-sm text-slate-400 font-medium">
            (Rotate model to inspect)
          </div>
        )}
      </div>

      {/* --- RIGHT COLUMN: INTERACTION PANEL --- */}
      <div 
        className="w-full lg:w-[450px] shrink-0 h-full bg-white border-l border-slate-200 shadow-sm z-50 flex flex-col"
        onMouseEnter={() => setIsHoveringUI(true)}
        onMouseLeave={() => setIsHoveringUI(false)}
      >
        
        {/* HEADER */}
        <div className="p-6 md:p-8 shrink-0 bg-white z-10 border-b border-slate-100 pt-16 lg:pt-8"> 
        {/* Added pt-16 on mobile to prevent Back Button from overlapping text */}
          <h2 className="font-extrabold text-3xl mb-1 uppercase text-slate-900 leading-tight">
            {activeBodyArea}
          </h2>
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
              ${
                selectedCondition
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