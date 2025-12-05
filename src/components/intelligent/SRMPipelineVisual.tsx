import { useState, useEffect } from 'react';
import { FileInput, Database, Layers, GitMerge, Sparkles, Eye, Check, Loader2 } from 'lucide-react';

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed';
}

interface SRMPipelineVisualProps {
  isProcessing?: boolean;
  currentStep?: number;
  onComplete?: () => void;
}

const pipelineSteps: Omit<PipelineStep, 'status'>[] = [
  {
    id: 'ingesta',
    title: 'Ingesta',
    description: 'Lectura del archivo',
    icon: <FileInput className="w-6 h-6" />,
  },
  {
    id: 'extraccion',
    title: 'Extracción',
    description: 'Extracción de datos',
    icon: <Database className="w-6 h-6" />,
  },
  {
    id: 'normalizacion',
    title: 'Normalización',
    description: 'Normalización SRM',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    id: 'unificacion',
    title: 'Unificación',
    description: 'Unificación por taxonomía',
    icon: <GitMerge className="w-6 h-6" />,
  },
  {
    id: 'enriquecimiento',
    title: 'Enriquecimiento',
    description: 'Enriquecimiento técnico',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'ficha360',
    title: 'Ficha 360°',
    description: 'Generación Ficha 360°',
    icon: <Eye className="w-6 h-6" />,
  },
];

export const SRMPipelineVisual = ({ 
  isProcessing = false, 
  currentStep = -1,
  onComplete 
}: SRMPipelineVisualProps) => {
  const [steps, setSteps] = useState<PipelineStep[]>(
    pipelineSteps.map(step => ({ ...step, status: 'pending' as const }))
  );

  useEffect(() => {
    if (!isProcessing) {
      setSteps(pipelineSteps.map(step => ({ ...step, status: 'pending' as const })));
      return;
    }

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < pipelineSteps.length) {
        setSteps(prev => prev.map((step, idx) => {
          if (idx < stepIndex) return { ...step, status: 'completed' as const };
          if (idx === stepIndex) return { ...step, status: 'processing' as const };
          return { ...step, status: 'pending' as const };
        }));
        stepIndex++;
      } else {
        setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
        clearInterval(interval);
        onComplete?.();
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isProcessing, onComplete]);

  useEffect(() => {
    if (currentStep >= 0) {
      setSteps(prev => prev.map((step, idx) => {
        if (idx < currentStep) return { ...step, status: 'completed' as const };
        if (idx === currentStep) return { ...step, status: 'processing' as const };
        return { ...step, status: 'pending' as const };
      }));
    }
  }, [currentStep]);

  const getStatusStyles = (status: PipelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-primary bg-primary/20 text-primary';
      case 'processing':
        return 'border-secondary bg-secondary/20 text-secondary animate-pulse';
      default:
        return 'border-steel-600 bg-steel-800/50 text-steel-400';
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-500
              ${getStatusStyles(step.status)}
            `}
          >
            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-steel-600 z-0">
                <div 
                  className={`h-full transition-all duration-500 ${
                    step.status === 'completed' ? 'bg-primary w-full' : 'w-0'
                  }`}
                />
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`
                relative w-12 h-12 rounded-full flex items-center justify-center
                ${step.status === 'completed' ? 'bg-primary/30' : 
                  step.status === 'processing' ? 'bg-secondary/30' : 'bg-steel-700'}
              `}>
                {step.status === 'processing' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : step.status === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>

              <div>
                <h4 className="font-subtitle text-sm font-semibold">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>

              {/* Status indicator */}
              <div className={`
                text-xs px-2 py-0.5 rounded-full
                ${step.status === 'completed' ? 'bg-primary/20 text-primary' :
                  step.status === 'processing' ? 'bg-secondary/20 text-secondary' :
                  'bg-steel-700 text-steel-400'}
              `}>
                {step.status === 'completed' ? '✓ Completado' :
                 step.status === 'processing' ? 'Procesando...' : 'Pendiente'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SRMPipelineVisual;
