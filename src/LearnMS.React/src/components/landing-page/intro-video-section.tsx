import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { SubHeading } from "@/components/ui/sub-heading";
import {
  PhysicsGrid,
  GlowOrb,
  PhysicsDivider,
  ContourMap,
  CompassRose,
  PyramidMotif,
  FloatingMotifs,
} from "@/components/ui/physics-graphics";
import { getYoutubeEmbedUrl, getYoutubeVideoId } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/** Platform intro — replace only if Mrs Marina shares a new video. */
export const INTRO_YOUTUBE_URL = "https://youtu.be/tF1QFt5LT5A";

function IntroVideoSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  const videoId = getYoutubeVideoId(INTRO_YOUTUBE_URL);
  const embedUrl = getYoutubeEmbedUrl(INTRO_YOUTUBE_URL);
  const poster = videoId
    ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    : undefined;

  const content = (
    <section className="relative overflow-hidden bg-featuresSection py-20 md:py-28">
      <PhysicsGrid className="opacity-40" />
      <ContourMap className="opacity-[0.07]" />
      <FloatingMotifs className="opacity-40" />
      <GlowOrb className="top-10 -start-24 size-80 from-teal/20 to-gold/10" />
      <GlowOrb className="bottom-0 -end-20 size-72 from-color2/15 to-teal/10" />
      <div className="pointer-events-none absolute end-6 top-16 hidden opacity-35 lg:block">
        <CompassRose />
      </div>
      <div className="pointer-events-none absolute start-8 bottom-20 hidden opacity-30 md:block">
        <PyramidMotif />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
          <span className="mb-4 inline-block rounded-full border border-color1/20 bg-color1/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-color1">
            {t("intro.badge")}
          </span>
          <Heading className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("intro.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("intro.description")}
          </SubHeading>
        </div>

        <PhysicsDivider />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-8 max-w-4xl"
        >
          {/* Map-frame chrome around the player */}
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.75rem]",
              "border border-color1/20 bg-gradient-to-br from-teal/10 via-background to-gold/10",
              "p-2 shadow-xl shadow-color1/10 sm:p-3"
            )}
          >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-color1/40 to-transparent" />
            <div className="pointer-events-none absolute inset-y-8 start-0 w-px bg-gradient-to-b from-transparent via-gold/35 to-transparent" />
            <div className="pointer-events-none absolute inset-y-8 end-0 w-px bg-gradient-to-b from-transparent via-teal/35 to-transparent" />

            <div className="relative aspect-video overflow-hidden rounded-[1.25rem] bg-heading/90">
              {playing && embedUrl ? (
                <iframe
                  src={`${embedUrl}&autoplay=1`}
                  title={t("intro.videoTitle")}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color1 focus-visible:ring-offset-2"
                  aria-label={t("intro.play")}
                >
                  {poster && (
                    <img
                      src={poster}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-heading/70 via-heading/25 to-heading/10" />
                  <ContourMap className="opacity-[0.15] text-white" />

                  <span
                    className={cn(
                      "relative z-10 flex size-16 items-center justify-center rounded-full sm:size-20",
                      "bg-gradient-to-br from-color1 to-color2 text-white",
                      "shadow-lg shadow-color2/30 ring-4 ring-white/25",
                      "transition duration-300 group-hover:scale-110 group-hover:shadow-xl"
                    )}
                  >
                    <Play className="size-7 fill-white ps-0.5 sm:size-8" />
                  </span>

                  <span className="absolute bottom-4 inset-x-4 z-10 text-center text-sm font-medium text-white/90 sm:bottom-6 sm:text-base">
                    {t("intro.playHint")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  if (reduceMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}

export default IntroVideoSection;
