import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { SubHeading } from "@/components/ui/sub-heading";
import {
  PhysicsGrid,
  GlowOrb,
  FloatingFormulas,
  AtomOrbit,
  PhysicsDivider,
} from "@/components/ui/physics-graphics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import marinaLogo from "@/assets/images/marina-logo.png";
import marinaHero from "@/assets/images/marina-hero.png";
import marinaAbout from "@/assets/images/marina-about.png";
import marinaGallery1 from "@/assets/images/marina-gallery-1.png";
import marinaGallery2 from "@/assets/images/marina-gallery-2.png";
import marinaGallery3 from "@/assets/images/marina-gallery-3.png";

const photoPool = [
  marinaLogo,
  marinaHero,
  marinaAbout,
  marinaGallery1,
  marinaGallery2,
  marinaGallery3,
  marinaLogo,
  marinaHero,
];

const seniors = [
  {
    year: "Moments",
    images: photoPool.map((src, i) => ({ id: `m-${i}`, src })),
  },
  {
    year: "Journey",
    images: [...photoPool].reverse().map((src, i) => ({ id: `j-${i}`, src })),
  },
  {
    year: "Classroom",
    images: photoPool.map((src, i) => ({ id: `c-${i}`, src })),
  },
];

const studyMarks = ["🌍", "🗺", "🧭", "📜", "🏛", "⌛"];

function SeniorsSection() {
  const [activeYear, setActiveYear] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const batch = seniors[activeYear];
  const images = batch.images;
  const current = images[activeImage] ?? images[0];

  const classTitle = t(`seniors.classes.${activeYear + 1}.title`);
  const classDescription = t(`seniors.classes.${activeYear + 1}.description`);

  const goPrev = () =>
    setActiveImage((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImage((i) => (i + 1) % images.length);

  const yearTabs = useMemo(
    () =>
      seniors.map((s, index) => ({
        key: s.year,
        index,
        label: t(`seniors.classes.${index + 1}.title`),
      })),
    [t]
  );

  return (
    <section className="relative w-full overflow-hidden bg-seniorsSection py-20 md:py-28">
      <PhysicsGrid className="opacity-40" />
      <FloatingFormulas className="opacity-50" />
      <GlowOrb className="-left-24 top-10 size-80 from-color2/20 to-color1/10" />
      <GlowOrb className="-right-20 bottom-0 size-72 from-color1/15 to-color2/10" />

      <div className="pointer-events-none absolute right-4 top-16 hidden opacity-40 lg:block xl:right-12">
        <AtomOrbit className="text-color2" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-color2">
            <GraduationCap className="size-3.5" />
            {t("seniors.badge")}
          </span>
          <Heading className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("seniors.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("seniors.description")}
          </SubHeading>
        </motion.div>

        <PhysicsDivider />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="mt-8 flex justify-center"
        >
          <div
            role="tablist"
            className="inline-flex flex-wrap items-center justify-center gap-1 border-b border-color2/15"
          >
            {yearTabs.map((tab) => {
              const active = activeYear === tab.index;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveYear(tab.index);
                    setActiveImage(0);
                  }}
                  className={cn(
                    "relative px-4 py-3 text-sm font-medium transition-colors sm:px-6",
                    active
                      ? "text-heading"
                      : "text-muted-foreground hover:text-heading"
                  )}
                >
                  {tab.label}
                  {active && (
                    <motion.span
                      layoutId={reduceMotion ? undefined : "seniors-year-underline"}
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-color1 to-color2"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            key={`${activeYear}-${current.id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] border border-color2/15 bg-neutral-950 shadow-xl shadow-color2/10">
              <div className="relative aspect-[16/11] overflow-hidden">
                <img
                  src={current.src}
                  alt={classTitle}
                  className="size-full object-contain object-bottom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                <span
                  aria-hidden
                  className="absolute left-4 top-4 text-3xl text-white/40 md:text-5xl"
                >
                  {studyMarks[activeImage % studyMarks.length]}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                  <div className="min-w-0 text-start">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      {classTitle}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-white/90 sm:text-base">
                      {classDescription}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-10 rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur hover:bg-white/25"
                      onClick={goPrev}
                      aria-label="Previous photo"
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-10 rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur hover:bg-white/25"
                      onClick={goNext}
                      aria-label="Next photo"
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute -left-3 -top-3 size-16 rounded-tl-2xl border-l-2 border-t-2 border-color2/40"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-3 size-16 rounded-br-2xl border-b-2 border-r-2 border-color1/40"
            />
          </motion.div>

          <div className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeYear}
                initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.35 }}
                className="space-y-3 text-center lg:text-start"
              >
                <h3 className="text-2xl font-bold tracking-tight text-heading md:text-3xl">
                  {classTitle}
                </h3>
                <p className="text-sm leading-relaxed text-paragraph md:text-base">
                  {classDescription}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {images.slice(0, 8).map((img, index) => {
                const selected = index === activeImage;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border bg-neutral-950 transition",
                      selected
                        ? "border-color2 ring-2 ring-color2/30"
                        : "border-color2/10 opacity-80 hover:opacity-100"
                    )}
                  >
                    <img
                      src={img.src}
                      alt=""
                      className="size-full object-contain object-bottom transition duration-300 group-hover:scale-105"
                    />
                    {selected && (
                      <span className="absolute inset-0 bg-color2/10" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground lg:text-start">
              {activeImage + 1} / {images.length}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SeniorsSection;
