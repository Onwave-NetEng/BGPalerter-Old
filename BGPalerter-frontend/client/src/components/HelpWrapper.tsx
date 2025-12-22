import React from 'react';
import { useHelpTarget } from '@/contexts/HelpContext';

interface HelpWrapperProps {
  helpId: string;
  children: React.ReactElement;
}

export function HelpWrapper({ helpId, children }: HelpWrapperProps) {
  const helpProps = useHelpTarget(helpId);

  return React.cloneElement(children, {
    ...helpProps,
    className: `${(children.props as any).className || ''} cursor-help`,
    title: 'Right-click for help',
  } as any);
}
