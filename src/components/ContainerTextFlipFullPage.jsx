import { ContainerTextFlip } from "./ui/container-text-flip";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function ContainerTextFlipFullPage() {
  const words = ["better", "modern", "beautiful", "awesome"];
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center gap-8 bg-white">
      <motion.h1
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className={cn(
          "relative max-w-2xl text-left text-4xl leading-normal font-bold tracking-tight text-zinc-700 md:text-7xl dark:text-zinc-100"
        )}
        layout>
        <div className="inline-block" style={{ fontFamily: 'Raleway, Arial, sans-serif' }}>
          Make your websites look 10x <ContainerTextFlip words={words} />
        </div>
      </motion.h1>
      <img src="/iconright.png" alt="icon right" className="w-40 h-40 md:w-60 md:h-60 object-contain" />
    </div>
  );
} 