import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useChatbot } from './Context/ChatbotContext';
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { motion } from "framer-motion";

// Move the bodyParts array here or to a constant file
const MODEL_ASSETS = {
  'Abdomen': '/3d-model/abdomen_anatomy.glb',
  'Abdomen-Pelvis': '/3d-model/abdomen_pelvis_anatomy.glb',
  'Breast': '/3d-model/human_female_breast_anatomy.glb',
  'Cardiac': '/3d-model/stylizedhumanheart.glb',
  'Cardiac-Chest': '/3d-model/cardiac_chest_anatomy.glb',
  'Cardiac-Chest-Pelvis': '/3d-model/cardiac_chest_pelvis_anatomy.glb',
  'Chest': '/3d-model/chest.glb',
  'Chest-Abdomen': '/3d-model/chest_abdomen_anatomy.glb',
  'Chest-Abdomen-Pelvis': '/3d-model/chest_abdomen_pelvis_anatomy.glb',
  'Extremities': '/3d-model/arms_hands_head_legs_and_feet__low_poly_female.glb',
  'Head': '/3d-model/head_study.glb',
  'Head-Neck': '/3d-model/head_neck_anatomy.glb',
  'Head-Neck-Chest-Abdomen': '/3d-model/head_neck_chest_abdomen_anatomy.glb',
  'Head-Spine': '/3d-model/head_spine_anatomy.glb',
  'Lower Extremity': '/3d-model/lower_extremity_anatomy.glb',
  'Maxface': '/3d-model/maxface_anatomy.glb',
  'Neck': '/3d-model/neck.glb',
  'Neck-Chest': '/3d-model/neck_chest_anatomy.glb',
  'Neck-Chest-Abdomen-Pelvis': '/3d-model/neck_chest_abdomen_pelvis_anatomy.glb',
  'Pelvis': '/3d-model/VH_F_Pelvis.glb',
  'Spine': '/3d-model/the_human_spinal_column.glb',
  'Spine-Pelvis': '/3d-model/spine_pelvis_anatomy.glb',
  'Unspecified': null,
  'Upper Extremity': '/3d-model/upper_extremity_anatomy.glb'
};


export default function BodySelectPage() {
  const router = useRouter();
  const { 
    selectedPatient, 
    setActiveBodyArea, 
    // setSelectedModelSrc,
    // selectedModelSrc,
    masterData,      // The full dataset (4000+ items)
    isAgeApplicable  // The helper function we made earlier
  } = useChatbot();

  // --- FILTERING LOGIC ---
  const bodyParts = useMemo(() => {
    if (!masterData || masterData.length === 0) return [];
    // 1. Get all unique "Body Area" names that match the selected Age
    const uniqueAreas = new Set();
    
    masterData.forEach(item => {
      // Only include this Body Area if the age range matches the patient type
      if (item["body_area"] && isAgeApplicable(item.age)) {
        uniqueAreas.add(item["body_area"]);
      }
    });


    // 2. Format them for the UI
    return Array.from(uniqueAreas)
      .sort() // Alphabetical order
      .map(name => {
        const key = name.toLowerCase();
        return {
          name: name,                      // Display Name
          action: key,                     // Logic ID
          model: MODEL_ASSETS[key] || null // Attach model if exists
        };
      });

  }, [masterData, selectedPatient, isAgeApplicable]);


  // --- HANDLERS ---
  const handleSelect = (item) => {
    setActiveBodyArea(item.action);
    // setSelectedModelSrc(item.model || null);
    // console.log("Selected Model Src:", item.model);
    router.push('/diagnosis'); 
  };

  const handleBack = () => {
    router.push('/patient-select');
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-screen w-full flex flex-col items-center bg-white overflow-hidden"
    >
      <div className="w-full flex justify-center mt-4 mb-4 h-40 shrink-0">
        <HandWrittenTitle title="CHOOSE BODY AREA" subtitle="" className="py-16" />
      </div>

      <div className="flex flex-1 w-full max-w-[1400px] mx-auto px-12 gap-16 items-center justify-center pb-8">
        
        {/* Left Side: Body Image */}
        <div className="w-[50%] h-full flex items-center justify-center relative -mt-10">
           <button 
             onClick={handleBack} 
             className="absolute top-8 left-8 z-50 text-black text-3xl font-bold bg-white/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-sm"
           >
             &lt;
           </button>
           
           <img 
             src={selectedPatient === 'adult' ? "/photo/humanbody.png" : "/photo/humanbodychild.png"} 
             className="h-[120%] object-contain scale-[1.35] relative z-0" 
             alt="body reference"
           />
        </div>

        {/* Right Side: Grid */}
        <div className="w-[50%] h-full flex items-center justify-center pl-4">
          <div className="grid grid-cols-6 gap-3 w-full max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            {bodyParts.length > 0 ? (
              bodyParts.map((item, index) => (
                <div key={index} 
                  className="aspect-square bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:scale-105 transition-all p-1"
                  onClick={() => handleSelect(item)}
                >
                  <span className="font-bold text-sm text-slate-700 text-center uppercase break-words w-full leading-tight text-[14px]">
                    {item.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-6 flex flex-col items-center justify-center text-gray-400 gap-2 mt-10">
                <span className="italic">Loading database...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}