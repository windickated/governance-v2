<script lang="ts">
  import { onMount } from 'svelte';
  import { consolePanel } from '@constants/buttons';
  import { storyNodes, episode, selectedOption } from '@stores/storyNode';
  import { toastStore } from '@stores/toast.svelte';

  let touchscreenDevice: boolean = false;
  onMount(() => {
    if ('ontouchstart' in document.documentElement) {
      touchscreenDevice = true;
    }
  });

  const consoleButtonsHandle = (
    event: Event,
    id: string,
    isClicked: boolean = false,
  ) => {
    const button: Nullable<HTMLElement> = document.getElementById(id);
    const buttonHover: Nullable<HTMLElement> = document.getElementById(
      `${id}-hover`,
    );
    const buttonActive: Nullable<HTMLElement> = document.getElementById(
      `${id}-active`,
    );
    if (!touchscreenDevice) {
      if (event.type === 'click') {
        button!.style.display = 'none';
        buttonHover!.style.display = 'none';
        buttonActive!.style.display = 'block';
      } else if (event.type === 'mouseover' && !isClicked) {
        button!.style.display = 'none';
        buttonHover!.style.display = 'block';
        buttonActive!.style.display = 'none';
      } else if (isClicked) {
        clickHandle(id, button, buttonActive);
      } else if (event.type === 'mouseout') {
        button!.style.display = 'block';
        buttonHover!.style.display = 'none';
        buttonActive!.style.display = 'none';
      }
    } else {
      if (event.type === 'touchstart') clickHandle(id, button, buttonActive);
    }

    function clickHandle(
      id: string,
      button: HTMLElement | null,
      buttonActive: HTMLElement | null,
    ) {
      button!.style.display = 'none';
      buttonActive!.style.display = 'block';
      setTimeout(() => {
        button!.style.display = 'block';
        buttonActive!.style.display = 'none';
        switch (id) {
          case 'sagaverse':
            window.open(
              'https://sagaverse.degenerousdao.com',
              !touchscreenDevice ? '_blank' : '_self',
            );
            break;
          case 'conexus':
            window.open(
              'https://conexus.degenerousdao.com',
              !touchscreenDevice ? '_blank' : '_self',
            );
            break;
          case 'omnihub':
            window.open(
              'https://conexus.degenerousdao.com/dashboard',
              !touchscreenDevice ? '_blank' : '_self',
            );
            break;
          case 'back':
            if ($episode === -1) {
              toastStore.show('There is no episode selected!', 'error');
            } else if ($episode === 0) {
              toastStore.show(
                'You selected the first episode of this season.',
                'error',
              );
            } else {
              $episode--;
              if ($selectedOption) $selectedOption = null;
            }
            break;
          case 'forward':
            if ($episode === -1) {
              toastStore.show('There is no episode selected!', 'error');
            } else if ($episode === $storyNodes.length - 1) {
              toastStore.show(
                'You selected the last episode of this season.',
                'error',
              );
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

<section class:fixed={$episode === -1}>
  <div class="flex-row">
    {#each consolePanel.buttons as button}
      <!-- svelte-ignore a11y-click-events-have-key-events
        a11y-no-noninteractive-element-interactions
        a11y-mouse-events-have-key-events -->
      <button class="void-btn">
        <img
          onmouseover={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          ontouchstart={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          class="visible"
          id={button.id}
          src={button.image}
          alt={button.id}
          draggable="false"
        />
        <img
          onclick={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          onmouseout={() => {
            consoleButtonsHandle(event as Event, button.id);
          }}
          id="{button.id}-hover"
          src={button.hover}
          alt={button.id}
          draggable="false"
        />
        <img
          onmouseover={() => {
            consoleButtonsHandle(event as Event, button.id, true);
          }}
          id="{button.id}-active"
          src={button.click}
          alt={button.id}
          draggable="false"
        />
      </button>
    {/each}
  </div>

  <picture class="flex">
    <source
      srcset={consolePanel.console.mobilesize}
      media="(max-width: 1024px)"
    />
    <img src={consolePanel.console.fullsize} alt="Console" />
  </picture>
</section>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  section {
    position: relative;
    margin-top: 2.5rem;

    &.fixed {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
    }

    div {
      z-index: 10;
      position: absolute;
      gap: 0;
      bottom: 0;
      width: 100%;

      button {
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
    }

    @include respond-up(small-desktop) {
      &.fixed {
        position: relative;
        bottom: unset;
        left: unset;
        right: unset;
      }

      div {
        padding-inline: 10%;
      }
    }
  }
</style>
