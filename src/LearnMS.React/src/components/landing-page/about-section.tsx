import { Badge } from "../ui/badge";
import { Briefcase, School, Laptop } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Heading } from "../ui/heading";
import { SubHeading } from "../ui/sub-heading";
import { WobbleCard } from "../ui/wobble-card";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
  PhysicsGrid,
  GlowOrb,
  ContourMap,
  CompassRose,
  PyramidMotif,
} from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";
import marinaAbout from "@/assets/images/marina-about.png";
import marinaHero from "@/assets/images/marina-hero.png";

const leftToRightVariants = {
  hidden: { opacity: 0, filter: "blur(20px)", y: 40 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9, filter: "blur(20px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.3, duration: 0.7 },
  },
};

const cardStyles = [
  "bg-gradient-to-br from-color1 to-teal",
  "bg-gradient-to-br from-[#b45309] to-gold",
  "bg-gradient-to-br from-color2 to-[#e11d48]",
];

function AboutSection() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || i18n.language.startsWith("ar");

  const cards = [
    { icon: Briefcase, key: "1" },
    { icon: School, key: "2" },
    { icon: Laptop, key: "3" },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
      }}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-aboutSection py-16 md:py-32"
    >
      <PhysicsGrid className="opacity-30" />
      <ContourMap className="opacity-[0.07]" />
      <GlowOrb className="bottom-0 -start-40 size-96 from-teal/15 to-gold/10" />
      <GlowOrb className="top-20 -end-32 size-72 from-color2/10 to-teal/5" />
      <div className="pointer-events-none absolute end-10 top-16 hidden opacity-30 lg:block">
        <CompassRose />
      </div>
      <div className="pointer-events-none absolute start-8 bottom-24 hidden opacity-30 md:block">
        <PyramidMotif />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div
          className={cn(
            "grid items-center gap-12 lg:grid-cols-2 lg:gap-16",
            isRTL && "lg:[direction:rtl]"
          )}
        >
          <motion.div
            variants={imageVariants}
            className={cn(
              "relative flex justify-center",
              isRTL ? "lg:justify-end" : "lg:justify-start"
            )}
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-teal/20 via-gold/15 to-transparent blur-3xl" />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="relative flex min-h-[28rem] items-end justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-teal/15 via-gold/10 to-background ring-2 ring-color1/15 shadow-2xl shadow-color1/10">
                  <img
                    src={marinaAbout}
                    alt={t("about.imageAlt")}
                    className="relative z-10 max-h-[32rem] w-auto max-w-full object-contain object-bottom select-none"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = marinaHero;
                    }}
                  />
                </div>
              </motion.div>

              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-color1/15 bg-background/90 px-5 py-2 shadow-lg backdrop-blur-md">
                <p className="whitespace-nowrap text-sm font-semibold text-color1">
                  {t("hero.title")}
                </p>
              </div>
            </div>
          </motion.div>

          <div className={cn("flex flex-col gap-8", isRTL && "lg:[direction:rtl]")}>
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
              className="text-center lg:text-start"
            >
              <motion.div variants={leftToRightVariants}>
                <Badge className="mb-4 rounded-full border border-color1/20 bg-color1/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-color1 hover:bg-color1/15">
                  {t("about.badge")}
                </Badge>
              </motion.div>

              <motion.div variants={leftToRightVariants}>
                <Heading className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  {t("about.title")}
                </Heading>
              </motion.div>

              <motion.div variants={leftToRightVariants}>
                <SubHeading className="mx-auto mt-4 max-w-none text-balance text-lg tracking-wide md:text-xl lg:mx-0">
                  {t("about.description")}
                </SubHeading>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
              }}
              className="grid gap-4"
            >
              {cards.map(({ icon: Icon, key }, i) => (
                <motion.div key={key} variants={cardItemVariants}>
                  <WobbleCard containerClassName={`h-full group ${cardStyles[i]}`}>
                    <CardHeader className="flex-row items-center gap-4 pb-2 text-start">
                      <CardDecorator>
                        <Icon className="size-5 text-white" aria-hidden />
                      </CardDecorator>
                      <Heading className="text-lg text-white md:text-xl">
                        {t(`about.items.${key}.title`)}
                      </Heading>
                    </CardHeader>
                    <CardContent className="ps-16 text-start">
                      <SubHeading className="text-balance text-sm tracking-wide text-white/80 md:text-base">
                        {t(`about.items.${key}.description`)}
                      </SubHeading>
                    </CardContent>
                  </WobbleCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const CardDecorator = ({ children }: { children: React.ReactNode }) => (
  <div
    aria-hidden
    className="relative size-12 shrink-0 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
  >
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:12px_12px]" />
    <div className="absolute inset-0 m-auto flex size-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
      {children}
    </div>
  </div>
);

export default AboutSection;
