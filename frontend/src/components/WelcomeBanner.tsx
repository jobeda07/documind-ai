import React from 'react';

export const WelcomeBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100/70 bg-gradient-to-r from-[#eef0fc] via-[#ecebff] to-[#d8dfff] p-6 shadow-sm sm:p-8">
      {/* Background soft glow blobs */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-48 h-48 w-48 rounded-full bg-purple-300/30 blur-2xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        {/* Left Greeting Text */}
        <div className="max-w-xl space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Welcome back, John!
          </h2>
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            Your AI-powered document assistant is ready to help.
          </p>
        </div>

        {/* Right 3D AI Robot & Documents Illustration */}
        <div className="flex items-center justify-end">
          <div className="relative h-28 w-44 sm:h-32 sm:w-56">
            {/* Floating Document Behind 1 */}
            <div className="absolute top-2 left-2 h-14 w-10 rotate-[-12deg] rounded-lg border border-white/60 bg-white/70 p-1.5 shadow-sm backdrop-blur-xs">
              <div className="h-1.5 w-5 rounded-full bg-indigo-200" />
              <div className="mt-1 h-1 w-7 rounded-full bg-slate-200" />
              <div className="mt-1 h-1 w-6 rounded-full bg-slate-200" />
            </div>

            {/* Floating Document Behind 2 */}
            <div className="absolute top-1 right-2 h-14 w-10 rotate-[10deg] rounded-lg border border-white/60 bg-white/70 p-1.5 shadow-sm backdrop-blur-xs">
              <div className="h-1.5 w-5 rounded-full bg-purple-200" />
              <div className="mt-1 h-1 w-7 rounded-full bg-slate-200" />
              <div className="mt-1 h-1 w-6 rounded-full bg-slate-200" />
            </div>

            {/* Futuristic Cute Robot Body */}
            <div className="absolute right-8 bottom-0 flex flex-col items-center">
              {/* Antenna */}
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-300" />
                <div className="h-2 w-0.5 bg-slate-400" />
              </div>

              {/* Head */}
              <div className="relative flex h-14 w-20 items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-b from-white to-slate-100 shadow-md">
                {/* Glowing Screen Face */}
                <div className="flex h-9 w-16 items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-2 shadow-inner">
                  {/* Glowing Cyan Eyes */}
                  <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                </div>
                {/* Ear dials */}
                <div className="absolute -left-1.5 h-4 w-1.5 rounded-l-md bg-indigo-300" />
                <div className="absolute -right-1.5 h-4 w-1.5 rounded-r-md bg-indigo-300" />
              </div>

              {/* Torso */}
              <div className="relative -mt-1 flex h-10 w-16 items-center justify-center rounded-2xl border border-white bg-gradient-to-b from-white to-slate-200 shadow-sm">
                {/* Held Document */}
                <div className="absolute -left-3 -top-1 flex h-12 w-9 rotate-[-8deg] flex-col rounded-md border border-indigo-200 bg-white p-1 shadow-md">
                  <div className="h-1.5 w-4 rounded-full bg-indigo-500" />
                  <div className="mt-1 h-1 w-5 rounded-full bg-indigo-200" />
                  <div className="mt-0.5 h-1 w-6 rounded-full bg-slate-200" />
                  <div className="mt-0.5 h-1 w-4 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
