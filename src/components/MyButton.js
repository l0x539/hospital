import React from "react";

function MyButton({ text, svgSrc }) {
  return (
    <a 
      className="button text-white flex mr-12 items-center justify-center border-solid opacity-100 w-44 relative uppercase"
    >
      <span className="inline-flex text-xm leading-5 pointer-events-none whitespace-nowrap w-28 opacity-100">
        {text}
      </span>
      <svg className="overflow-x-clip overflow-hidden ml-2.5 h-5 w-5 max-w-full">
        <use xlinkHref={svgSrc}></use>
      </svg>
    </a>
  );
}

export default MyButton;
