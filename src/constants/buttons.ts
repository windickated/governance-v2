interface ConsoleBtn {
  id: 'conexus' | 'back' | 'omnihub' | 'forward' | 'sagaverse';
  image: string;
  hover: string;
  click: string;
}

export const consolePanel = {
  buttons: <ConsoleBtn[]>[
    {
      id: 'conexus',
      image: '/console/conexus.avif',
      hover: '/console/conexus-hover.avif',
      click: '/console/conexus-active.avif',
    },
    {
      id: 'back',
      image: '/console/back.avif',
      hover: '/console/back-hover.avif',
      click: '/console/back-active.avif',
    },
    {
      id: 'omnihub',
      image: '/console/omnihub.avif',
      hover: '/console/omnihub-hover.avif',
      click: '/console/omnihub-active.avif',
    },
    {
      id: 'forward',
      image: '/console/forward.avif',
      hover: '/console/forward-hover.avif',
      click: '/console/forward-active.avif',
    },
    {
      id: 'sagaverse',
      image: '/console/sagaverse.avif',
      hover: '/console/sagaverse-hover.avif',
      click: '/console/sagaverse-active.avif',
    },
  ],
  console: {
    fullsize: '/console/console.avif',
    mobilesize: '/console/consoleMobile.avif',
  },
};

export const displayScreen = {
  buttons: [
    {
      id: 'switcher',
      video: '/display/video.avif',
      text: '/display/text.avif',
      videoHover: '/display/video-hover.avif',
      textHover: '/display/text-hover.avif',
    },
    {
      id: 'vote',
      image: '/display/vote-clickable.avif',
      hover: '/display/vote-hover.avif',
      click: '/display/vote-active.avif',
      inactive: '/display/vote-inert.avif',
    },
  ],
  display: {
    fullsize: '/display/display.avif',
    mobilesize: '/display/displayMobile.avif',
    BG: '/display/displayBG.avif',
    mobileBG: '/display/displayMobileBG.avif',
  },
};
