import ModelViewer from "../ui/model-viewer";

export default function ScenarioSelection({ scenarios, selectedModelSrc, onBack, onScenarioSelect }) {
  return (
    <div className="absolute inset-0 flex flex-col p-8 animate-[fadeIn_0.5s_ease-in-out]">
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      <div className="flex flex-col items-center w-full h-full mt-4">
        <h2 className="text-4xl font-bold text-black mb-8">Choose your scenario</h2>

        <div className="flex w-full gap-8 h-full">
          <div className="w-1/3 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full bg-gray-200/50 border-2 border-white/50 flex items-center justify-center overflow-hidden relative">
              <ModelViewer
                src={selectedModelSrc}
                alt="3D Cardiac Model"
                cameraControls={true}
                disableZoom={true}
              />
            </div>
          </div>

          <div className="w-2/3 overflow-y-auto pr-4 custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black/10">
                  <th className="text-left p-4 text-xl font-semibold text-black/70 w-24">no.</th>
                  <th className="text-left p-4 text-xl font-semibold text-black/70">scenario</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <tr
                    key={scenario._id || index}
                    className="border-b border-black/5 hover:bg-white/40 transition-colors cursor-pointer"
                    onClick={() => onScenarioSelect(scenario)}
                  >
                    <td className="p-4 text-lg font-medium text-black/80">{scenario.scenario_id}</td>
                    <td className="p-4 text-lg text-black/80">{scenario.scenario_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
