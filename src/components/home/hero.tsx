"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/motion/count-up";
import { KizunaMark, ToriiMark, NamiPattern } from "@/components/brand/motifs";

const HEADLINE = ["Kuliah,", "kerja,", "dan", "bertumbuh", "bersama", "di", "Jepang."];

export type HeroStat = { label: string; value: number; suffix?: string };

export function Hero({ stats }: { stats: HeroStat[] }) {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-navy-800 text-white">
      <FloatingParticles />

      <KizunaMark className="absolute -right-4 -bottom-10 -z-10 text-[22rem] leading-none text-white/[0.04] sm:text-[30rem]" />
      <ToriiMark className="absolute top-24 left-6 -z-10 hidden w-40 text-accent/20 lg:block" />
      <NamiPattern className="absolute inset-x-0 bottom-0 -z-10 h-24 w-full text-white/10" />

      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:py-32">
        <motion.span
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-pill border border-accent/40 bg-white/5 px-3.5 py-1.5 text-caption font-medium text-accent"
        >
          <Sparkles className="size-3.5" aria-hidden />
          UNSIA Japan Community
        </motion.span>

        <h1 className="mt-6 max-w-3xl text-display font-semibold tracking-tight text-white sm:text-[3.5rem] sm:leading-[1.08]">
          {HEADLINE.map((word, index) => (
            <motion.span
              key={word + index}
              className="mr-[0.28em] inline-block"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.15 + index * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word === "bersama" ? (
                <span className="text-accent">{word}</span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-6 max-w-xl text-body text-white/75"
        >
          Wadah mahasiswa program distance learning Universitas Siber Asia yang
          tinggal dan bekerja di Jepang — tempat bertanya, berbagi, dan saling
          menguatkan.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.82 }}
          className="mt-9 flex flex-wrap gap-3"
        >
          <Button asChild variant="accent" size="lg">
            <Link href="/register">
              Gabung komunitas
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:border-accent hover:text-accent"
          >
            <Link href="/forum">Lihat forum</Link>
          </Button>
        </motion.div>

        <motion.dl
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-caption text-white/60">{stat.label}</dt>
              <dd className="mt-1 text-h2 font-semibold text-accent">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

/** Slow-drifting gold dots. Purely decorative and skipped for reduced motion. */
function FloatingParticles() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  const dots = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    size: 2 + (i % 3),
    duration: 9 + (i % 5) * 2.5,
    delay: (i % 7) * 0.8,
  }));

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {dots.map((dot, index) => (
        <motion.span
          key={index}
          className="absolute rounded-pill bg-accent/45"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
          }}
          animate={{ y: [0, -26, 0], opacity: [0.2, 0.75, 0.2] }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
