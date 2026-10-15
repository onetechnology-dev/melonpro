import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CloudSun, 
  RotateCw, 
  CloudLightning, 
  ChevronDown 
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';

export const WeatherCard: React.FC = () => {
  const { language } = useI18n();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('ខេត្តកណ្តាល');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const forecast = [
    { day: 'ថ្ងៃនេះ', icon: CloudLightning, temp: '32°' },
    { day: 'អង្គារ', icon: CloudLightning, temp: '30°' },
    { day: 'ពុធ', icon: CloudLightning, temp: '30°' },
    { day: 'ព្រហស្បតិ៍', icon: CloudLightning, temp: '31°' },
    { day: 'សុក្រ', icon: CloudLightning, temp: '28°' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/90 flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2.5">
          <h3 className="font-extrabold text-base text-slate-900">
            Weather / <span className="font-khmer text-slate-600 font-bold">អាកាសធាតុ</span>
          </h3>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Weather"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </motion.button>
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-800 font-khmer mb-2 cursor-pointer">
          <span>{selectedCity}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {/* Current Weather Display */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <CloudSun className="w-8 h-8" />
            </motion.div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight leading-none">
                32°C
              </span>
              <p className="text-xs sm:text-sm text-slate-600 font-khmer font-semibold mt-1">
                ពពកច្រើនក្រាស់
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono font-medium text-slate-500 leading-tight">
            <span>↑ 32°  ↓ 25°</span>
            <span className="block text-slate-400 mt-0.5">66% RH</span>
          </div>
        </div>

        {/* 5-Day Forecast Row */}
        <div className="grid grid-cols-5 gap-1 pt-3.5 mt-2 border-t border-slate-100 text-center">
          {forecast.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.1, y: -2 }}
                className="flex flex-col items-center cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-khmer font-medium text-slate-500 block">{f.day}</span>
                <Icon className="w-4 h-4 text-amber-500 my-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono">{f.temp}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 text-right">
        <span className="text-xs text-slate-400 font-mono">
          Updated 01:20 PM
        </span>
      </div>
    </div>
  );
};
