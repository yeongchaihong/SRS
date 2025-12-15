import { useRouter } from 'next/router';
import { motion } from "framer-motion";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { StartChatButton } from "@/components/ui/startchat-button";

export default function WelcomePage() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/patient-select');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="bg-[#fafafa] h-screen w-full flex items-center justify-between px-20 overflow-hidden"
    >
      <div className="flex flex-col items-start gap-6 z-10 max-w-4xl">
         {/* ... Your GooeyText components here ... */}
        <div className="flex flex-col items-center w-full gap-8">
          <p className="font-semibold text-4xl tracking-wide text-black text-center leading-tight">
            How's your patient today?
          </p>
          <StartChatButton onClick={handleStart} />
        </div>
      </div>
      <div className="flex-1 h-full flex items-center justify-center relative">
        <img src="/photo/transparenbody.png" alt="Medical Illustration" className="object-contain max-h-[90vh] w-auto" />
      </div>
    </motion.div>
  );
}