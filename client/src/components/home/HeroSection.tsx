import { Link } from "wouter";
import { useSiteConfig } from "@/hooks/use-site-config";
export default function HeroSection() {
  const { config } = useSiteConfig();

  const examInfo = config?.examInfo || {
    name: "JET",
    fullName: "Joint Entrance Test",
    year: "2025",
    applicationStartDate: "February 20, 2025",
    applicationEndDate: "March 30, 2025",
    examDate: "May 14, 2025",
    universityName:
      "Swami Keshwanand Rajasthan Agricultural University, Bikaner",
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero header with university name */}
      <div className="bg-emerald-700 text-white py-2 w-full">
        <div className="responsive-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">             
              <div className="min-w-0">
                {" "}
                {/* Prevent text overflow */}
                <h1 className="text-sm md:text-base font-semibold truncate">
                  {examInfo.name || "JET"}
                  {examInfo.fullName || "Joint Entrance Test"}{examInfo.year || "2025"}
                </h1>
                <p className="text-xs md:text-sm truncate">
                  {examInfo.universityName ||
                    "Swami Keshwanand Rajasthan Agricultural University, Bikaner"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
}
<div className="relative w-full overflow-hidden">
  {/* Hero header with university name */}
  <div className="bg-emerald-700 text-white py-2 w-full">
    <div className="responsive-container">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">             
          <div className="min-w-0">
            {" "}
            {/* Prevent text overflow */}
            <h1 className="text-sm md:text-base font-semibold truncate">
              {/* Site title */}
              "Joint Entrance Test"
            </h1>
            {/* tagline */}
            <p className="text-xs md:text-sm truncate">
              {
                "Swami Keshwanand Rajasthan Agricultural University, Bikaner"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>  
</div>