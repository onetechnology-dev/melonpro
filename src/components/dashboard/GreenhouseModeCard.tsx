import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useI18n } from '../../locales/i18nContext';
import greenhouseBg from '../../assets/images/greenhouse_mode_bg.jpg';

export const GreenhouseModeCard: React.FC = () => {
  const { setActiveTab } = useFarm();
  const { language } = useI18n();

  return (
    <div 
      onClick={() => setActiveTab('field')}
      className="relative rounded-3xl overflow-hidden shadow-2xs border border-slate-200/90 bg-white group cursor-pointer h-full min-h-[118px] flex items-center"
    >
      {/* Background Greenhouse Image with focus on the left greenhouse arched structure */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src={greenhouseBg} 
          alt="Greenhouse Mode" 
          className="w-full h-full object-cover object-left group-hover:scale-105 transition-transform duration-500" 
        />
      </div>

      {/* Floating White Background Container matching reference image */}
      <div className="relative z-10 ml-auto w-auto max-w-[72%] sm:max-w-[65%] h-[calc(100%-16px)] my-2 mr-2.5 bg-white rounded-2xl shadow-sm border border-slate-100/80 px-3.5 sm:px-4 py-2 flex items-center justify-between gap-2.5 sm:gap-3">
        <div className="text-left min-w-0">
          <h3 className="font-extrabold text-sm sm:text-[15px] lg:text-base text-[#1f3029] tracking-tight leading-snug whitespace-nowrap">
            Greenhouse Mode
          </h3>
          <p className="text-xs font-khmer text-slate-500 font-semibold mt-0.5 leading-tight whitespace-nowrap">
            របៀបផ្ទះកញ្ចក់
          </p>
        </div>

        {/* Circular Action Button with Arrow & Motion Animation */}
        <motion.div 
          whileHover={{ x: 4, scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-[#234835] group-hover:bg-[#164e22] group-hover:text-white transition-all shrink-0"
        >
          <motion.div
            animate={{ x: [0, 2.5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowRight className="w-4 h-4 text-[#234835] group-hover:text-white transition-colors" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
