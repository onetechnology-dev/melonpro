import React from 'react';
import seedlingImg from '../../assets/icons/stage_1_seedling.png';
import transplantingImg from '../../assets/icons/stage_2_transplanting.png';
import vineGrowthImg from '../../assets/icons/stage_3_vine_growth.png';
import floweringImg from '../../assets/icons/stage_4_flowering.png';
import pollinationImg from '../../assets/icons/stage_5_pollination.png';
import fertilizingImg from '../../assets/icons/stage_6_fertilizing.png';
import pestCheckImg from '../../assets/icons/stage_7_pest_check.png';
import fruitDevelopmentImg from '../../assets/icons/stage_6_fruit_development.png';
import harvestImg from '../../assets/icons/stage_8_harvest.png';
import greenhouseBg from '../../assets/images/greenhouse_mode_bg.jpg';

// ==========================================
// Botanical Standard Melon Lifecycle Stage Illustrations
// ==========================================

export const SeedlingIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={seedlingImg}
    alt="Seedling"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const TransplantingIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={transplantingImg}
    alt="Transplanting"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const VineGrowthIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={vineGrowthImg}
    alt="Vine Growth"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const FloweringIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={floweringImg}
    alt="Flowering"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const PollinationIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={pollinationImg}
    alt="Pollination"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const FertilizingIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={fertilizingImg}
    alt="Fertilizing"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const PestCheckIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={pestCheckImg}
    alt="Pest Check"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);

export const FruitDevelopmentIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={fruitDevelopmentImg}
    alt="Fruit Expansion & Netting"
    className={`${className} object-contain select-none mix-blend-multiply`}
    draggable={false}
  />
);

export const HarvestIllustration: React.FC<{ className?: string }> = ({ className = "w-14 h-14" }) => (
  <img
    src={harvestImg}
    alt="Harvest"
    className={`${className} object-contain select-none`}
    draggable={false}
  />
);



// ==========================================
// Additional Application Brand Graphics
// ==========================================

// Melon Slice Logo - Used in Top Brand & Nav Menu (matching Harvest icon)
export const MelonLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <img
    src={harvestImg}
    alt="MelonPro Logo"
    className={`${className} object-contain drop-shadow-sm select-none`}
    draggable={false}
  />
);

// Yield Melon Graphic - Big luscious cantaloupe with sliced half
export const YieldMelonGraphic: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <img
      src={harvestImg}
      alt="Yield Melon"
      className="w-full h-full object-contain filter drop-shadow-sm select-none"
      draggable={false}
    />
  </div>
);

// Greenhouse Farm Landscape for Sidebar Footer
export const SidebarGreenhouseBanner: React.FC<{ className?: string }> = ({ className = "w-full h-24" }) => (
  <div className={`relative overflow-hidden rounded-xl border border-emerald-900/40 shadow-xs group ${className}`}>
    <img
      src={greenhouseBg}
      alt="Melon Greenhouse"
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent" />
  </div>
);
