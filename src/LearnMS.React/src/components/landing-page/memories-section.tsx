import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
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
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import marinaGallery1 from "@/assets/images/marina-gallery-1.png";
import marinaGallery2 from "@/assets/images/marina-gallery-2.png";
import marinaGallery3 from "@/assets/images/marina-gallery-3.png";
import marinaAbout from "@/assets/images/marina-about.png";
import marinaHero from "@/assets/images/marina-hero.png";
import marinaLogo from "@/assets/images/marina-logo.png";

const memories = [
  { id: "1", src: marinaLogo, key: "1", bg: "from-teal/20 to-gold/15" },
  { id: "2", src: marinaHero, key: "2", bg: "from-gold/20 to-color2/10" },
  { id: "3", src: marinaAbout, key: "3", bg: "from-color1/15 to-teal/20" },
  { id: "4", src: marinaGallery1, key: "4", bg: "from-color2/15 to-gold/15" },
  { id: "5", src: marinaGallery2, key: "5", bg: "from-teal/25 to-color1/10" },
  { id: "6", src: marinaGallery3, key: "6", bg: "from-gold/20 to-teal/15" },
];

function MemoriesSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);

    const interval = setInterval(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, 4500);

    return () => {
      clearInterval(interval);
      api.off("select", onSelect);
    };
  }, [api]);

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
          className="relative mt-8"
        >
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent className="-ml-3 md:-ml-4">
              {memories.map(({ id, src, key, bg }, index) => (
                <CarouselItem
                  key={id}
                  className="pl-3 md:basis-4/5 md:pl-4 lg:basis-3/5"
                >
                  <div
                    className={cn(
                      "group relative overflow-hidden rounded-[1.5rem] border border-color1/15 shadow-lg shadow-color1/5 transition duration-500",
                      currentSlide === index
                        ? "ring-2 ring-color1/25"
                        : "opacity-90"
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex aspect-[4/5] items-end justify-center overflow-hidden bg-gradient-to-b sm:aspect-[16/11]",
                        bg
                      )}
                    >
                      <img
                        src={src}
                        alt={t(`memories.items.${key}.title`)}
                        className="relative z-10 h-[92%] w-auto max-w-full object-contain object-bottom transition duration-700 group-hover:scale-[1.03]"
                      />

                      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-heading/80 via-heading/35 to-transparent p-5 sm:p-7">
                        <h4 className="text-xl font-semibold text-white sm:text-2xl">
                          {t(`memories.items.${key}.title`)}
                        </h4>
                        <p className="mt-2 max-w-lg text-sm text-white/85">
                          {t(`memories.items.${key}.description`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-10 rounded-xl border-color1/20"
                onClick={() => api?.scrollPrev()}
                aria-label="Previous memory"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-10 rounded-xl border-color1/20"
                onClick={() => api?.scrollNext()}
                aria-label="Next memory"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 sm:max-w-xs">
              {memories.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to memory ${index + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    currentSlide === index
                      ? "w-8 bg-gradient-to-r from-color1 to-color2"
                      : "w-1.5 bg-color1/25 hover:bg-color1/45"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default MemoriesSection;
