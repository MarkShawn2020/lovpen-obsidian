import React, { useState, useEffect } from 'react';
import { LovpenReactBridge } from './LovpenReactBridge';

/**
 * Wrapper component to manage props updates without remounting JotaiProvider
 */
export const LovpenReactWrapper: React.FC<{ initialProps: any; container?: HTMLElement }> = ({ initialProps, container }) => {
  const [props, setProps] = useState(initialProps);

  // Expose update function to parent
  useEffect(() => {
    if (container) {
      (container as any).__updateProps = setProps;
    }
  }, [container]);

  return <LovpenReactBridge {...props} />;
};
