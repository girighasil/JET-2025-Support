import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function ImportantInstructions() {
  const [isExpanded, setIsExpanded] = useState(false);

  const instructions = [
    {
      english: "Before filling up the application form candidate must read and understand the instructions given in the JET Booklet-2025.",
      hindi: "आवेदन फार्म भरने से पूर्व अभ्यर्थी को जेट बुकलेट-2025 में दिए गए सभी निर्देशों को पढ़ एवं समझ लेने चाहिए।"
    },
    {
      english: "The mobile number and Email registered at the time of filling online application form must be operational till admission process is over. All information will be communicated on registered mobile number or Email. Lack of information due to change or block of registered mobile number or Email will be the responsibility of candidate himself/herself. Any Queries related to Application form will be entertained only, when it is received from the registered Email Id.",
      hindi: "फार्म भरते समय जिस मोबाइल नं.एवं ईमेल को पंजीकृत किया गया है वह प्रवेश प्रक्रिया पूर्ण होने तक चालू रखें। सभी सूचनाएं पंजीकृत मोबाइल नं.या ईमेल पर दी जायेंगी। पंजीकृत मोबाइल नं.एवं ईमेल परिवर्तन या बन्द होने से सूचना के अभाव की जिम्मेदारी अभ्यर्थी स्वयं की होगी। आवेदन फार्म से संबंधित किसी भी जानकारी हेतु पंजीकृत ईमेल से मेल प्राप्त होने पर ही विचार किया जा सकता है।"
    },
    {
      english: "Note down and keep your user ID (Reg. No.) and password safely, it can be used by any one for making change in your application form. If it happens candidate himself or herself will be responsible.",
      hindi: "अपना यूजर आईडी (पंजीकरण नंबर) व पासवर्ड लिख लेवें एवं सुरक्षित रखें क्योंकि इसका उपयोग किसी के द्वारा आपके आवेदन पत्र में संशोधन किया जा सकता है। इस प्रकार के संशोधन के लिए अभ्यर्थी स्वयं जिम्मेदार होगा।"
    },
    {
      english: "The applicant has to fill the information very carefully as candidature will be considered on the basis of information provided in the online application form. Supplementary information will not be accepted in any circumstances. Candidate will be responsible for any wrong information provided in the online application form. The candidature will be cancelled if provided information will be found false.",
      hindi: "आवेदक को जानकारी बहुत सावधानी से भरनी होगी क्योंकि ऑनलाइन आवेदन पत्र में दी गई जानकारी के आधार पर ही उम्मीदवारी पर विचार किया जाएगा। अनुपूरक सूचना किसी भी स्थिति में स्वीकार नहीं की जाएगी। ऑनलाइन आवेदन पत्र में दी गई किसी भी गलत जानकारी के लिए अभ्यर्थी जिम्मेदार रहेगा। दी गई जानकारी गलत पाए जाने पर उम्मीदवारी रद्द कर दी जाएगी।"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-[95%] lg:max-w-6xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <div className="flex items-center">
          <span className="text-lg sm:text-xl font-bold">
            IMPORTANT INSTRUCTIONS (JET 2025) (महत्वपूर्ण निर्देश- जेट 2025)
          </span>
        </div>
        <div>
          {isExpanded ? (
            <ChevronUp className="h-6 w-6 ml-2" />
          ) : (
            <ChevronDown className="h-6 w-6 ml-2" />
          )}
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm mb-8"
        >
          <div className="space-y-6">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-700 flex-shrink-0 mr-3 mt-1" />
                  <div>
                    <p className="text-gray-800 font-medium mb-2">
                      {instruction.english}
                    </p>
                    <p className="text-gray-700 font-normal">
                      {instruction.hindi}
                    </p>
                  </div>
                </div>
                {index < instructions.length - 1 && (
                  <div className="border-b border-amber-200 w-full my-3"></div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}