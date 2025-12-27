import { HandWrittenTitle } from "../ui/hand-writing-text";
import { ECGLine } from "../ui/ecg-line";

export default function PatientSelection({ onPatientSelect, onBack }) {
  return (
    <div className="flex flex-col items-center bg-white animate-[fadeIn_0.5s_ease-in-out] h-screen">
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      <div className="flex justify-center md:mt-15 md:mb-20 md:h-32 md:w-full w-4/5 mt-7 mb-10 h-40">
        <HandWrittenTitle
          title="PATIENT TYPE"
          subtitle="Please select patient age group."
        />
      </div>

      <div className="flex items-center md:gap-20 flex-col md:flex-row -mt-5 md:mt-0">
        {/* Adult Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-[400px] group"
          onClick={() => onPatientSelect('adult')}
        >
          <div className="bg-gray-100/80 rounded-full md:w-72 md:h-72 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all">
            <img src="/photo/adult.png" alt="Adult" className="md:h-64 object-contain h-45" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider group-hover:text-blue-600 transition-colors">ADULT</p>
          <p className="text-gray-400 text-xl font-medium group-hover:text-blue-400 transition-colors">(18+)</p>
        </div>

        {/* Child Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-[400px] group pt-6 md:pt-0"
          onClick={() => onPatientSelect('adult')}
        >
          <div className="bg-gray-100/80 rounded-full md:w-72 md:h-72 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all">
            <img src="/photo/child.png" alt="Adult" className="md:h-64 object-contain h-45" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider group-hover:text-blue-600 transition-colors">PEDIATRIC</p>
          <p className="text-gray-400 text-xl font-medium group-hover:text-blue-400 transition-colors">(Under 18)</p>
        </div>
      </div>

      <div className="w-screen -mt-5 mb-2 z-0 pointer-events-none">
        <ECGLine className="opacity-60" />
      </div>
    </div>
  );
}