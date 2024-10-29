<script lang="ts">
  import { afterUpdate } from "svelte";
  import { _season, _episode, _option } from "../stores/storyNode";
  import { _potentials, _inactivePotentials } from "../stores/selectedNFTs";

  import { contract } from "../lib/contract";

  afterUpdate(() => {
    const storyText: HTMLDivElement = document.querySelector(".text");
    const storyVideo: HTMLIFrameElement = document.querySelector(".video");
    if (
      nodeNumber &&
      !storyText.className.match("visible") &&
      !storyVideo.className.match("visible")
    ) {
      storyText.classList.toggle("visible");
    }
  });

  let seasonNumber: number;
  let nodeNumber: number;
  let selectedOption: number;

  _season.subscribe((number) => {
    seasonNumber = number;
  });
  _episode.subscribe((number) => {
    nodeNumber = number;
  });
  _option.subscribe((number) => {
    selectedOption = number;
  });

  let selectedNFTs: Array<any>;
  let inactiveNFTs: Array<any>;
  _potentials.subscribe((array) => (selectedNFTs = array));
  _inactivePotentials.subscribe((array) => (inactiveNFTs = array));

  const displayScreen = {
    buttons: [
      {
        id: "switcher",
        video: "/video.avif",
        text: "/text.avif",
        videoHover: "/video-hover.avif",
        textHover: "/text-hover.avif",
      },
      {
        id: "vote",
        image: "/vote-clickable.avif",
        hover: "/vote-hover.avif",
        click: "/vote-active.avif",
        inactive: "/vote-inert.avif",
      },
    ],
    display: {
      fullsize: "/display.avif",
      mobilesize: "/displayMobile.avif",
      BG: "/displayBG.avif",
      mobileBG: "/displayMobileBG.avif",
    },
  };

  // Format button
  let formatButtonState: boolean = true; // video on, text off
  let formatButtonHover: boolean = false;
  const switcherHandle = (event: Event) => {
    const storyText: HTMLDivElement = document.querySelector(".text");
    const storyVideo: HTMLIFrameElement = document.querySelector(".video");
    if (event.type === "click") {
      if (nodeNumber) {
        formatButtonState = !formatButtonState;
        storyText.classList.toggle("visible");
        storyVideo.classList.toggle("visible");
      }
    } else if (event.type === "mouseover" || event.type === "mouseout") {
      formatButtonHover = !formatButtonHover;
    }
  };

  // Vote button
  $: voteIsInactive = selectedOption != undefined ? false : true;
  let voteButtonState: boolean = true;
  let voteButtonHover: boolean = false;

  const voteHandle = (event: Event) => {
    if (!voteIsInactive && voteButtonState) {
      if (event.type === "click") {
        voteButtonState = !voteButtonState;

        setTimeout(async () => {
          voteButtonState = !voteButtonState;

          // vote function
          alert(
            "Season:" +
              seasonNumber +
              "\n" +
              "Episode:" +
              nodeNumber +
              "\n" +
              "Option:" +
              selectedOption
          ); //vote info
          console.log("Selected NFTs:", selectedNFTs); //vote info

          //voting contract
          if (selectedNFTs.length == 1) {
            const potentialNumber: number = selectedNFTs[0].name.slice(
              selectedNFTs[0].name.slice().length - 3
            );
            await (
              await contract()
            ).singleVote(nodeNumber, potentialNumber, selectedOption);
          } else {
            const potentialNumbers: number[] = [];
            selectedNFTs.map((nft) => {
              potentialNumbers.push(
                nft.name.slice(nft.name.slice().length - 3)
              );
            });
            const options: number[] = new Array(potentialNumbers.length).fill(
              selectedOption
            );
            await (
              await contract()
            ).batchVote(nodeNumber, potentialNumbers, options);
          }

          //inactive potentials with NO contract
          selectedNFTs.map((nft) => inactiveNFTs.push(nft));
          $_inactivePotentials = inactiveNFTs;

          $_potentials = [];
          $_option = undefined;

          console.log("Inactive NFTs:", inactiveNFTs); //used nfts
        }, 750);
      } else if (event.type === "mouseover" || event.type === "mouseout") {
        voteButtonHover = !voteButtonHover;
      }
    }
  };
</script>

<div class="display-screen">
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div class="display-buttons">
    <div
      class="format"
      role="button"
      tabindex="0"
      on:click={switcherHandle}
      on:mouseover={switcherHandle}
      on:mouseout={switcherHandle}
    >
      <img
        class="format-btn {!formatButtonHover
          ? formatButtonState
            ? 'visible'
            : ''
          : ''}"
        src={displayScreen.buttons[0].video}
        alt="Switcher"
        draggable="false"
      />
      <img
        class="format-btn {!formatButtonHover
          ? !formatButtonState
            ? 'visible'
            : ''
          : ''}"
        src={displayScreen.buttons[0].text}
        alt="Switcher"
        draggable="false"
      />
      <img
        class="format-btn {!formatButtonState
          ? formatButtonHover
            ? 'visible'
            : ''
          : ''}"
        src={displayScreen.buttons[0].videoHover}
        alt="Switcher"
        draggable="false"
      />
      <img
        class="format-btn {formatButtonState
          ? formatButtonHover
            ? 'visible'
            : ''
          : ''}"
        src={displayScreen.buttons[0].textHover}
        alt="Switcher"
        draggable="false"
      />
    </div>
    <div
      class="vote"
      role="button"
      tabindex="0"
      on:click={voteHandle}
      on:mouseover={voteHandle}
      on:mouseout={voteHandle}
    >
      <img
        class="vote-btn {!voteIsInactive
          ? !voteButtonHover
            ? voteButtonState
              ? 'visible'
              : ''
            : ''
          : ''}"
        src={displayScreen.buttons[1].image}
        alt="Vote"
        draggable="false"
      />
      <img
        class="vote-btn {!voteIsInactive
          ? voteButtonState
            ? voteButtonHover
              ? 'visible'
              : ''
            : ''
          : ''}"
        src={displayScreen.buttons[1].hover}
        alt="Vote"
        draggable="false"
      />
      <img
        class="vote-btn {!voteIsInactive
          ? !voteButtonState
            ? 'visible'
            : ''
          : ''}"
        src={displayScreen.buttons[1].click}
        alt="Vote"
        draggable="false"
      />
      <img
        class="vote-btn {voteIsInactive ? 'visible' : ''}"
        src={displayScreen.buttons[1].inactive}
        alt="Vote"
        draggable="false"
      />
    </div>
  </div>
  <picture class="display">
    <source
      srcset={displayScreen.display.mobilesize}
      media="(max-width: 600px)"
    />
    <img src={displayScreen.display.fullsize} alt="Display" />
  </picture>
  <picture class="display-bg">
    <source
      srcset={displayScreen.display.mobileBG}
      media="(max-width: 600px)"
    />
    <img src={displayScreen.display.BG} alt="Background" />
  </picture>
</div>

<style>
  .display-screen {
    position: relative;
    width: 95vw;
    margin-inline: 2.5vw;
    margin-top: 2.5vw;
  }

  .display,
  .display-bg {
    height: auto;
  }

  .display-bg {
    z-index: -10;
    position: absolute;
    top: 0;
    left: 0;
  }

  .display-buttons {
    z-index: 10;
    position: absolute;
    width: 27.5%;
    bottom: 0;
    right: 0;
    background-image: url("/format.avif");
    background-position: top;
    background-size: contain;
  }

  .format-btn,
  .vote-btn {
    display: none;
    cursor: pointer;
  }

  .visible {
    display: block;
  }

  @media screen and (max-width: 600px) {
    .format-btn,
    .vote-btn {
      display: none !important;
    }
  }
</style>
