import { HandWrittenTitle } from "../ui/hand-writing-text";
import { ECGLine } from "../ui/ecg-line";

export default function PatientSelection({ onPatientSelect, onBack }) {
  return (
    <div className="flex flex-col items-center bg-white h-screen pt-8 md:pt-13">

      <div className="flex flex-col justify-center pb-18">
        {/* <HandWrittenTitle
          title="PATIENT TYPE"
          subtitle="Please select patient age group."
        /> */}
        <div className="flex items-center md:gap-4 flex-row pt-15">
          <button
            onClick={onBack}
            className="text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20 pr-2 md:hidden"
          >
            &lt;
          </button>
          <h1 className="font-extrabold text-4xl">PATIENT TYPE</h1>
        </div>
        <div className="flex items-center  md:gap-4 flex-col">
          <p>Please select patient age group.</p>
        </div>
      </div>

      <div className="flex items-center flex-col md:gap-20 md:flex-row md:mt-0">
        {/* Adult Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-100 group"
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
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-100 group pt-6 md:pt-0"
          onClick={() => onPatientSelect('child')}
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