import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useChatbot } from './Context/ChatbotContext';
import ModelViewer from "@/components/ui/model-viewer";
import { motion } from "framer-motion";

export default function ScenariosPage() {
  const router = useRouter();
  const { 
    // State Selection Criteria
    selectedPatient,    // 'adult' or 'child'
    activeBodyArea,     // e.g. 'breast'
    selectedPanel,      // e.g. 'Breast'
    selectedCondition,  // e.g. 'Axillary adenopathy'
    selectedModelSrc,

    // Data Source & Helper
    masterData,
    isAgeApplicable,

    // Actions
    setSelectedScenarios, 
    setResults, 
    setAllFetchedResults
  } = useChatbot();

  // --- FILTERING LOGIC ---
  // We filter the masterData live on this page to find matching scenarios
  const filteredScenarios = useMemo(() => {
    if (!masterData || masterData.length === 0) return [];

    return masterData.filter(item => {
      // 1. Body Area Match (Case insensitive + robust key check)
      const dbArea = (item["Body Area"] || item.body_area)?.toLowerCase();
      const currentArea = activeBodyArea?.toLowerCase();
      if (dbArea !== currentArea) return false;

      // 2. Age Check (Using context helper)
      // Checks if 'adult'/'child' fits into the DB string "18 - 150"
      if (!isAgeApplicable(item.Age || item.age)) return false;

      // 3. Panel Match
      if (item.panel !== selectedPanel) return false;

      // 4. Condition Match
      if (item.condition !== selectedCondition) return false;

      return true;
    });
  }, [masterData, activeBodyArea, selectedPatient, selectedPanel, selectedCondition, isAgeApplicable]);

  // --- SELECTION HANDLER ---
  const handleSelect = (scenario) => {
    setSelectedScenarios(scenario);

    // 1. EXTRACT DATA DIRECTLY
    // The scenario object from masterData contains the 'procedures' array
    const rawProcedures = scenario.procedures || [];

    // 2. PROCESS PROCEDURES
    const processed = rawProcedures.map(proc => {
      const lowerCat = proc.appropriateness_category?.toLowerCase() || '';
      
      // Determine Appropriateness Level
      let appLevel = 'rarely'; // Default
      if (lowerCat.includes('usually appropriate')) {
        appLevel = 'usually';
      } else if (lowerCat.includes('may be appropriate')) {
        appLevel = 'maybe';
      }

      // Determine Radiation String based on Patient Type
      // Keys: "adult_rrl" (e.g. "0.1-1mSv☢☢") vs "peds_rrl"
      let radStr = selectedPatient === 'child' ? proc.peds_rrl : proc.adult_rrl;
      
      // Fallback if empty
      if (!radStr || radStr.trim() === '') radStr = "N/A";

      // Calculate Visual Score (0-10) based on radiation symbols "☢"
      // Example: "☢☢" -> Score 4, "O" -> Score 0
      let score = 0;
      if (radStr.includes('☢')) {
        const count = (radStr.match(/☢/g) || []).length;
        score = Math.min(count * 3, 10); // Cap at 10
      } else if (radStr.includes('O')) {
         score = 0;
      } else if (radStr !== "N/A") {
         score = 1; // Minimum score if not N/A but no symbols
      }

      return {
        name: proc.procedure_name,
        appropriate: appLevel,
        radiationString: radStr,
        score: score,
        original: proc
      };
    });

    // 3. SEGMENT RESULTS
    const usually = processed.filter(p => p.appropriate === 'usually');
    const maybe = processed.filter(p => p.appropriate === 'maybe');
    const rarely = processed.filter(p => p.appropriate === 'rarely');

    // 4. SAVE TO CONTEXT
    setResults([...usually, ...maybe]); // Default display list
    setAllFetchedResults({ usually, maybe, rarely }); // Store all for toggle visibility

    // 5. NAVIGATE
    router.push('/results');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="h-screen w-full flex p-8 bg-white overflow-hidden"
    >
      <button onClick={() => router.back()} className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform bg-white/50 rounded-full px-3 py-1">
        &lt; Back
      </button>
      
      <div className="flex flex-col items-center w-full h-full mt-12">
        <h2 className="text-4xl font-bold text-black mb-8">Choose your scenario</h2>
        
        <div className="flex w-full gap-8 h-full">
           {/* 3D Model Small View */}
           <div className="w-1/3 flex justify-center">
             <div className="w-64 h-64 rounded-full bg-gray-200 overflow-hidden relative border-4 border-white shadow-lg">
               <ModelViewer src={selectedModelSrc} cameraControls={true} disableZoom={true} />
             </div>
           </div>

           {/* Table List of Scenarios */}
           <div className="w-2/3 overflow-y-auto custom-scrollbar pr-2">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="border-b-2 border-gray-200">
                   <th className="text-left p-4 text-gray-500 font-medium">Scenario Description</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredScenarios.length > 0 ? (
                   filteredScenarios.map((s, i) => (
                     <tr 
                       key={s._id?.$oid || s._id || i} 
                       onClick={() => handleSelect(s)} 
                       className="cursor-pointer hover:bg-blue-50 border-b border-gray-100 transition-colors"
                     >
                       <td className="p-4 text-black text-lg font-medium">{s.scenario_description}</td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td className="p-8 text-center text-gray-400 italic">
                       No scenarios found matching "{selectedCondition}".
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </motion.div>
  );
}