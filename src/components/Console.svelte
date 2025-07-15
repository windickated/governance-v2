<script lang="ts">
  import { onMount } from "svelte";
  import { consolePanel } from "../data/buttons.ts";
  import { storyNodes, episode, selectedOption } from "../stores/storyNode.ts";

  // export let handlePopUpMessage: Function;

  let touchscreenDevice: boolean = false;
  onMount(() => {
    if ("ontouchstart" in document.documentElement) {
      touchscreenDevice = true;
    }
  });

  let width: number;
  let consoleBar: HTMLElement;

  const consoleButtonsHandle = (
    event: Event,
    id: string,
    isClicked: boolean = false
  ) => {
    const button: HTMLElement | null = document.getElementById(id);
    const buttonHover: HTMLElement | null = document.getElementById(
      `${id}-hover`
    );
    const buttonActive: HTMLElement | null = document.getElementById(
      `${id}-active`
    );
    if (!touchscreenDevice) {
      if (event.type === "click") {
        button!.style.display = "none";
        buttonHover!.style.display = "none";
        buttonActive!.style.display = "block";
      } else if (event.type === "mouseover" && !isClicked) {
        button!.style.display = "none";
        buttonHover!.style.display = "block";
        buttonActive!.style.display = "none";
      } else if (isClicked) {
        clickHandle(id, button, buttonActive);
      } else if (event.type === "mouseout") {
        button!.style.display = "block";
        buttonHover!.style.display = "none";
        buttonActive!.style.display = "none";
      }
    } else {
      if (event.type === "touchstart") clickHandle(id, button, buttonActive);
    }

    function clickHandle(
      id: string,
      button: HTMLElement | null,
      buttonActive: HTMLElement | null
    ) {
      button!.style.display = "none";
      buttonActive!.style.display = "block";
      setTimeout(() => {
        button!.style.display = "block";
        buttonActive!.style.display = "none";
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
          case "omnihub":
            window.open(
              "https://conexus.degenerousdao.com/dashboard",
              !touchscreenDevice ? "_blank" : "_self"
            );
            break;
          case "back":
            if ($episode === -1) {
              // handlePopUpMessage(
              //   event as PointerEvent,
              //   "There is no episode selected!"
              // );
            } else if ($episode === 0) {
              // handlePopUpMessage(
              //   event as PointerEvent,
              //   "You selected the first episode of this season."
              // );
            } else {
              $episode--;
              if ($selectedOption) $selectedOption = null;
            }
            break;
          case "forward":
            if ($episode === -1) {
              // handlePopUpMessage(
              //   event as PointerEvent,
              //   "There is no episode selected!"
              // );
            } else if ($episode === $storyNodes.length - 1) {
              // handlePopUpMessage(
              //   event as PointerEvent,
              //   "You selected the last episode of this season."
              // );
            } else {
              $episode++;
              if ($selectedOption) $selectedOption = null;
            }
            break;
        }
      }, 150);
    }
  };
</script>

<svelte:window bind:outerWidth={width} />

<section bind:this={consoleBar}>
  <div class="flex-row">
    {#each consolePanel.buttons as button}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <span class="{button.id} {button.size}" role="button" tabindex="0">
        <img
          on:mouseover={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          on:touchstart={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          class="visible"
          id={button.id}
          src={button.image}
          alt={button.id}
          draggable="false"
        />
        <img
          on:click={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          on:mouseout={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          id="{button.id}-hover"
          src={button.hover}
          alt={button.id}
          draggable="false"
        />
        <img
          on:mouseover={() => {
            consoleButtonsHandle(event as Event, button.id, true);
          }}
          id="{button.id}-active"
          src={button.click}
          alt={button.id}
          draggable="false"
        />
      </span>
    {/each}
  </div>

  <picture class="flex">
    <source
      srcset={consolePanel.console.mobilesize}
      media="(max-width: 768px)"
    />
    <img src={consolePanel.console.fullsize} alt="Console" />
  </picture>
</section>

<style lang="scss">
  @use "/src/styles/mixins" as *;

  section {
    position: fixed;
    bottom: 0;

    div {
      z-index: 10;
      position: absolute;
      gap: 0;
      bottom: 0;
      width: 100%;

      img {
        display: none;
        cursor: pointer;
        width: 100%;
        height: 100%;

        &.visible {
          display: block;
        }
      }
    }

    @include respond-up(tablet) {
      position: relative;
      margin-top: 2.5rem;

      div {
        padding-inline: 10%;
      }
    }
  }
</style>
