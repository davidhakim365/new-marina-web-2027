import { motion } from "framer-motion";
import marinaLogo from "@/assets/images/marina-logo.png";
import { ContourMap, CompassRose, PyramidMotif } from "@/components/ui/physics-graphics";

const CoursesBackground = () => {
  return (
    <div className="relative flex h-full w-full min-w-[220px] max-w-[420px] items-end justify-center">
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal/15 via-gold/10 to-color2/10">
        <ContourMap className="opacity-30" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 rounded-full border border-dashed border-color1/25"
      />
      <div className="pointer-events-none absolute start-3 top-6 opacity-40">
        <CompassRose className="size-16" />
      </div>
      <div className="pointer-events-none absolute end-4 top-14 opacity-35">
        <PyramidMotif className="size-20" />
      </div>
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
    </div>
  );
};

export default CoursesBackground;
