import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import { SiSpacex } from "react-icons/si";
import { FiArrowRight } from "react-icons/fi";

// Landing Component
export default function Landing() {
  return (
    <div className="bg-zinc-950 w-screen min-h-screen overflow-x-hidden">
      <Lenis root options={{ lerp: 0.05 }}>
        <Nav />
        <Hero />
        <Features />
        <Subscription />
      </Lenis>
    </div>
  );
}

// Navigation Bar
const Nav = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3 w-full text-white">
      <SiSpacex className="text-3xl mix-blend-difference" />
      <button
        onClick={() => navigate("/signup")}
        className="flex items-center gap-1 text-xs text-zinc-400"
      >
        to sign up <FiArrowRight />
      </button>
    </nav>
  );
};

// Hero Section
const SECTION_HEIGHT = 1500;

const Hero = () => {
  const computedHeight = `calc(${SECTION_HEIGHT}px + 100vh)`;

  return (
    <div style={{ height: computedHeight }} className="relative w-full">
      <CenterImage />
      <ParallaxImages />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-zinc-950/0 to-zinc-950" />
    </div>
  );
};

// Center Image
const CenterImage = () => {
  const { scrollY } = useScroll();
  const clip1 = useTransform(scrollY, [0, SECTION_HEIGHT], [25, 0]);
  const clip2 = useTransform(scrollY, [0, SECTION_HEIGHT], [75, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;
  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["170%", "100%"]
  );
  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full bg-cover bg-center"
      style={{
        clipPath,
        backgroundSize,
        opacity,
        backgroundImage:
          "url(https://images.unsplash.com/photo-1460186136353-977e9d6085a1?q=80&w=2670&auto=format&fit=crop)",
      }}
    />
  );
};

// Parallax Images
const ParallaxImages = () => (
  <div className="w-full px-4 pt-[200px]">
    <ParallaxImg
      src="https://images.unsplash.com/photo-1521747116042-5a75e2b1f5b5?q=80"
      alt="Social media interaction"
      start={-200}
      end={200}
      className="w-1/3"
    />
    <ParallaxImg
      src="https://images.unsplash.com/photo-1506748686214-9d4414f1f04f?q=80"
      alt="Social media networking"
      start={200}
      end={-250}
      className="mx-auto w-2/3"
    />
    <ParallaxImg
      src="https://images.unsplash.com/photo-1506748686214-9d4414f1f04f?q=80"
      alt="Social media influencers"
      start={-200}
      end={200}
      className="ml-auto w-1/3"
    />
    <ParallaxImg
      src="https://images.unsplash.com/photo-1578025988660-d86b3400a1cc?q=80"
      alt="Social media content creation"
      start={0}
      end={-500}
      className="ml-24 w-5/12"
    />
  </div>
);

// Parallax Image
const ParallaxImg = ({ className, alt, src, start, end }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={`${className} block`}
      ref={ref}
      style={{ transform, opacity }}
    />
  );
};

// Features Section
const Features = () => (
  <section id="features" className="mx-auto max-w-5xl px-4 py-48 text-white">
    <motion.h1
      initial={{ y: 48, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.75 }}
      className="mb-20 text-4xl font-black uppercase text-zinc-50"
    >
      Features
    </motion.h1>
    {[{ title: "User-Friendly Interface", description: "Easy-to-navigate design for a smooth experience." }].map(
      (feature, index) => (
        <FeatureItem key={index} {...feature} />
      )
    )}
  </section>
);

// Feature Item Component
const FeatureItem = ({ title, description }) => (
  <motion.div
    initial={{ y: 48, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    transition={{ ease: "easeInOut", duration: 0.75 }}
    className="mb-9 border-b border-zinc-800 pb-9"
  >
    <p className="text-xl text-zinc-50">{title}</p>
    <p className="text-sm text-zinc-500 mt-2">{description}</p>
  </motion.div>
);

// Subscription Plans
const Subscription = () => (
  <section id="subscription" className="bg-zinc-800 text-white py-48">
    <motion.h1
      initial={{ y: 48, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeInOut", duration: 0.75 }}
      className="text-4xl font-black uppercase text-center mb-20"
    >
      Subscription Plans
    </motion.h1>
    <div className="flex justify-center gap-8">
      {[{ title: "Basic", price: "$5/month", features: ["Access to basic features", "Limited notifications", "Standard support"] }].map(
        (plan, index) => (
          <PackageCard key={index} {...plan} />
        )
      )}
    </div>
  </section>
);

// Package Card Component
const PackageCard = ({ title, price, features }) => (
  <div className="bg-zinc-700 p-6 rounded-lg shadow-lg w-72 text-center">
    <h2 className="text-2xl font-semibold text-zinc-50">{title}</h2>
    <p className="text-xl text-zinc-300 mt-2">{price}</p>
    <ul className="mt-6 text-zinc-400">
      {features.map((feature, index) => (
        <li key={index} className="text-sm">
          {feature}
        </li>
      ))}
    </ul>
    <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
      Subscribe
    </button>
  </div>
);
