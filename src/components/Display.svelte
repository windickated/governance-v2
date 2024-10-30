<script lang="ts">
  import { displayScreen } from "../data/buttons.ts";
  import { selectedOption } from "../stores/storyNode.ts";
  import { selectedNFTs } from "../stores/NFTs.ts";
  import vote from "../utils/vote.ts";

  // Format button
  let formatButtonState: boolean = true; // video on, text off
  let formatButtonHover: boolean = false;
  const switcherHandle = (event: Event) => {
    const storyText: HTMLDivElement | null = document.querySelector(".text");
    const storyVideo: HTMLIFrameElement | null =
      document.querySelector(".video");
    if (event.type === "click") {
      formatButtonState = !formatButtonState;
      storyText?.classList.toggle("visible");
      storyVideo?.classList.toggle("visible");
    } else if (event.type === "pointerover" || event.type === "pointerout") {
      formatButtonHover = !formatButtonHover;
    }
  };

  // Vote button
  $: voteIsInactive =
    $selectedOption && $selectedNFTs.length > 0 ? false : true; // TRUE prohibits voting
  let voteButtonState: boolean = true;
  let voteButtonHover: boolean = false;

  const voteButtonHandle = (event: Event) => {
    if (!voteIsInactive && voteButtonState) {
      if (event.type === "click") {
        voteButtonState = !voteButtonState;
        vote();
      } else if (event.type === "pointerover" || event.type === "pointerout") {
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
      on:pointerover={switcherHandle}
      on:pointerout={switcherHandle}
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
      on:click={voteButtonHandle}
      on:pointerover={voteButtonHandle}
      on:pointerout={voteButtonHandle}
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
