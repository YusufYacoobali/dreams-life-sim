import React, { forwardRef } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { displayNumber, displayText } from './displayNumbers';

export { displayText } from './displayNumbers';
export type DisplayText = NativeText;

function displayChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') return displayText(children);
  if (typeof children === 'number') return displayNumber(children);
  if (Array.isArray(children)) return children.map(displayChildren);
  if (
    React.isValidElement<React.PropsWithChildren>(children) &&
    children.type === React.Fragment
  )
    return React.cloneElement(
      children,
      undefined,
      displayChildren(children.props.children),
    );
  return children;
}

/** The single read-only text boundary; native input values are deliberately exact. */
export const DisplayText = forwardRef<NativeText, TextProps>(
  function DisplayText(
    { children, accessibilityLabel, accessibilityHint, ...props },
    ref,
  ) {
    return (
      <NativeText
        {...props}
        ref={ref}
        accessibilityLabel={displayText(accessibilityLabel)}
        accessibilityHint={displayText(accessibilityHint)}
      >
        {displayChildren(children)}
      </NativeText>
    );
  },
);
