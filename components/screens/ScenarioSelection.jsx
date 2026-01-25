import ModelViewer from "../ui/model-viewer";

export default function ScenarioSelection({ 
  scenarios, 
  selectedModelSrc, 
  onBack, 
  onScenarioSelect 
}) {
  return (
    <div className="flex flex-col lg:flex-row w-full h-screen relative overflow-hidden bg-slate-50">
      

      {/* 2. LEFT: 3D Model Preview (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[35%] h-full relative bg-slate-100/50 items-center justify-center overflow-hidden border-r border-slate-200">
        <div className="h-[55%] w-[55%] relative flex items-center justify-center">
          <div className="w-full h-full rounded-full border border-white/50 shadow-inner bg-white/40 backdrop-blur-sm relative overflow-hidden p-6">
             <ModelViewer
                src={selectedModelSrc}
                alt="3D Model Reference"
                cameraControls={true}
                disableZoom={true}
                className="w-full h-full"
              />
          </div>
        </div>
      </div>

      {/* 3. RIGHT: Scenario List */}
      <div className="w-full lg:w-[65%] h-full bg-white flex flex-col z-10 shadow-sm">
        
        {/* Header */}
        <div className="pt-24 px-6 md:px-10 pb-6 shrink-0 border-b border-slate-100 bg-white z-20">
          <div className="flex flex-row items mb-2">
            <button
            onClick={onBack}
            className="text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20 pr-2 md:hidden"
          >
            &lt;
          </button>
            <h2 className="font-extrabold text-3xl uppercase text-slate-900 leading-tight">
              SELECT SCENARIO
            </h2>
          </div>
          <p className="text-slate-500 text-sm">
            Choose a specific clinical variant to proceed with the assessment.
          </p>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-md z-10 shadow-sm">
              <tr>
                {/* ID HEADER: Reduced width (w-20) and padding (pl-4) on mobile */}
                <th className="py-4 pl-4 md:pl-10 pr-2 md:pr-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-20 md:w-32 border-b border-slate-100">
                  ID
                </th>
                {/* DESCRIPTION HEADER: Reduced left padding (pl-2) to maximize width */}
                <th className="py-4 pl-2 pr-4 md:pr-10 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scenarios.map((item, index) => (
                <tr
                  key={item.scenario_id || index}
                  onClick={() => onScenarioSelect(item)}
                  className="group cursor-pointer hover:bg-slate-50 transition-colors duration-150"
                >
                  {/* ID CELL */}
                  <td className="py-5 pl-4 md:pl-10 pr-2 md:pr-4 align-top">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors whitespace-nowrap">
                      {item.scenario_id}
                    </span>
                  </td>
                  {/* DESCRIPTION CELL */}
                  <td className="py-5 pl-2 pr-4 md:pr-10 align-top">
                    <p className="text-base text-slate-700 leading-relaxed group-hover:text-slate-900 font-medium transition-colors">
                      {item.scenario}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {scenarios.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p className="italic">No scenarios found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}