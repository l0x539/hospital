import React, { Children } from "react";
import './MyFooter.css';


function Footer() {
    return(
        <footer className="footer items-start flex overflow-hidden text-justify p-[0 20px 40px] mt-[-1px] relative translate-z-0">
            <div className="footer_container relative pb-[7.5rem] p-10 block max-w-full w-full pb-120\@smallDesk p-40\@smallDesk ">
                <div className="footer_inner justify-between items-start pt-0 pl-0 pr-0 mt-0 flex flex-row flex-wrap pb-0 max-w-[88.8888888889%] w-[88.8888888889] mt-140\@sm">
                    <FooterLogo />
                    <FooterBlock title={"> Navigation"}>
                        <FooterLink href="#" title={"FEATURES +"} />
                        <FooterLink href="#" title={"WHAT CAN YOU BUILD? +"} />
                        <FooterLink href="#" title={"DEVELOPER RESOURCES +"} />
                        <FooterLink href="#" title={"MEDIA +"} />
                        <FooterLink href="#" title={"PARTNERS +"} />
                    </FooterBlock>
                    <FooterBlock title={"> Developers"}>
                        <FooterLink href="#" title={"DOCS +"} />  
                        <FooterLink href="#" title={"CODE +"} /> 
                    </FooterBlock>
                    <FooterBlock title={"> Network"}>
                        <FooterLink href="#" title={"BLOCK EXPLORER +"} /> 
                        <FooterLink href="#" title={"NETWORK STATUS PAGE +"} />
                        <FooterLink href="#" title={"FAUCET +"} />   
                    </FooterBlock>
                    <FooterBlock title={"> Learn"}>
                        <FooterLink href="#" title={"CAREERS +"} />
                        <FooterLink href="#" title={"DISCLAIMERS +"} />
                        <FooterLink href="#" title={"BLOG +"} />
                        <FooterLink href="#" title={"PRIVACY POLICY +"} />
                        <FooterLink href="#" title={"T&C'S +"} />
                    </FooterBlock>
                </div>
                <div className="absolute justify-between items-center flex bottom-10 flex-row left-0 w-full footer_bottom justify-between\@sm">
                    
                    <div className="justify-end flex pl-5 right-[45px] order-1 w-auto shrink-0 bg-black z-10 footer_block_social">
                     <FooterBlockSocial title={"CONNECT WITH US:"}>
                        <FooterIconLink href="#" svgSrc={"/twitter.svg#twitter"}/>
                        <FooterIconLink href="#" svgSrc={"/discord.svg#discord"}/>
                        <FooterIconLink href="#" svgSrc={"/reddit.svg#reddit"}/>
                        <FooterIconLink href="#" svgSrc={"/youtube.svg#youtube"}/>
                        <FooterIconLink href="#" svgSrc={"/instagram.svg#instagram"}/>
                        <FooterIconLink href="#" svgSrc={"/tiktok.svg#tiktok"}/>
                    </FooterBlockSocial>
                    </div>
                    <div className="text-[.875rem] leading-[18px] pr-5 block bg-black z-10 ">
                        <p className="text-[--icon-color] mb-0 mt-0 text-[.875] leading-[18px]">Dominant Strategies</p>
                    </div>
                    <div className="left-2/4 pl-5 text-[.875rem] pr-5 translate-x-[-50%] absolute block bg-black z-10 ">
                        <p className="text-[--icon-color] mb-0 mt-0">© 2023</p>
                    </div>
                    

                </div>
            </div>
        </footer>
    )
}

export default Footer;


const FooterLogo = () => {
    return <>
    <a className="left-0 top-0 w-auto relative FooterLogo relative\@smallDesk"></a>
    </>
};

const FooterBlock = ({
    children,
    title,
    className
}) => {

    return <div className="footer_block">
        <span className="text-white text-lg">{title}</span>
        <ul className="mt-[20px] mb-0 ml-0 p-0">
            {children}
        </ul>
    </div>
};

const FooterLink = ({title, href}) => {

    return <li className="icon text-[#a1a1a1]">
        <a href={href}>{title}</a>
    </li>;
};

const FooterBlockSocial = ({
    children,
    title,
    className
}) => {
return <>
        <span className="text-[--icon-color] text-[.875rem] font-[400] mb-0 pb-0  whitespace-nowrap block list-none">{title}</span>
        <ul className="flex justify-between mb-0 mt-0 max-w-full w-auto ml-0 p-0">
            {children}
        </ul>
    </>
    }

    const FooterIconLink = ({svgSrc, href}) => {

        return <li className="mx-[12px] my-0 w-[22px] fill--icon-color font-normal not-italic">
            <a href={href} className="whitespace-nowrap	">
                <svg className="h-[1.1875rem] w-[1.1875rem] max-w-full">
                    <use xlinkHref={svgSrc}></use>
                </svg>
            </a>
        </li>;
    }