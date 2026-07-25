import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, CalendarDays, Crown, Percent, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Heading } from "@/components/ui/heading";
import { SubHeading } from "@/components/ui/sub-heading";
import {
  PhysicsGrid,
  GlowOrb,
  PhysicsDivider,
  ContourMap,
  CompassRose,
} from "@/components/ui/physics-graphics";
import { cn } from "@/lib/utils";

const WHATSAPP_PHONE = "201044556061";

type OfferDef = {
  key: "lecture" | "month" | "year";
  original: number;
  price: number;
  icon: typeof BookOpen;
  featured?: boolean;
};

const offers: OfferDef[] = [
  { key: "lecture", original: 80, price: 65, icon: BookOpen },
  { key: "month", original: 260, price: 200, icon: CalendarDays },
  { key: "year", original: 1400, price: 450, icon: Crown, featured: true },
];

function discountPercent(original: number, price: number) {
  return Math.round(((original - price) / original) * 100);
}

function whatsappHref(offerName: string, price: number, currency: string) {
  const text = encodeURIComponent(
    `Hello Mrs Marina, I want to subscribe to: ${offerName} (${price} ${currency})`
  );
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${text}&type=phone_number&app_absent=0`;
}

function OffersSection() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const currency = t("common.currency");
  const isRTL = i18n.language === "ar" || i18n.language.startsWith("ar");

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-featuresSection py-20 md:py-28"
    >
      <PhysicsGrid className="opacity-40" />
      <ContourMap className="opacity-[0.07]" />
      <GlowOrb className="top-8 -start-24 size-80 from-color2/20 to-gold/10" />
      <GlowOrb className="bottom-0 -end-20 size-72 from-teal/15 to-color1/10" />
      <div className="pointer-events-none absolute end-8 top-20 hidden opacity-35 lg:block">
        <CompassRose />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-color2/25 bg-color2/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-color2">
            <Sparkles className="size-3.5" />
            {t("offers.badge")}
          </span>
          <Heading className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("offers.title")}
          </Heading>
          <SubHeading className="mt-4 text-lg md:text-xl">
            {t("offers.description")}
          </SubHeading>
        </motion.div>

        <PhysicsDivider />

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {offers.map(({ key, original, price, icon: Icon, featured }, index) => {
            const save = discountPercent(original, price);
            const title = t(`offers.items.${key}.title`);
            const href = whatsappHref(title, price, currency);

            return (
              <motion.article
                key={key}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * index, duration: 0.55, ease: "easeOut" }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-[1.75rem] border p-6 sm:p-7",
                  "bg-card/85 backdrop-blur-md shadow-lg transition duration-300",
                  "hover:-translate-y-1 hover:shadow-xl",
                  featured
                    ? "border-color2/40 shadow-color2/15 md:-translate-y-2 md:ring-2 md:ring-color2/25"
                    : "border-color1/15 shadow-color1/5 hover:border-color1/30"
                )}
              >
                {featured && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-color1 via-color2 to-gold" />
                )}

                <div className="mb-5 flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl text-white shadow-md",
                      featured
                        ? "bg-gradient-to-br from-color2 to-gold shadow-color2/30"
                        : "bg-gradient-to-br from-color1 to-teal shadow-color1/25"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                      featured
                        ? "bg-color2/15 text-color2"
                        : "bg-color1/10 text-color1"
                    )}
                  >
                    <Percent className="size-3" />
                    {t("offers.save", { percent: save })}
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-heading sm:text-2xl">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`offers.items.${key}.description`)}
                </p>

                <div className="mt-6 flex flex-wrap items-end gap-2">
                  <span className="font-heading text-4xl font-extrabold tracking-tight text-heading">
                    {price}
                    <span className="ms-1 text-base font-semibold text-muted-foreground">
                      {currency}
                    </span>
                  </span>
                  <span className="mb-1.5 text-sm text-muted-foreground line-through decoration-color2/60">
                    {original} {currency}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-color1">
                  {t("offers.youSave", {
                    amount: original - price,
                    currency,
                  })}
                </p>

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color1 focus-visible:ring-offset-2",
                    featured
                      ? "bg-gradient-to-r from-color1 to-color2 text-white shadow-lg shadow-color2/25 hover:brightness-110"
                      : "border-2 border-color1/35 bg-background/80 text-color1 hover:border-color1 hover:bg-color1 hover:text-white"
                  )}
                >
                  <FaWhatsapp className="size-4" />
                  {t("offers.subscribe")}
                </a>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default OffersSection;
