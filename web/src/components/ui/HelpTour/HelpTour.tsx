import './HelpTour.css';

import React from 'react';
import { ACTIONS, type EventData, EVENTS, Joyride, type Step, type TooltipRenderProps } from 'react-joyride';

import { copy } from '@/lib/copy';

export interface HelpTourProps {
  open: boolean;
  onClose: () => void;
  onStepChange?: (index: number) => void;
}

const STEPS: Step[] = [
  { title: copy.tourStep1Title, content: copy.tourStep1Text, target: '[data-tour="step-1"]', skipBeacon: true },
  { title: copy.tourStep2Title, content: copy.tourStep2Text, target: '[data-tour="step-2"]', skipBeacon: true },
  { title: copy.tourStep4Title, content: copy.tourStep4Text, target: '[data-tour="step-4"]', skipBeacon: true },
  { title: copy.tourStep5Title, content: copy.tourStep5Text, target: '[data-tour="step-5"]', skipBeacon: true },
  { title: copy.tourStep6Title, content: copy.tourStep6Text, target: '[data-tour="step-6"]', skipBeacon: true },
  { title: copy.tourStep9Title, content: copy.tourStep9Text, target: '[data-tour="step-9"]', skipBeacon: true },
];

const btnStyle: React.CSSProperties = {
  background: 'rgba(0, 255, 135, 0.1)',
  color: '#00ff87',
  borderRadius: '8px',
  padding: '0.625rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 700,
  border: '1px solid #00ff87',
  outline: 'none',
  cursor: 'pointer',
};

const TourTooltip: React.FC<TooltipRenderProps> = ({
  index,
  step,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => {
  // Filter out CSS props that might be leaked by Joyride into DOM props
  const filterProps = (props: Record<string, unknown>) => {
    const rest = { ...props };
    delete rest['borderRadius'];
    delete rest['boxShadow'];
    return rest;
  };

  const cleanTooltipProps = filterProps(tooltipProps as Record<string, unknown>);
  const cleanPrimaryProps = filterProps(primaryProps as Record<string, unknown>);
  const cleanBackProps = filterProps(backProps as Record<string, unknown>);
  const cleanSkipProps = filterProps(skipProps as Record<string, unknown>);

  return (
    <div
      {...cleanTooltipProps}
      style={{
        backgroundColor: '#33104d',
        borderRadius: '12px',
        border: '1px solid #3d1a55',
        boxShadow: '0 1rem 3rem rgba(0,0,0,0.6)',
        padding: '1.5rem',
        maxWidth: '24rem',
        width: 'calc(100vw - 2rem)',
        boxSizing: 'border-box',
      }}
    >
      {step.title && (
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.625rem',
            letterSpacing: '-0.01em',
          }}
        >
          {step.title}
        </div>
      )}
      <div
        style={{
          fontSize: '0.9375rem',
          color: '#e8e0f0',
          lineHeight: 1.55,
        }}
      >
        {step.content}
      </div>
      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <button
          {...cleanSkipProps}
          style={{
            color: '#a89bba',
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginRight: 'auto',
          }}
        >
          {copy.tourSkip}
        </button>
        <span style={{ color: '#a89bba', fontSize: '0.8125rem' }}>
          {index + 1}/{size}
        </span>
        {index > 0 && (
          <button {...cleanBackProps} style={btnStyle}>
            {copy.tourBack}
          </button>
        )}
        <button {...cleanPrimaryProps} style={btnStyle}>
          {isLastStep ? copy.tourFinish : copy.tourNext}
        </button>
      </div>
    </div>
  );
};

const joyrideStyles = {
  options: {
    arrowColor: '#3d1a55',
    overlayColor: 'rgba(14, 0, 24, 0.75)',
    zIndex: 10000,
  },
  overlay: {
    pointerEvents: 'none' as const,
  },
  spotlight: {
    // borderRadius and boxShadow are moved to HelpTour.css to avoid React 19 warnings
  },
};

export const HelpTour: React.FC<HelpTourProps> = ({ open, onClose, onStepChange }) => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [tourKey, setTourKey] = React.useState(0);

  const prevOpen = React.useRef(open);

  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setStepIndex(0);
      setTourKey((k) => k + 1);
    }
    prevOpen.current = open;
  }, [open]);

  const handleCallback = (data: EventData) => {
    const { action, index, type } = data;
    if (action === ACTIONS.CLOSE) return;

    if (type === EVENTS.STEP_BEFORE) {
      onStepChange?.(index);
    } else if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) setStepIndex(index + 1);
      else if (action === ACTIONS.PREV) setStepIndex(index - 1);
    } else if (type === EVENTS.TOUR_END) {
      onClose();
    }
  };

  return (
    <Joyride
      key={tourKey}
      steps={STEPS}
      run={open}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      tooltipComponent={TourTooltip}
      styles={joyrideStyles}
      onEvent={handleCallback}
      options={{
        showProgress: true,
        overlayClickAction: false,
        blockTargetInteraction: true,
        spotlightPadding: 4,
        buttons: ['back', 'primary', 'skip'],
      }}
    />
  );
};

HelpTour.displayName = 'HelpTour';
