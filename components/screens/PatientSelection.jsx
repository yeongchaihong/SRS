import { HandWrittenTitle } from "../ui/hand-writing-text";

export default function PatientSelection({ onPatientSelect, onBack }) {
  return (
    <div 
      className="flex flex-col items-center w-full h-screen pt-8 md:pt-13 relative"
      style={{
        background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #4180de 100%)",
      }}
    >

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
        <div className="flex items-center  md:gap101220-4 flex-col">
          <p>Please select patient age group.</p>
        </div>
      </div>

      <div className="flex items-center flex-col md:gap-20 md:flex-row md:mt-0">
        {/* Adult Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-100 group"
          onClick={() => onPatientSelect('adult')}
        >
          <div className="bg-gray-100/80 rounded-full md:w-60 md:h-60 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all" style={{marginTop: '-10px'}}>
            <img src="/photo/adult.png" alt="Adult" className="md:h-56 object-contain h-40" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider group-hover:text-blue-800 transition-colors">ADULT</p>
          <p className="text-gray-400 text-xl font-medium group-hover:text-blue-800 transition-colors md:-mt-[30px]">(18 and above)</p>
        </div>

        {/* Child Selection */}
        <div
          className="flex flex-col items-center md:gap-8 cursor-pointer hover:scale-105 transition-all duration-300 w-100 group pt-6 md:pt-0"
          onClick={() => onPatientSelect('child')}
        >
          <div className="bg-gray-100/80 rounded-full md:w-60 md:h-60 flex items-center justify-center mb-2 shadow-lg group-hover:shadow-xl group-hover:bg-blue-50/50 transition-all" style={{marginTop: '-10px'}}>
            <img src="/photo/child.png" alt="Adult" className="md:h-56 object-contain h-40" />
          </div>
          <p className="text-black text-4xl font-bold tracking-wider group-hover:text-blue-800 transition-colors">PEDIATRIC</p>
          <p className="text-gray-400 text-xl font-medium group-hover:text-blue-800 transition-colors md:-mt-[30px]">(Under 18)</p>
        </div>
      </div>
    </div>
  );
}