import React from 'react';

export const KhmerRobotMascot: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      {/* Straw Hat Gradients */}
      <linearGradient id="straw_cone" x1="80" y1="12" x2="80" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="straw_brim" x1="15" y1="46" x2="145" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="35%" stopColor="#FBBF24" />
        <stop offset="70%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {/* Robot Chassis White Shading */}
      <linearGradient id="chassis_white" x1="45" y1="50" x2="115" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      {/* Blue Accent Gradients */}
      <linearGradient id="robot_cyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      {/* Dark Visor */}
      <linearGradient id="visor_dark" x1="80" y1="62" x2="80" y2="92" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="60%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      {/* Glowing Heart */}
      <radialGradient id="heart_glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#BAE6FD" />
        <stop offset="40%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </radialGradient>
      {/* Shadow */}
      <ellipse id="base_shadow" cx="80" cy="154" rx="36" ry="6" fill="#0F172A" opacity="0.12" />
    </defs>

    {/* Drop Shadow on Ground */}
    <use href="#base_shadow" />

    {/* Feet / Blue Boots */}
    <g>
      <ellipse cx="62" cy="144" rx="14" ry="9" fill="url(#chassis_white)" stroke="#94A3B8" strokeWidth="0.8" />
      <path d="M52 146C54 149 70 149 72 146C70 151 54 151 52 146Z" fill="url(#robot_cyan)" />

      <ellipse cx="98" cy="144" rx="14" ry="9" fill="url(#chassis_white)" stroke="#94A3B8" strokeWidth="0.8" />
      <path d="M88 146C90 149 106 149 108 146C106 151 90 151 88 146Z" fill="url(#robot_cyan)" />
    </g>

    {/* Legs */}
    <rect x="58" y="126" width="8" height="16" rx="4" fill="url(#robot_cyan)" />
    <rect x="94" y="126" width="8" height="16" rx="4" fill="url(#robot_cyan)" />

    {/* Left Arm (Resting) */}
    <g transform="translate(34, 104) rotate(15)">
      <rect x="0" y="0" width="10" height="24" rx="5" fill="url(#chassis_white)" stroke="#94A3B8" strokeWidth="0.6" />
      <ellipse cx="5" cy="24" rx="7" ry="6" fill="url(#robot_cyan)" />
      <circle cx="2" cy="22" r="2.5" fill="url(#robot_cyan)" />
    </g>

    {/* Right Arm (Waving Cheerful Pose) */}
    <g transform="translate(122, 94) rotate(-35)">
      <rect x="0" y="-2" width="11" height="26" rx="5.5" fill="url(#chassis_white)" stroke="#94A3B8" strokeWidth="0.6" />
      {/* Hand Mitten with thumb */}
      <ellipse cx="5.5" cy="-4" rx="8" ry="8" fill="url(#robot_cyan)" />
      <ellipse cx="12" cy="-3" rx="3.5" ry="4.5" fill="url(#robot_cyan)" />
    </g>

    {/* Main Robot Torso */}
    <ellipse cx="80" cy="116" rx="28" ry="24" fill="url(#chassis_white)" stroke="#CBD5E1" strokeWidth="1" />
    <ellipse cx="80" cy="112" rx="20" ry="16" fill="#FFFFFF" opacity="0.6" />

    {/* Cyan Heart on Chest */}
    <path 
      d="M80 123C80 123 71 117 71 111C71 107.5 73.5 105 77 105C79 105 80 106.5 80 106.5C80 106.5 81 105 83 105C86.5 105 89 107.5 89 111C89 117 80 123 80 123Z" 
      fill="url(#heart_glow)" 
      stroke="#38BDF8" 
      strokeWidth="1.2" 
    />

    {/* Neck Krama Scarf (Red & White Checkered Cambodian Scarf) */}
    <g>
      {/* Scarf wrapped neck loop */}
      <path 
        d="M48 93C55 88 105 88 112 93C116 99 108 108 80 108C52 108 44 99 48 93Z" 
        fill="#DC2626" 
        stroke="#991B1B" 
        strokeWidth="1" 
      />
      {/* Checkered pattern lines */}
      <path d="M52 92L55 106M62 90L64 107M72 89L73 108M82 89L82 108M92 89L91 107M101 91L99 106M108 93L105 104" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />
      <path d="M48 96C62 94 98 94 112 96M49 101C63 99 97 99 111 101" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />

      {/* Hanging Tail of Scarf (Right side) */}
      <path 
        d="M98 101L104 136C104 139 122 139 120 134L114 99C110 99 102 100 98 101Z" 
        fill="#DC2626" 
        stroke="#991B1B" 
        strokeWidth="0.8" 
      />
      <path d="M102 105L107 136M108 103L113 135M114 102L119 132" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />
      <path d="M100 110L118 107M101 118L120 115M103 126L121 123" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.85" />
      {/* Gold fringe at bottom */}
      <path d="M104 136L120 134" stroke="#FBBF24" strokeWidth="2.5" />
      <path d="M104 137L104 141M108 137L108 141M112 136L112 141M116 135L116 140M120 134L120 139" stroke="#DC2626" strokeWidth="1.5" />
    </g>

    {/* Blue Ear-Cuff Headset (Left & Right) */}
    <ellipse cx="42" cy="74" rx="7" ry="14" fill="url(#robot_cyan)" stroke="#0284C7" strokeWidth="1" />
    <ellipse cx="42" cy="74" rx="3.5" ry="9" fill="#E0F2FE" opacity="0.8" />

    <ellipse cx="118" cy="74" rx="7" ry="14" fill="url(#robot_cyan)" stroke="#0284C7" strokeWidth="1" />
    <ellipse cx="118" cy="74" rx="3.5" ry="9" fill="#E0F2FE" opacity="0.8" />

    {/* Glossy White Robot Head */}
    <ellipse cx="80" cy="74" rx="38" ry="30" fill="url(#chassis_white)" stroke="#CBD5E1" strokeWidth="1.2" />

    {/* Black Visor Screen */}
    <rect x="52" y="58" width="56" height="32" rx="14" fill="url(#visor_dark)" stroke="#38BDF8" strokeWidth="1.5" />
    {/* Visor 3D Specular Highlight Glass Glow */}
    <ellipse cx="70" cy="65" rx="14" ry="4" transform="rotate(-10 70 65)" fill="#FFFFFF" opacity="0.4" />
    <circle cx="98" cy="66" r="2.5" fill="#38BDF8" opacity="0.6" />

    {/* Cheeks Cyan Glow */}
    <circle cx="58" cy="78" r="3" fill="#38BDF8" opacity="0.5" />
    <circle cx="102" cy="78" r="3" fill="#38BDF8" opacity="0.5" />

    {/* Traditional Cambodian Palm Straw Hat */}
    {/* Wide Curved Woven Brim */}
    <ellipse cx="80" cy="50" rx="66" ry="18" fill="url(#straw_brim)" stroke="#92400E" strokeWidth="1" />
    {/* Woven Cross-Hatch Texture on Brim */}
    <path d="M22 52C40 40 120 40 138 52" stroke="#78350F" strokeWidth="0.8" opacity="0.4" />
    <path d="M28 55C46 44 114 44 132 55" stroke="#FEF3C7" strokeWidth="0.8" opacity="0.6" />
    <path d="M30 46L38 54M45 42L54 53M62 40L71 52M78 40L86 52M95 40L103 52M112 43L120 54M126 47L133 55" stroke="#92400E" strokeWidth="0.7" opacity="0.4" />

    {/* Conical Crown of Hat */}
    <path 
      d="M58 48L64 16C64 12 96 12 96 16L102 48Z" 
      fill="url(#straw_cone)" 
      stroke="#92400E" 
      strokeWidth="1.2" 
    />
    {/* Top Peak */}
    <ellipse cx="80" cy="14" rx="16" ry="4" fill="#FDE68A" stroke="#B45309" strokeWidth="0.8" />

    {/* Cambodian National Flag Badge on Front of Hat */}
    <g transform="translate(68, 22)">
      {/* Top Blue Stripe */}
      <rect x="0" y="0" width="24" height="4.5" fill="#032EA6" rx="0.5" />
      {/* Middle Red Stripe */}
      <rect x="0" y="4.5" width="24" height="9" fill="#ED1C24" />
      {/* Bottom Blue Stripe */}
      <rect x="0" y="13.5" width="24" height="4.5" fill="#032EA6" rx="0.5" />
      {/* White Angkor Wat Silhouette in Middle */}
      <g transform="translate(4, 5.5) scale(0.65)" fill="#FFFFFF">
        <path d="M12 0L15 4H18V10H6V4H9L12 0Z" />
        <rect x="4" y="6" width="3" height="4" />
        <rect x="17" y="6" width="3" height="4" />
        <path d="M11 2L13 2L13 10L11 10Z" />
        <rect x="2" y="10" width="20" height="2" />
      </g>
      <rect x="0" y="0" width="24" height="18" fill="none" stroke="#78350F" strokeWidth="0.5" rx="0.5" />
    </g>
  </svg>
);
