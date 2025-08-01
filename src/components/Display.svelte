<script lang="ts">
  import { displayScreen } from 'src/constants/buttons';
  import {
    storyNodes,
    story,
    episode,
    selectedOption,
    votingResults,
  } from '@stores/storyNode';
  import { selectedNFTs } from '@stores/NFTs';
  import { userProvider } from '@stores/auth.svelte';
  import { toastStore } from '@stores/toast.svelte';
  import { activeTab } from '@stores/modal.svelte';
  import vote from '@utils/vote';

  import SelectorSVG from '@components/icons/Selector.svelte';

  let storyVideo = $state<Nullable<HTMLIFrameElement>>(null);
  let storyText = $state<Nullable<HTMLElement>>(null);

  function selectOption(
    optionID: number,
    optionClass: string | undefined = undefined,
  ) {
    let classMatch: boolean = true;
    if ($selectedOption === optionID) return;

    if ($storyNodes[$episode].ended) {
      toastStore.show('Voting period for this episode is ended', 'error');
      return;
    }
    if ($selectedNFTs.length === 0) {
      toastStore.show('Select any Potential to vote', 'error');
      activeTab.set('nfts');
      return;
    }
    if (optionClass) {
      $selectedNFTs.forEach((nft) => {
        if (optionClass != nft.class && nft.class != 'Ne-Yon')
          classMatch = false;
      });
    }
    if (!classMatch) {
      toastStore.show(
        `This option is only for the ${optionClass} class`,
        'error',
      );
      return;
    }
    $selectedOption = optionID;
  }

  // Format button
  let formatButtonState = $state<boolean>(true); // video on, text off
  let formatButtonHover = $state<boolean>(false);
  const switcherHandle = (event: Event) => {
    if (event.type === 'click') {
      if ($episode === -1) {
        toastStore.show('There is no episode selected!', 'error');
        return;
      }
      formatButtonState = !formatButtonState;
      storyText?.classList.toggle('visible');
      storyVideo?.classList.toggle('visible');
    } else if (event.type === 'pointerover' || event.type === 'pointerout') {
      formatButtonHover = !formatButtonHover;
    }
  };

  // Vote button
  let voteIsInactive = $derived(
    $selectedOption && $selectedNFTs.length > 0 ? false : true,
  ); // TRUE prohibits voting
  let voteButtonState = $state<boolean>(true);
  let voteButtonHover = $state<boolean>(false);

  const voteButtonHandle = (event: Event) => {
    if (!voteIsInactive && voteButtonState) {
      if (event.type === 'click') {
        $userProvider!.getNetwork().then((network) => {
          const baseNetwork: number = 8453;
          if (Number(network.chainId) === baseNetwork) {
            voteButtonState = !voteButtonState;
            setTimeout(() => {
              voteButtonState = !voteButtonState;
              vote();
            }, 300);
          } else toastStore.show('Please select Base network!', 'error');
        });
      } else if (event.type === 'pointerover' || event.type === 'pointerout') {
        voteButtonHover = !voteButtonHover;
      }
    }
  };
</script>

<section>
  {#if $story}
    <div class="content">
      <iframe
        class="visible"
        bind:this={storyVideo}
        src={$story.season
          ? `https://www.youtube.com/embed/${$story.video_url}`
          : $story.video_url}
        title="YouTube"
        allowfullscreen
      ></iframe>

      <article bind:this={storyText}>
        {$story.description}
      </article>
    </div>

    <ul class="flex pad horiz-scrollbar">
      {#each $story.votes_options as option, index}
        <button
          class="void-btn flex-row"
          class:selected={$selectedOption == index + 1}
          onclick={() => selectOption(index + 1, option.class)}
        >
          {#if option.class}
            <img src="/icons/{option.class}.png" alt="Selector" />
          {:else}
            <SelectorSVG
              focused={$selectedOption == index + 1}
              glowing={$selectedOption == index + 1}
              disabled={false}
            />
          {/if}
          {#if $votingResults}
            ({$votingResults.results[index].votes})
          {/if}
          {option.option}
        </button>
      {/each}
    </ul>
  {:else}
    <div class="open-episodes-wrapper content fade-in">
      <h5>There is no episode selected</h5>
      <button class="blur" onclick={() => activeTab.set('episodes')}>
        Open Episodes Tab
      </button>
    </div>
  {/if}

  <span>
    <button
      class="void-btn format"
      onclick={switcherHandle}
      onpointerover={switcherHandle}
      onpointerout={switcherHandle}
    >
      <img
        class:visible={!formatButtonHover && formatButtonState}
        src={displayScreen.buttons[0].video}
        alt="Switcher"
        draggable="false"
      />
      <img
        class:visible={!formatButtonHover && !formatButtonState}
        src={displayScreen.buttons[0].text}
        alt="Switcher"
        draggable="false"
      />
      <img
        class:visible={formatButtonHover && !formatButtonState}
        src={displayScreen.buttons[0].videoHover}
        alt="Switcher"
        draggable="false"
      />
      <img
        class:visible={formatButtonHover && formatButtonState}
        src={displayScreen.buttons[0].textHover}
        alt="Switcher"
        draggable="false"
      />
    </button>

    <button
      class="void-btn vote"
      onclick={voteButtonHandle}
      onpointerover={voteButtonHandle}
      onpointerout={voteButtonHandle}
    >
      <img
        class:visible={!voteIsInactive && !voteButtonHover && voteButtonState}
        src={displayScreen.buttons[1].image}
        alt="Vote"
        draggable="false"
      />
      <img
        class:visible={!voteIsInactive && voteButtonState && voteButtonHover}
        src={displayScreen.buttons[1].hover}
        alt="Vote"
        draggable="false"
      />
      <img
        class:visible={!voteIsInactive && !voteButtonState}
        src={displayScreen.buttons[1].click}
        alt="Vote"
        draggable="false"
      />
      <img
        class:visible={voteIsInactive}
        src={displayScreen.buttons[1].inactive}
        alt="Vote"
        draggable="false"
      />
    </button>
  </span>

  <picture>
    <source
      srcset={displayScreen.display.mobilesize}
      media="(max-width: 1023px)"
    />
    <img src={displayScreen.display.fullsize} alt="Display" />
  </picture>

  <picture class="display-bg">
    <source
      srcset={displayScreen.display.mobileBG}
      media="(max-width: 1023px)"
    />
    <img src={displayScreen.display.BG} alt="Background" />
  </picture>
</section>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  section {
    position: relative;
    width: 100%;
    max-width: min(95%, 80rem);

    .open-episodes-wrapper {
      display: none;
      padding-top: 1rem;

      button {
        margin-inline: auto;
        margin-top: 1rem;
      }

      @include respond-up(small-desktop) {
        display: block;
      }
    }

    .content {
      position: absolute;
      top: 12.4%;
      padding-inline: 5.4%;
      width: 100%;

      @include respond-up(small-desktop) {
        top: 8.5%;
      }

      iframe,
      article {
        width: 100%;
        aspect-ratio: 16 / 9;
        border: none;
        display: none;
      }

      .visible {
        display: block;
      }

      article {
        overflow-y: scroll;
        white-space: pre-wrap;
        text-align: left;
        padding: 1rem 2rem;
        @include white-txt(soft);
        @include text-shadow;
        @include font(h5);
      }
    }

    ul {
      display: none;
      align-items: flex-start;
      justify-content: space-around;
      position: absolute;
      bottom: 5.9%;
      left: 5.4%;
      width: 65.5%;
      height: 28.5%;
      white-space: nowrap;
      padding-left: 2rem;
      gap: 0.25rem;
      clip-path: polygon(
        7.75% 0%,
        91.25% 0%,
        100% 11.25%,
        100% 88.5%,
        91.25% 100%,
        8% 100%,
        0% 89.5%,
        0% 10.5%
      );
      overflow-y: hidden;

      @include respond-up(small-desktop) {
        display: flex;
      }

      button {
        fill: $white;
        stroke: $white;
        gap: 0.5rem;
        @include white-txt;
        @include font(h4);

        &:hover,
        &:active {
          fill: $light-blue;
          stroke: $light-blue;
          @include light-blue(1, text);
          @include bright;
        }

        img {
          width: 2rem;
        }

        &.selected {
          fill: $cyan;
          stroke: $cyan;
          @include cyan(1, text);
        }
      }
    }

    picture {
      width: 100%;

      &.display-bg {
        z-index: -10;
        position: absolute;
        inset: 0;
      }
    }

    span {
      z-index: 10;
      position: absolute;
      width: 27.5%;
      bottom: 0;
      right: 0;
      background-image: url('/display/format.avif');
      background-position: top;
      background-size: contain;

      button {
        img {
          display: none;
          cursor: pointer;

          &.visible {
            display: block;
          }
        }
      }
    }
  }

  // Only for mobiles
  @media screen and (max-width: 1023px) {
    .format,
    .vote {
      display: none !important;
    }
  }
</style>
