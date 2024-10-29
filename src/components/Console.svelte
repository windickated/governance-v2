<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import { _season, _episode, lastNodeNumber } from "../stores/storyNode";

  let touchscreenDevice: boolean = false;
  onMount(() => {
    if ("ontouchstart" in document.documentElement) {
      touchscreenDevice = true;
    }
  });

  let width: number;
  let consoleBar: HTMLDivElement;
  let seasonNumber: number;
  let nodeNumber: number;

  afterUpdate(() => {
    if (width <= 600) {
      if (!nodeNumber) {
        consoleBar.style.position = "fixed";
        consoleBar.style.bottom = "0";
      } else {
        consoleBar.style.position = "relative";
        consoleBar.style.bottom = "";
      }
    }
  });

  _season.subscribe((number) => {
    seasonNumber = number;
  });

  _episode.subscribe((number) => {
    nodeNumber = number;
  });

  interface ConsoleBtn {
    id: "conexus" | "back" | "omnihub" | "forward" | "sagaverse";
    image: string;
    hover: string;
    click: string;
    size: "big" | "small";
  }

  const consolePanel = {
    buttons: <ConsoleBtn[]>[
      {
        id: "conexus",
        image: "/conexus.avif",
        hover: "/conexus-hover.avif",
        click: "/conexus-active.avif",
        size: "big",
      },
      {
        id: "back",
        image: "/back.avif",
        hover: "/back-hover.avif",
        click: "/back-active.avif",
        size: "small",
      },
      {
        id: "omnihub",
        image: "/omnihub-inactive.avif", ///omnihub.avif
        hover: "/omnihub-hover.avif",
        click: "/omnihub-active.avif",
        size: "big",
      },
      {
        id: "forward",
        image: "/forward.avif",
        hover: "/forward-hover.avif",
        click: "/forward-active.avif",
        size: "small",
      },
      {
        id: "sagaverse",
        image: "/sagaverse.avif",
        hover: "/sagaverse-hover.avif",
        click: "/sagaverse-active.avif",
        size: "big",
      },
    ],
    console: {
      fullsize: "/console.avif",
      mobilesize: "/consoleMobile.avif",
    },
  };

  const consoleButtonsHandle = (
    event: Event,
    id: string,
    isClicked: boolean = false
  ) => {
    if (id != "omnihub") {
      //temporarily disabled Omnihub
      const button: HTMLElement = document.getElementById(id);
      const buttonHover: HTMLElement = document.getElementById(`${id}-hover`);
      const buttonActive: HTMLElement = document.getElementById(`${id}-active`);
      if (!touchscreenDevice) {
        if (event.type === "click") {
          button.style.display = "none";
          buttonHover.style.display = "none";
          buttonActive.style.display = "block";
        } else if (event.type === "mouseover" && !isClicked) {
          button.style.display = "none";
          buttonHover.style.display = "block";
          buttonActive.style.display = "none";
        } else if (isClicked) {
          clickHandle(id, button, buttonActive);
        } else if (event.type === "mouseout") {
          button.style.display = "block";
          buttonHover.style.display = "none";
          buttonActive.style.display = "none";
        }
      } else {
        if (event.type === "touchstart") clickHandle(id, button, buttonActive);
      }
    }

    function clickHandle(
      id: string,
      button: HTMLElement,
      buttonActive: HTMLElement
    ) {
      button.style.display = "none";
      buttonActive.style.display = "block";
      setTimeout(() => {
        button.style.display = "block";
        buttonActive.style.display = "none";
        switch (id) {
          case "sagaverse":
            window.open(
              "https://sagaverse.degenerousdao.com",
              !touchscreenDevice ? "_blank" : "_self"
            );
            break;
          case "conexus":
            window.open(
              "https://conexus.degenerousdao.com",
              !touchscreenDevice ? "_blank" : "_self"
            );
            break;
          case "back":
            if (nodeNumber) {
              if (nodeNumber != 1) nodeNumber--;
              $_episode = nodeNumber;
            }
            break;
          case "forward":
            if (nodeNumber) {
              if (nodeNumber != lastNodeNumber[seasonNumber - 1]) nodeNumber++;
              $_episode = nodeNumber;
            }
            break;
        }
      }, 150);
    }
  };
</script>

<svelte:window bind:outerWidth={width} />

<div class="console-panel" bind:this={consoleBar}>
  <div class="console-buttons">
    {#each consolePanel.buttons as button}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <div class="{button.id} {button.size}">
        <img
          on:mouseover={() => {
            consoleButtonsHandle(event, button.id);
          }}
          on:touchstart={() => {
            consoleButtonsHandle(event, button.id);
          }}
          class="console-btn visible"
          id={button.id}
          src={button.image}
          alt={button.id}
          draggable="false"
        />
        <img
          on:click={() => {
            consoleButtonsHandle(event, button.id);
          }}
          on:mouseout={() => {
            consoleButtonsHandle(event, button.id);
          }}
          class="console-btn"
          id="{button.id}-hover"
          src={button.hover}
          alt={button.id}
          draggable="false"
        />
        <img
          on:mouseover={() => {
            consoleButtonsHandle(event, button.id, true);
          }}
          class="console-btn"
          id="{button.id}-active"
          src={button.click}
          alt={button.id}
          draggable="false"
        />
      </div>
    {/each}
  </div>
  <picture class="console">
    <source
      srcset={consolePanel.console.mobilesize}
      media="(max-width: 600px)"
    />
    <img src={consolePanel.console.fullsize} alt="Console" />
  </picture>
</div>

<style>
  .console-panel {
    position: relative;
    margin-top: 5vw;
  }

  .console-buttons {
    z-index: 10;
    display: flex;
    justify-content: center;
    position: absolute;
    top: 0;
  }

  .console-btn {
    display: none;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .visible {
    display: block;
  }

  @media screen and (min-width: 600px) {
    .console-panel {
      margin-top: 8.5vw;
    }

    .big {
      width: 20%;
    }

    .small {
      width: 10%;
    }
  }
</style>
