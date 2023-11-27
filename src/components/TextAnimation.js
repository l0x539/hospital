import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap-trial';
import { ScrambleTextPlugin } from 'gsap-trial/ScrambleTextPlugin';
import './TextAnimation.css';

gsap.registerPlugin(ScrambleTextPlugin);

function TextAnimation({ text }) {
  const textRef = useRef(null);

  const animationConfig = useMemo(() => ({
    paused: true,
    duration: 2,
    scrambleText: {
      text: text,
      chars: 'upperCase', // or 'lowerCase' or 'normal' depending on your preference
      speed: 0.1,
    },
    ease: 'power1.inOut',
  }), [text]);

  useEffect(() => {
    const textElement = textRef.current;
    const animation = gsap.to(textElement, animationConfig);

    const handleMouseEnter = () => {
      animation.restart();
    };

    if (textElement) {
      textElement.addEventListener('mouseenter', handleMouseEnter);

      return () => {
        textElement.removeEventListener('mouseenter', handleMouseEnter);
      };
    }
  }, [animationConfig]);

  return (
    <div>
      <div>
        <div></div>
        <h2>
          <a ref={textRef} className="text-white">
            {text}
          </a>
        </h2>
      </div>
    </div>
  );
}

export default TextAnimation;
