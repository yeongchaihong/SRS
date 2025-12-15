import { useRouter } from 'next/router';
import { useChatbot } from './Context/ChatbotContext';
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { ECGLine } from "@/components/ui/ecg-line";
import { motion } from "framer-motion";

export default function PatientSelectPage() {
  const router = useRouter();
  const { setSelectedPatient } = useChatbot();

  const handleSelect = (type) => {
    setSelectedPatient(type);
    router.push('/body-select');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="h-screen w-full flex flex-col items-center justify-center bg-white overflow-hidden relative"
    >
      <div className="mb-16 h-32 w-full flex justify-center -mt-10">
        <HandWrittenTitle title="PATIENT TYPE" subtitle="" />
      </div>

      <div className="flex justify-center items-center gap-20">
        <div className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-all w-[400px]" onClick={() => handleSelect('adult')}>
          <div className="bg-gray-100/80 rounded-full w-72 h-72 flex items-center justify-center mb-2 shadow-lg">
            <img src="/photo/adult.png" alt="Adult" className="h-64 object-contain" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider">ADULT</p>
        </div>

        <div className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-all w-[400px]" onClick={() => handleSelect('child')}>
          <div className="bg-gray-100/80 rounded-full w-72 h-72 flex items-center justify-center mb-2 shadow-lg">
            <img src="/photo/child.png" alt="Child" className="h-56 object-contain mt-4" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider">CHILDREN</p>
        </div>
      </div>
      
      <div className="w-full -mt-10 mb-2 z-0 pointer-events-none">
        <ECGLine className="opacity-60" />
      </div>
    </motion.div>
  );
}