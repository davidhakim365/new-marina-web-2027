import { motion, useReducedMotion } from "framer-motion";
import { Heading } from "@/components/ui/heading";
import { SubHeading } from "@/components/ui/sub-heading";
import {
  GlowOrb,
  PhysicsGrid,
  FloatingMotifs,
  PhysicsDivider,
  ContourMap,
  CompassRose,
} from "@/components/ui/physics-graphics";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";

const memories = [
  {
    id: "1",
    src: "https://i.ibb.co/8LYmmjdw/image.png",
    key: "1",
  },
  {
    id: "2",
    src: "https://i.ibb.co/Dg6gvF6Y/image.png ",
    key: "2",
  },
  {
    id: "3",
    src: "https://i.ibb.co/RpGH652t/image.png",
    key: "3",
  },
  {
    id: "4",
    src: "https://i.ibb.co/7JmjqzWq/image.png",
    key: "4",
  },
  {
    id: "5",
    src: "https://i.ibb.co/SXrCQJvB/image.png",
    key: "5",
  },
  {
    id: "6",
    src: "https://i.ibb.co/qYSFBZHP/image.png",
    key: "6",
  },
];

function MemoriesSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();

  return (
    <section className="relative w-full overflow-hidden bg-memoriesSection py-20 md:py-28">
      <PhysicsGrid className="opacity-40" />
      <ContourMap className="opacity-[0.08]" />
      <FloatingMotifs className="opacity-50" />
      <GlowOrb className="left-1/2 top-0 size-[28rem] -translate-x-1/2 from-teal/15 to-gold/10" />
      <div className="pointer-events-none absolute end-8 top-24 hidden opacity-40 lg:block">
        <CompassRose />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-color1">
            <Camera className="size-3.5" />
            {t("memories.badge")}
          </span>
          <Heading className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("memories.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("memories.description")}
          </SubHeading>
        </motion.div>

        <PhysicsDivider />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.6 }}
          className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4"
        >
          {memories.map(({ id, src, key }, index) => (
            <motion.figure
              key={id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * index, duration: 0.45 }}
              className="group relative aspect-[4/5] max-w-none overflow-hidden rounded-2xl border border-color1/15 bg-color1/5 shadow-lg shadow-color1/5"
            >
              <img
                src={src}
                alt={t(`memories.items.${key}.title`)}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 size-full max-w-none object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-heading/85 via-heading/40 to-transparent p-4 sm:p-5">
                <h4 className="text-base font-semibold text-white sm:text-lg">
                  {t(`memories.items.${key}.title`)}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs text-white/85 sm:text-sm">
                  {t(`memories.items.${key}.description`)}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default MemoriesSection;
