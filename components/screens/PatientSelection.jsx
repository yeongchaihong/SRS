import { HandWrittenTitle } from "../ui/hand-writing-text";
import { ECGLine } from "../ui/ecg-line";

export default function PatientSelection({ onPatientSelect, onBack }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white animate-[fadeIn_0.5s_ease-in-out]">
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      <div className="mb-16 h-32 w-full flex justify-center -mt-10">
        <HandWrittenTitle
          title="PATIENT TYPE"
          subtitle=""
        />
      </div>

      <div className="flex justify-center items-center gap-20">
        {/* Adult Selection */}
        <div
          className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-[400px] group"
          onClick={() => onPatientSelect('adult')}
        >
          <div className="bg-gray-100/80 rounded-full w-72 h-72 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all">
            <img src="/photo/adult.png" alt="Adult" className="h-64 object-contain" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider group-hover:text-blue-600 transition-colors">ADULT</p>
          <p className="text-gray-400 text-xl font-medium mt-[-1.5rem] group-hover:text-blue-400 transition-colors">(18+)</p>
        </div>

        {/* Child Selection */}
        <div
          className="flex flex-col items-center gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-[400px] group"
          onClick={() => onPatientSelect('child')}
        >
          <div className="bg-gray-100/80 rounded-full w-72 h-72 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all">
            <img src="/photo/child.png" alt="Child" className="h-56 object-contain mt-4" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider group-hover:text-blue-600 transition-colors">CHILDREN</p>
          <p className="text-gray-400 text-xl font-medium mt-[-1.5rem] group-hover:text-blue-400 transition-colors">(Under 18)</p>
        </div>
      </div>

      <div className="w-full -mt-10 mb-2 z-0 pointer-events-none">
        <ECGLine className="opacity-60" />
      </div>

      <p className="text-gray-500 text-2xl font-medium relative z-10 -mt-12">Please select patient age group.</p>
    </div>
  );
}