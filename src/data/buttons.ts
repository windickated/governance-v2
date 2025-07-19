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
      image: '/conexus.avif',
      hover: '/conexus-hover.avif',
      click: '/conexus-active.avif',
    },
    {
      id: 'back',
      image: '/back.avif',
      hover: '/back-hover.avif',
      click: '/back-active.avif',
    },
    {
      id: 'omnihub',
      image: '/omnihub.avif',
      hover: '/omnihub-hover.avif',
      click: '/omnihub-active.avif',
    },
    {
      id: 'forward',
      image: '/forward.avif',
      hover: '/forward-hover.avif',
      click: '/forward-active.avif',
    },
    {
      id: 'sagaverse',
      image: '/sagaverse.avif',
      hover: '/sagaverse-hover.avif',
      click: '/sagaverse-active.avif',
    },
  ],
  console: {
    fullsize: '/console.avif',
    mobilesize: '/consoleMobile.avif',
  },
};

export const displayScreen = {
  buttons: [
    {
      id: 'switcher',
      video: '/video.avif',
      text: '/text.avif',
      videoHover: '/video-hover.avif',
      textHover: '/text-hover.avif',
    },
    {
      id: 'vote',
      image: '/vote-clickable.avif',
      hover: '/vote-hover.avif',
      click: '/vote-active.avif',
      inactive: '/vote-inert.avif',
    },
  ],
  display: {
    fullsize: '/display.avif',
    mobilesize: '/displayMobile.avif',
    BG: '/displayBG.avif',
    mobileBG: '/displayMobileBG.avif',
  },
};
