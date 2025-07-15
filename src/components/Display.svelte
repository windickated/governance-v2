<script lang="ts">
  import { displayScreen } from "../data/buttons.ts";
  import { episode, selectedOption } from "../stores/storyNode.ts";
  import { selectedNFTs } from "../stores/NFTs.ts";
  import vote from "../utils/vote.ts";
  import { userProvider } from "../stores/auth";

  // export let handlePopUpMessage: Function;

  // Format button
  let formatButtonState: boolean = true; // video on, text off
  let formatButtonHover: boolean = false;
  const switcherHandle = (event: Event) => {
    const storyText: HTMLDivElement | null = document.querySelector(".text");
    const storyVideo: HTMLIFrameElement | null =
      document.querySelector(".video");
    if (event.type === "click") {
      if ($episode === -1) {
        // handlePopUpMessage(
        //   event as PointerEvent,
        //   "There is no episode selected!"
        // );
        return;
      }
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
        $userProvider!.getNetwork().then((network) => {
          const baseNetwork: number = 8453;
          console.log(network);
          if (Number(network.chainId) === baseNetwork) {
            voteButtonState = !voteButtonState;
            setTimeout(() => {
              voteButtonState = !voteButtonState;
              vote();
            }, 300);
          }
          // else
          //   handlePopUpMessage(
          //     event as PointerEvent,
          //     "Please select Base network!"
          //   );
        });
      } else if (event.type === "pointerover" || event.type === "pointerout") {
        voteButtonHover = !voteButtonHover;
      }
    }
  };
</script>

<section>
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div>
    <span
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
    </span>
    <span
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
    </span>
  </div>

  <picture>
    <source
      srcset={displayScreen.display.mobilesize}
      media="(max-width: 768px)"
    />
    <img src={displayScreen.display.fullsize} alt="Display" />
  </picture>

  <picture class="display-bg">
    <source
      srcset={displayScreen.display.mobileBG}
      media="(max-width: 768px)"
    />
    <img src={displayScreen.display.BG} alt="Background" />
  </picture>
</section>

<style lang="scss">
  @use "/src/styles/mixins" as *;

  section {
    position: relative;
    width: 100%;
    max-width: min(95%, 80rem);

    picture {
      width: 100%;

      &.display-bg {
        z-index: -10;
        position: absolute;
        inset: 0;
      }
    }

    div {
      z-index: 10;
      position: absolute;
      width: 27.5%;
      bottom: 0;
      right: 0;
      background-image: url("/format.avif");
      background-position: top;
      background-size: contain;

      span {
        img {
          &.format-btn,
          &.vote-btn {
            display: none;
            cursor: pointer;
          }

          &.visible {
            display: block;
          }
        }
      }
    }
  }

  // @media screen and (max-width: 600px) {
  //   .format-btn,
  //   .vote-btn {
  //     display: none !important;
  //   }
  // }
</style>
