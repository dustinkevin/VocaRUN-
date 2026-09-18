import React from 'react';

interface RunnerCharacterProps {
  lane: 0 | 1 | 2;
  isSlowed?: boolean;
  statusEffect?: 'none' | 'success' | 'stumble';
}

export const RunnerCharacter: React.FC<RunnerCharacterProps> = ({
  isSlowed = false,
  statusEffect = 'none',
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Visual Feedback Alerts above character */}
      {statusEffect === 'success' && (
        <div className="absolute -top-12 z-20 animate-bounce flex items-center gap-1 bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
          <span>✨ NICE! +100</span>
        </div>
      )}

      {statusEffect === 'stumble' && (
        <div className="absolute -top-12 z-20 animate-bounce flex items-center gap-1 bg-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
          <span>💥 OOPS!</span>
        </div>
      )}

      {isSlowed && statusEffect !== 'stumble' && (
        <div className="absolute -top-10 z-10 flex items-center gap-1 bg-amber-500/95 text-white font-black text-[11px] px-2 py-0.5 rounded-full shadow animate-pulse whitespace-nowrap border border-amber-300">
          <span>⚠️ SLOW!</span>
        </div>
      )}

      {/* Runner SVG Graphic with dynamic CSS animation */}
      <div
        className={`relative w-24 h-28 transition-transform duration-200 ${
          statusEffect === 'success'
            ? 'scale-110 -translate-y-3'
            : statusEffect === 'stumble'
            ? 'rotate-6 scale-95 translate-y-1'
            : isSlowed
            ? 'scale-95'
            : 'scale-100'
        }`}
      >
        {/* Shadow on ground */}
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/25 rounded-full blur-xs transition-all duration-200 ${
            statusEffect === 'success' ? 'scale-75 opacity-40' : 'scale-100 opacity-70'
          }`}
        />

        <svg
          viewBox="0 0 100 120"
          className={`w-full h-full filter drop-shadow-md ${
            isSlowed ? 'animate-[pulse_1.5s_infinite]' : 'animate-[bounce_0.6s_infinite]'
          }`}
        >
          {/* Sweat drops when slowed */}
          {isSlowed && (
            <g className="animate-pulse">
              <path
                d="M 24 38 Q 21 44 24 47 Q 27 44 24 38 Z"
                fill="#38bdf8"
                className="animate-bounce"
              />
              <path
                d="M 76 34 Q 73 40 76 43 Q 79 40 76 34 Z"
                fill="#38bdf8"
                className="animate-bounce"
              />
            </g>
          )}

          {/* Torso & Athletic Jersey */}
          <rect
            x="36"
            y="44"
            width="28"
            height="32"
            rx="6"
            fill={isSlowed ? '#f59e0b' : '#3b82f6'}
            stroke="#1e3a8a"
            strokeWidth="3"
          />
          {/* Jersey Runner Number / VocaRUN V Logo */}
          <path
            d="M 44 52 L 50 64 L 56 52"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Left Arm & Glove */}
          <g
            className={`origin-[35px_46px] ${
              isSlowed
                ? 'animate-[spin_2s_ease-in-out_infinite_alternate]'
                : 'animate-[wiggle_0.4s_ease-in-out_infinite_alternate]'
            }`}
          >
            <path
              d="M 36 48 L 22 58 L 26 66"
              stroke="#fbbf24"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="27" cy="66" r="4.5" fill="#ef4444" />
          </g>

          {/* Right Arm & Glove */}
          <g
            className={`origin-[65px_46px] ${
              isSlowed
                ? 'animate-[spin_2s_ease-in-out_infinite_alternate-reverse]'
                : 'animate-[wiggle_0.4s_ease-in-out_infinite_alternate-reverse]'
            }`}
          >
            <path
              d="M 64 48 L 78 58 L 74 66"
              stroke="#fbbf24"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="73" cy="66" r="4.5" fill="#ef4444" />
          </g>

          {/* Left Leg & Sneaker */}
          <path
            d="M 42 76 L 38 94 L 30 96"
            stroke="#1e293b"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 27 96 L 38 96"
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Right Leg & Sneaker */}
          <path
            d="M 58 76 L 62 94 L 70 96"
            stroke="#1e293b"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 62 96 L 73 96"
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Head & Face */}
          <circle cx="50" cy="30" r="17" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />

          {/* Hair (Youthful runner style) */}
          <path
            d="M 33 26 C 33 14, 67 14, 67 26 C 65 18, 55 16, 50 16 C 43 16, 36 20, 33 26 Z"
            fill="#1e293b"
          />
          <path d="M 40 16 L 36 10 L 44 14 Z" fill="#1e293b" />
          <path d="M 52 15 L 56 8 L 59 14 Z" fill="#1e293b" />

          {/* Sport Headband */}
          <rect x="33" y="22" width="34" height="6" rx="2" fill="#ef4444" />
          <line x1="33" y1="25" x2="67" y2="25" stroke="#ffffff" strokeWidth="1.5" />

          {/* Eyes & Expressions */}
          {statusEffect === 'success' ? (
            <g>
              {/* Star / Happy wink Eyes */}
              <path
                d="M 42 29 Q 45 26 48 29"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 52 29 Q 55 26 58 29"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Big Smile */}
              <path
                d="M 45 35 Q 50 41 55 35"
                stroke="#b91c1c"
                strokeWidth="2"
                fill="#fca5a5"
              />
            </g>
          ) : statusEffect === 'stumble' || isSlowed ? (
            <g>
              {/* Dizzy / Worried Eyes */}
              <line x1="42" y1="27" x2="48" y2="31" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              <line x1="42" y1="31" x2="48" y2="27" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              <line x1="52" y1="27" x2="58" y2="31" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              <line x1="52" y1="31" x2="58" y2="27" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              {/* Panting mouth */}
              <ellipse cx="50" cy="37" rx="3.5" ry="3" fill="#1e293b" />
            </g>
          ) : (
            <g>
              {/* Determined energetic runner eyes */}
              <circle cx="45" cy="29" r="2.2" fill="#1e293b" />
              <circle cx="55" cy="29" r="2.2" fill="#1e293b" />
              <circle cx="46" cy="28" r="0.8" fill="#ffffff" />
              <circle cx="56" cy="28" r="0.8" fill="#ffffff" />
              {/* Confident smile */}
              <path
                d="M 46 34 Q 50 38 54 34"
                stroke="#1e293b"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Rosy cheeks */}
          <ellipse cx="38" cy="33" rx="2" ry="1.5" fill="#f87171" opacity="0.6" />
          <ellipse cx="62" cy="33" rx="2" ry="1.5" fill="#f87171" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};
