import { useAnimate } from 'motion/react';
import * as motion from 'motion/react-client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

interface BoxProperties {
  size: number;
  color: string;
  index: number;
}

const generateBoxProperties = (
  { size, color, index }: BoxProperties,
  isRunning: boolean,
) => {
  return {
    style: {
      width: size,
      height: size,
      backgroundColor: `hsl(var(--${color}))`,
      borderRadius: 5,
      gridArea: '1 / 1 / 2 / 2', // Make all boxes occupy the same grid cell
    },
    animate: isRunning ? { rotate: 360 } : { rotate: 0 },
    transition: {
      duration: 1.2 - index * 0.01,
      repeat: isRunning ? Infinity : 0,
      ease: 'linear',
    },
  };
};

export const MotionDemo = () => {
  const [isRunning, setIsRunning] = useState(false);

  const [scope, animate] = useAnimate();

  const boxes = [
    { size: 200, color: 'accent', index: 0 },
    { size: 150, color: 'secondary', index: 1 },
    { size: 100, color: 'primary', index: 2 },
  ];

  const handleStart = () => {
    setIsRunning(true);
    animate(
      'div',
      { rotate: isRunning ? 360 : 0 },

      { ease: 'linear', duration: 1.2 },
    );
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full h-[500px]">
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={handleStart} disabled={isRunning}>
          Start
        </Button>
        <Button
          className="bg-secondary"
          onClick={handleStop}
          disabled={!isRunning}
        >
          Stop
        </Button>
      </div>
      <div className="grid place-items-center" ref={scope}>
        {boxes.map((box, index) => (
          <motion.div key={index} {...generateBoxProperties(box, isRunning)} />
        ))}
      </div>
    </div>
  );
};
