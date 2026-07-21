import { useGetProfile } from "@/generated/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ContourMap,
  CompassRose,
  FloatingMotifs,
  GlowOrb,
  PyramidMotif,
  ScrollBanner,
  WavePattern,
} from "@/components/ui/physics-graphics";
import { BookOpen, Globe, Landmark } from "lucide-react";
import type { GetStudentProfileResult } from "@/generated/model";
import marinaHero from "@/assets/images/marina-hero.png";
import marinaLogo from "@/assets/images/marina-logo.png";

const HeroSection = () => {
  const { data: profile } = useGetProfile();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.language.startsWith("ar");

  const stats = [
    { icon: BookOpen, label: t("hero.stats.courses") },
    { icon: Landmark, label: t("hero.stats.students") },
    { icon: Globe, label: t("hero.stats.subjects") },
  ];

  const browseCoursesHref = (() => {
    const isStudent =
      profile?.data && profile.data.$type === "GetStudentProfileResult";
    if (!isStudent) return "/courses";

    const level = (profile.data as GetStudentProfileResult).level;
    const match = /Level(\d+)/.exec(level);
    if (match?.[1] !== undefined) {
      return `/courses/levels/${match[1]}`;
    }
    return "/courses";
  })();

  return (
    <motion.section
      dir={isRTL ? "rtl" : "ltr"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="relative flex min-h-[100svh] items-center overflow-hidden map-texture text-heading"
    >
      <ContourMap />
      <FloatingMotifs className="opacity-70" />
      <GlowOrb className="-start-24 top-16 size-[26rem] from-teal/20 to-gold/10" />
      <GlowOrb className="-end-20 bottom-10 size-[22rem] from-color2/15 to-teal/10" />

      <div className="pointer-events-none absolute end-6 top-28 hidden lg:block">
        <CompassRose className="rotate-12" />
      </div>
      <div className="pointer-events-none absolute start-8 bottom-36 hidden md:block">
        <PyramidMotif />
      </div>
      <div className="pointer-events-none absolute start-1/3 top-24 hidden xl:block">
        <ScrollBanner />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-28 lg:grid-cols-2 lg:gap-6 lg:px-12 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn(
            "flex flex-col gap-5 text-center",
            isRTL ? "lg:text-right" : "lg:text-left",
            "items-center lg:items-start"
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-color1 uppercase">
            <Globe className="size-3.5" />
            {t("hero.badge")}
          </span>

          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>

          <p className="max-w-xl text-xl font-bold text-color2 md:text-2xl">
            {t("hero.subtitle")}
          </p>

          <p className="max-w-xl text-base leading-relaxed text-paragraph md:text-lg">
            {t("hero.description")}
          </p>

          <div className="flex w-full flex-col items-center gap-3 pt-1 sm:flex-row lg:justify-start">
            {!profile?.data && (
              <Link to="/sign-in-sign-up" className="relative z-10">
                <button className="rounded-xl bg-color2 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-color2/25 transition hover:brightness-110 hover:scale-[1.02]">
                  {t("hero.getStarted")}
                </button>
              </Link>
            )}
            <Link to={browseCoursesHref} className="relative z-10">
              <button className="rounded-xl border-2 border-color1/40 bg-card/80 px-8 py-3.5 text-sm font-bold text-color1 backdrop-blur transition hover:border-color1 hover:bg-card">
                {t("hero.browseCourses")}
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 lg:justify-start">
            {stats.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-color1/20 bg-card/75 px-4 py-2 text-sm text-paragraph shadow-sm backdrop-blur"
              >
                <Icon className="size-4 text-color1" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: isRTL ? -36 : 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }}
          className="relative flex items-end justify-center"
        >
          <div className="absolute bottom-10 size-[17rem] rounded-full bg-gradient-to-br from-teal/25 via-gold/15 to-color2/10 blur-2xl md:size-[22rem]" />
          <div className="absolute bottom-16 size-[13rem] rounded-full border border-dashed border-color1/25 md:size-[18rem]" />

          <motion.img
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            src={marinaLogo}
            alt={t("hero.title")}
            className="relative z-10 max-h-[68vh] w-auto max-w-full object-contain drop-shadow-2xl select-none"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).src = marinaHero;
            }}
          />
        </motion.div>
      </div>

      <WavePattern />
    </motion.section>
  );
};

export default HeroSection;
