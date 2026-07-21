import { useGetProfile } from "@/generated/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { GlowOrb } from "@/components/ui/physics-graphics";
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
      transition={{ duration: 0.5 }}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-hero text-white"
    >
      <GlowOrb className="top-10 -start-32 size-[28rem] from-white/20 to-amber-300/20" />
      <GlowOrb className="bottom-0 -end-24 size-[24rem] from-teal-400/20 to-white/10" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-28 lg:grid-cols-2 lg:gap-8 lg:px-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn(
            "flex flex-col gap-5 text-center",
            isRTL ? "lg:text-right" : "lg:text-left",
            "lg:items-start items-center"
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
            <Globe className="size-3.5" />
            {t("hero.badge")}
          </span>

          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>

          <p className="max-w-xl text-xl font-bold text-amber-200 md:text-2xl">
            {t("hero.subtitle")}
          </p>

          <p className="max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
            {t("hero.description")}
          </p>

          <div
            className={cn(
              "flex w-full flex-col items-center gap-3 pt-2 sm:flex-row",
              isRTL ? "lg:justify-start" : "lg:justify-start"
            )}
          >
            {!profile?.data && (
              <Link to="/sign-in-sign-up" className="relative z-10">
                <button className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-lg transition hover:bg-white/95 hover:scale-[1.02]">
                  {t("hero.getStarted")}
                </button>
              </Link>
            )}
            <Link to={browseCoursesHref} className="relative z-10">
              <button className="rounded-xl border-2 border-white/80 bg-transparent px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                {t("hero.browseCourses")}
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 lg:justify-start">
            {stats.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
              >
                <Icon className="size-4 text-amber-200" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="relative flex items-end justify-center lg:justify-center"
        >
          <div className="absolute bottom-8 size-[18rem] rounded-full bg-white/15 blur-2xl md:size-[22rem]" />
          <div className="absolute bottom-16 size-[14rem] rounded-full border-2 border-dashed border-white/25 md:size-[18rem]" />

          <motion.img
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            src={marinaLogo}
            alt={t("hero.title")}
            className="relative z-10 max-h-[70vh] w-auto max-w-full object-contain drop-shadow-2xl select-none"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).src = marinaHero;
            }}
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
