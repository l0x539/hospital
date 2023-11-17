import React from 'react';
import './MyCard.css';

// <MyCard title="DOCS" videourl={<video className="panel-video panel__video--0 align-middle" src={"/panel-video.mp4"}></video>} description="Visit the documentation to start building" svgSrc="/border-button.svg" />
function MyCard({ title, svgSrc, videourl, description}) {
  return (
    <div className="panel relative flex-col flex">
      <h3 className="panel_title mb-0 uppercase font-semibold text-center block mt-0 text-white">{title}</h3>
      <div className="grow max-w-full flex">
        <div className="w-1/2 flex justify-center items-center">
          {videourl}
        </div>
          <div className="panel_description w-1/2 flex flex-col justify-between t-light-grey">
            <p>{description}</p>
            <a className="btn flex items-center justify-center panel_btn opacity-100" href={svgSrc}>
            <span className="whitespace-nowrap items-center">VIEW DOCS</span>
            </a>
          </div>
      </div>
    </div>
      
  );
}

export default MyCard;