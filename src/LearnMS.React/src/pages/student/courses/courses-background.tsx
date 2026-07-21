import { motion } from "framer-motion";
import marinaLogo from "@/assets/images/marina-logo.png";
import { Globe, Landmark, Map } from "lucide-react";

const CoursesBackground = () => {
  return (
    <div className="relative flex h-full w-full min-w-[220px] max-w-[420px] items-end justify-center">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-color2/15 via-amber-400/10 to-teal-500/10" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 rounded-full border border-dashed border-color2/25"
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex h-full w-full items-end justify-center pb-2"
      >
        <img
          src={marinaLogo}
          alt=""
          className="max-h-full w-auto object-contain object-bottom drop-shadow-xl select-none"
          draggable={false}
        />
      </motion.div>
      <Globe className="absolute start-4 top-8 size-8 text-color2/40" />
      <Map className="absolute end-6 top-16 size-7 text-amber-500/50" />
      <Landmark className="absolute end-10 bottom-24 size-8 text-teal-600/40" />
    </div>
  );
};

export default CoursesBackground;
