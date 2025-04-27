import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, HelpCircle, X } from 'lucide-react';

export default function HelpDeskInstructions() {
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Help Desk Button - Fixed on the left side */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 text-white py-3 px-2 rounded-r-lg shadow-lg hover:bg-amber-700 transition-all duration-200 flex flex-col items-center justify-center space-y-2"
          aria-label="Open Help Desk"
        >          
          <div className="font-bold text-xs writing-vertical-lr rotate-180">JET Important</div>
        </button>
      </div>

      {/* Help Desk Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-start">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-full max-w-xl bg-amber-50 shadow-xl overflow-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-green-700 text-white py-4 px-6 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Important Instructions
                </h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-green-600 transition-colors"
                  aria-label="Close instructions"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-center text-green-800 mb-2">
                    IMPORTANT INSTRUCTIONS (JET 2025)
                  </h1>
                  <h2 className="text-xl font-bold text-center text-green-700">
                    महत्वपूर्ण निर्देश- जेट 2025
                  </h2>
                </div>

                <div className="space-y-8">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex space-x-4">
                      <CheckCircle2 className="h-6 w-6 text-green-700 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-gray-800 font-medium mb-3">
                          {instruction.english}
                        </p>
                        <p className="text-gray-700 font-normal">
                          {instruction.hindi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}