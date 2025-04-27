import { WHY_CHOOSE_US } from "@/lib/constants";
import { motion } from "framer-motion";
import { SquareUser, CircleUserRound, PenSquare } from "lucide-react";

export default function WhyChooseUs() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'chalkboard-user':
        return <SquareUser className="h-6 w-6" />;
      case 'circle-question':
        return <CircleUserRound className="h-6 w-6" />;
      case 'pen-to-square':
        return <PenSquare className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-primary';
      case 'amber':
        return 'bg-amber-100 text-[#D97706]';
      case 'green':
        return 'bg-green-100 text-[#10B981]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section className="py-12 bg-amber-50 border-b border-amber-500">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-bold text-3xl text-gray-800 mb-3">What will you get here?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We combine innovative teaching methods with personalized attention to help you excel in competitive exams.
          </p>
        </motion.div>
        
        <div className="bg-amber-100 grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY_CHOOSE_US.map((item, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-lg shadow-md p-6 transition-transform duration-300 hover:transform hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className={`w-16 h-16 rounded-full ${getColorClass(item.color)} flex items-center justify-center mb-4 mx-auto`}>
                {getIcon(item.icon)}
              </div>
              <h3 className="font-semibold text-xl text-center mb-3">{item.title}</h3>
              <p className="text-gray-600 text-center">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
