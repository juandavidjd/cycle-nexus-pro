// src/components/habitat/HabitatLayout.tsx
// Layout completo del habitat ODI — liveodi.com
//
// Lo que ES:
//   Fondo void (#020509), Orb respirando, conversacion, API real.
//   Referencia visual: HER. Samantha. Voz + presencia + espacio.
//
// Lo que NO ES:
//   Dashboard, chatbot, marketplace, SaaS, landing page.

import { useState, useCallback } from 'react';
import { Orb, getOrbColor } from './Orb';
import { ChatStream } from './ChatStream';
import type { ODIChatResponse } from '@/lib/odiApi';

export function HabitatLayout() {
  const [mode, setMode] = useState<string | undefined>();

  const handleResponse = useCallback((data: ODIChatResponse) => {
    if (data.mode) setMode(data.mode);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        background: 'linear-gradient(180deg, #020509 0%, #060d18 50%, #020509 100%)',
        color: '#c8d6e5',
      }}
    >
      {/* Top spacer */}
      <div className="pt-16 sm:pt-24" />

      {/* Orb */}
      <div className="flex justify-center mb-8">
        <Orb size={80} color={getOrbColor(mode)} breathing />
      </div>

      {/* Conversation */}
      <div className="flex-1 w-full max-w-2xl">
        <ChatStream
          greeting="Hola. Estoy aquí."
          onResponse={handleResponse}
        />
      </div>
    </div>
  );
}

export default HabitatLayout;
