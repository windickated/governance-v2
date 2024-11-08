<script lang="ts">
  import { onMount } from "svelte";
  import {
    story,
    type StoryNode,
    season,
    episode,
    selectedOption,
  } from "../stores/storyNode.ts";
  import { selectedNFTs } from "../stores/NFTs.ts";
  import handleOptions from "../utils/options.ts";
  import vote from "../utils/vote.ts";
  import handleNftTiles from "../utils/nftTiles.ts";

  export let storyNodes: StoryNode[];
  export let handlePopUpMessage: Function;

  let width: number;
  let mobileTextVisibility: boolean = false;
  $: optionsCounter = $story ? $story.votes_options.length : 0;

  onMount(() => {
    if (width > 600) mobileTextVisibility = true;
  });

  $: if (storyNodes) {
    if ($episode !== -1) {
      $story = storyNodes[$episode];
    } else {
      $story = null;
    }
    $selectedNFTs = [];
    Array.from(document.querySelectorAll(".nft")).forEach((div: Node) => {
      const nftTile = div as HTMLDivElement;
      handleNftTiles.blur(nftTile);
    });
  }

  function selectOption(event: Event) {
    const target = event.target as HTMLDivElement;
    const optionContainer =
      target.localName === "div"
        ? target
        : (target.parentElement as HTMLDivElement);
    const optionSelector = optionContainer?.children[0] as HTMLImageElement;
    const optionID = Number(optionContainer?.id);
    let classMatch: boolean = true;
    if ($selectedOption === optionID) return;

    if (event.type === "pointerover")
      handleOptions.focus(optionContainer, optionSelector);
    if (event.type === "pointerout")
      handleOptions.blur(optionContainer, optionSelector);
    if (event.type === "click") {
      if (storyNodes[$episode].ended) {
        handlePopUpMessage(
          event as PointerEvent,
          "Voting period for this episode is ended."
        );
        return;
      }
      if ($selectedNFTs.length === 0) {
        handlePopUpMessage(
          event as PointerEvent,
          "Select any Potential to vote!"
        );
        return;
      }
      if (optionContainer.dataset.class) {
        $selectedNFTs.forEach((nft) => {
          if (
            optionContainer.dataset.class != nft.class &&
            nft.class != "Ne-Yon"
          )
            classMatch = false;
        });
      }
      if (!classMatch) {
        handlePopUpMessage(
          event as PointerEvent,
          `This option is only for the ${optionContainer.dataset.class} class!`
        );
        return;
      }
      handleOptions.reset(optionID);
    }

    if (width < 600 && $selectedOption && $selectedNFTs.length > 0) vote();
  }
</script>

<svelte:window bind:innerWidth={width} />

<section class="story-node-wraper">
  <div class="legend blur">
    {#if $story}
      <h1 class="header">
        {$story.episodeName}
      </h1>
      <h1 class="season-episode-number">
        The Dischordian Saga: Season {$season} - Episode {$episode + 1}
      </h1>
      <h2 class="duration">{$story.duration}</h2>
    {:else}
      <h1 class="empty-header">Loading episodes...</h1>
    {/if}
  </div>

  {#if $story}
    <iframe
      src={$story.video_url}
      class="video visible"
      title="YouTube"
      allowfullscreen
    ></iframe>

    <div class="text">
      {#if width <= 600}
        <button
          class="story-text-visibility"
          on:click={() => {
            mobileTextVisibility = !mobileTextVisibility;
          }}
          style={mobileTextVisibility
            ? "border-bottom: 0.1vw solid rgba(51, 226, 230, 0.5)"
            : ""}
        >
          {(mobileTextVisibility ? "Hide" : "Show") + " story text"}
          <img
            style={mobileTextVisibility ? "transform: rotate(180deg)" : ""}
            src="/dropdown.png"
            alt={mobileTextVisibility ? "Hide" : "Show"}
          />
        </button>
        {#if mobileTextVisibility}
          <div class="text-wrapper">
            {$story.description}
          </div>
        {/if}
      {:else}
        {$story.description}
      {/if}
    </div>

    <div
      class="options"
      style="
        font-size: {width > 600 && optionsCounter >= 5
        ? `${10 / optionsCounter}vw`
        : '2.5vw'}
      "
    >
      {#key $episode}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        {#each $story.votes_options as option, index}
          <div
            class="option"
            role="button"
            tabindex="0"
            id={(index + 1).toString()}
            data-class=""
            on:pointerover={selectOption}
            on:pointerout={selectOption}
            on:click={selectOption}
          >
            <img
              class="option-selector"
              src={"/option-selector.png"}
              alt="selector"
              style="
                height: {width > 600 &&
                (optionsCounter >= 5 ? `${15 / optionsCounter}vw` : '3vw')}
              "
            />
            <!-- src={option.class
                ? `/${option.class}.png`
                : "/option-selector.png"} -->
            {option.option}
          </div>
        {/each}
      {/key}
    </div>

    <span
      class="voting-ended {storyNodes[$episode].ended ? '' : 'voting-active'}"
    >
      {storyNodes[$episode].ended ? "Voting ended" : "Voting active"}
    </span>
  {/if}
</section>

<style>
  .story-node-wraper {
    width: 90vw;
    margin-inline: 5vw;
  }

  .video {
    position: absolute;
    height: 47.25vw;
    width: 84.5vw;
    top: 10.25vw;
    left: 7.75vw;
    display: none;
  }

  .legend {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(22, 30, 95, 0.75);
    filter: drop-shadow(0 0 1vw rgb(1, 0, 32));
    margin-top: 2vw;
    margin-bottom: -4vw;
    padding: 1.5vw;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 2.5vw;
  }

  .empty-header {
    font-size: 3.5vw;
    text-align: center;
    padding: 1vw 0;
    color: #33e2e6;
    opacity: 0.5;
  }

  .header,
  .season-episode-number {
    font-size: 3vw;
    text-align: center;
    -webkit-text-stroke: 0.03vw #33e2e6;
    filter: drop-shadow(0 0 0.1vw #33e2e6);
    line-height: 5vw;
  }

  .season-episode-number {
    font-size: 2.5vw;
    margin-bottom: 2vw;
    opacity: 0.75;
  }

  .duration {
    font-size: 2vw;
    text-align: center;
    -webkit-text-stroke: 0.03vw #33e2e6;
    filter: drop-shadow(0 0 0.1vw #33e2e6);
    color: #bebebe;
  }

  .text {
    position: absolute;
    top: 10.4vw;
    width: 80vw;
    left: 8vw;
    overflow-y: scroll;
    height: 43vw;
    font-size: 2vw;
    line-height: 3vw;
    margin-bottom: auto;
    padding: 2vw;
    background-color: none;
    backdrop-filter: none;
    border: none;
    border-radius: auto;
    color: #bebebe;
    display: none;
    white-space: pre-wrap;
  }

  .story-text-visibility {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 12.5vw;
    padding: 0 4vw;
    font-size: 1.1em;
    color: rgba(51, 226, 230, 0.5);
    -webkit-text-stroke: 0.25vw rgba(51, 226, 230, 0.25);
    background-color: rgba(1, 0, 32, 0.75);
    outline: none;
    border: none;
  }

  .story-text-visibility:hover,
  .story-text-visibility:active {
    transform: none;
    filter: none;
  }

  .story-text-visibility > img {
    width: 5%;
    opacity: 0.5;
  }

  .visible {
    display: block;
  }

  .text::-webkit-scrollbar {
    width: 0.3vw;
    border: none;
  }

  .text::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .text::-webkit-scrollbar-thumb {
    background-color: rgba(51, 226, 230, 0.5);
    border-radius: 0.5vw;
  }

  .options {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-around;
    position: absolute;
    top: 59vw;
    width: 59vw;
    height: 23.25vw;
    white-space: nowrap;
    margin: 2vw;
    margin-left: 2.75vw;
    margin-bottom: auto;
    padding: 1vw 0 1vw 3vw;
    font-size: 1.1em;
    line-height: 2em;
    overflow-y: hidden;
    background-color: none;
    backdrop-filter: none;
    border: none;
    border-radius: none;
  }

  .options::-webkit-scrollbar {
    height: 0.5vw;
  }

  .options::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0);
  }

  .options::-webkit-scrollbar-thumb {
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0),
      rgba(51, 226, 230, 0.5),
      rgba(0, 0, 0, 0)
    );
    border-radius: 0.5vw;
  }

  .option {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 1vw;
    color: inherit;
    -webkit-text-stroke: 0.01vw #33e2e6;
    background-color: rgba(0, 0, 0, 0);
    border: none;
    cursor: pointer;
  }

  .option-selector {
    height: 3vw;
    width: auto;
    background-image: url("/option-selector.png");
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    opacity: 0.9;
  }

  .voting-ended {
    display: block;
    margin-inline: auto;
    margin-top: 8vw;
    margin-bottom: -4vw;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    font-size: 3vw;
    filter: drop-shadow(0 0 1vw 5vw #33e2e6);
    -webkit-text-stroke: 0.2vw rgba(255, 0, 0, 0.1);
  }

  .voting-active {
    color: rgba(51, 226, 230, 0.8);
    -webkit-text-stroke: 0.2vw rgba(0, 255, 0, 0.1);
  }

  @media screen and (max-width: 600px) {
    .video {
      top: 25.5vw;
      display: block;
    }

    .legend {
      margin-bottom: 0.5em;
      padding: 1em 0.75em;
    }

    .empty-header {
      font-size: 1.2em;
    }

    .header,
    .season-episode-number {
      font-size: 1.2em;
      line-height: 1.6em;
      margin-bottom: 0.5em;
    }

    .season-episode-number {
      font-size: 1em;
    }

    .duration {
      font-size: 1em;
      opacity: 0.75;
    }

    .text {
      position: static;
      top: auto;
      width: auto;
      left: auto;
      overflow-y: auto;
      overflow-x: hidden;
      height: auto;
      font-size: 1em;
      line-height: 1.75em;
      margin-bottom: 2vw;
      background-color: rgba(22, 30, 95, 0.75);
      filter: drop-shadow(0 0 1vw rgb(1, 0, 32));
      border: 0.1vw solid rgba(51, 226, 230, 0.5);
      border-radius: 2.5vw;
      padding: 0;
      display: block;
    }

    .text-wrapper {
      padding-inline: 1em;
      padding-block: 0;
    }

    .options {
      position: static;
      top: auto;
      width: 91vw;
      height: auto;
      font-size: 1.1em !important;
      white-space: wrap !important;
      margin-left: -2vw;
      margin-bottom: 4vw;
      padding-top: 2vw;
      background-color: rgba(1, 0, 32, 0.85);
      border: 0.1vw solid rgba(51, 226, 230, 0.5);
      border-radius: 2.5vw;
      padding-top: 2vw;
      padding-bottom: 2vw;
    }

    .option {
      gap: 0.75em;
      margin-bottom: 0.5em;
      padding-right: 0.5em;
    }

    .option:last-child {
      margin-bottom: 0;
    }

    .option-selector {
      height: 1.5em;
    }

    .voting-ended {
      font-size: 1.2em;
      margin-top: 0;
      margin-bottom: 0;
    }
  }
</style>
