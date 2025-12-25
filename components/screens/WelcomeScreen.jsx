import { motion } from "framer-motion";
import { GooeyText } from "../ui/gooey-text-morphing";
import { StartChatButton } from "../ui/startchat-button";

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="bg-[#fafafa] h-screen w-full flex items-center justify-between px-20">
      <div className="flex flex-col items-start gap-6 z-10 max-w-4xl">
        <div className="flex flex-col items-start w-full -space-y-6 mb-2">
          <motion.div
            animate={{
              scale: [1, 1.1, 1.1, 1.1, 1, 1],
              opacity: [0.8, 1, 1, 1, 0.8, 0.8]
            }}
            transition={{
              duration: 9,
              times: [0, 0.11, 0.22, 0.78, 0.89, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="origin-left"
          >
            <GooeyText
              texts={["WELCOME", "WELCOME", "WELCOME"]}
              morphTime={3}
              cooldownTime={1}
              blurAmount={10}
              alignment="left"
              className="font-bold h-36 w-full"
              textClassName="text-7xl md:text-8xl text-black tracking-tighter"
            />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1, 1.1, 1.1, 1.1, 1],
              opacity: [0.8, 0.8, 1, 1, 1, 0.8]
            }}
            transition={{
              duration: 9,
              times: [0, 0.11, 0.22, 0.78, 0.89, 1],
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="origin-left"
          >
            <GooeyText
              texts={["CLINICIAN", "CLINICIAN", "CLINICIAN"]}
              morphTime={3}
              cooldownTime={1}
              blurAmount={10}
              alignment="left"
              className="font-bold h-36 w-full"
              textClassName="text-7xl md:text-8xl text-black tracking-tighter"
            />
          </motion.div>
        </div>
        <div className="flex flex-col items-center w-full gap-8">
          <p className="font-semibold text-4xl tracking-wide text-black text-center leading-tight">
            How's your patient today?
          </p>
          <StartChatButton onClick={onStart} />
        </div>
      </div>
      <div className="flex-1 h-full flex items-center justify-center relative">
        <img
          src="/photo/transparenbody.png"
          alt="Medical Illustration"
          className="object-contain max-h-[90vh] w-auto"
        />
      </div>
    </div>
  );
}
