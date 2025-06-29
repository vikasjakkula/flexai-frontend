import { ContainerTextFlip } from "./ui/container-text-flip";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function HeroSection() {
  const words = ["better", "modern", "beautiful", "awesome"];
  return (
    <div className="w-full min-h-[90vh] bg-white flex flex-col md:flex-row items-center justify-center px-4 md:px-16 py-12 gap-8">
      {/* Left: Text and animation */}
      <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "mb-6 text-4xl md:text-6xl font-extrabold leading-tight text-zinc-800"
          )}
        >
          Make your websites look 10x <ContainerTextFlip words={words} />
        </motion.h1>
       
      </div>
      {/* Right: Image */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/iconright.png"
          alt="Hero Illustration"
          className="w-full max-w-2xl h-[28rem] md:h-[36rem] object-contain ml-0 md:ml-40"
        />
      </div>
    </div>
  );
}

export function HeroSectionLeftImage() {
  const words = ["better", "modern", "beautiful", "awesome"];
  return (
    <div className="w-full min-h-[90vh] bg-white flex flex-col md:flex-row items-center justify-center px-4 md:px-16 py-12 gap-8">
      {/* Left: Image */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/iconleft.png"
          alt="Hero Illustration Left"
          className="w-full max-w-2xl h-[28rem] md:h-[36rem] object-contain mr-0 md:mr-40"
        />
      </div>
      {/* Right: Text and animation */}
      <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "mb-6 text-4xl md:text-6xl font-extrabold leading-tight text-zinc-800"
          )}
        >
          Make your websites look 10x <ContainerTextFlip words={words} />
        </motion.h1>
        {/* Optionally add a subheading here */}
      </div>
    </div>
  );
} 