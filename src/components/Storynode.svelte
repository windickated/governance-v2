<script lang="ts">
  import { onMount } from "svelte";
  import {
    storyNodes,
    story,
    season,
    episode,
    selectedOption,
    votingResults,
    checkingResults,
    abortVotingCheck,
  } from "../stores/storyNode.ts";
  import { selectedNFTs } from "../stores/NFTs.ts";
  import { walletAddress } from "../stores/auth.ts";
  import vote from "../utils/vote.ts";
  import checkVote from "../lib/voting.js";
  import { userProvider } from "../stores/auth";

  export let handlePopUpMessage: Function;

  let width: number;
  let mobileTextVisibility: boolean = false;
  $: optionsCounter = $story ? $story.votes_options.length : 0;

  onMount(() => {
    if (width > 600) mobileTextVisibility = true;
  });

  let votingCountdown: string = "";
  let interval: NodeJS.Timeout;
  $: if ($storyNodes.length > 0) {
    clearInterval(interval);
    votingCountdown = "0:00:00:00";
    if ($episode !== -1) {
      $story = $storyNodes[$episode];
      endSoon = false;
      if (!$story.ended)
        interval = setInterval(
          () =>
            calculateVotingEnd(new Date(Number($story!.endTimestamp) * 1000)),
          1000
        );
    } else {
      $story = null;
    }
    $selectedNFTs = [];
    $votingResults = null;
    $abortVotingCheck = true;
  }

  let endSoon: boolean = false;
  function calculateVotingEnd(countDownDate: any) {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (days == 0 && hours == 0 && !endSoon) {
      endSoon = true;
    }

    if (days == 0 && hours == 0 && minutes == 0 && seconds == 0) {
      window.open("/", "_self");
    }

    votingCountdown = `${days}:${
      hours < 10 ? "0" + hours : hours
    }:${minutes < 10 ? "0" + minutes : minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;
  }

  async function checkVotingResults() {
    const votes = await checkVote($episode);
    const optionsCount = $story!.votes_options.length;
    const optionVotes = [];
    for (let i = 1; i <= optionsCount; i++) {
      const result = votes!.filter((vote) => vote == i);
      optionVotes.push({
        option: i,
        votes: result.length,
      });
    }
    let win = optionVotes[0];
    optionVotes.map((result) => {
      if (win.votes < result.votes) win = result;
    });

    // check for s1e3
    if ($season == 1 && $episode == 2) {
      win = {
        option: 1,
        votes: 222,
      };
    }

    $votingResults = {
      results: optionVotes,
      win: win.option,
      participation: votes!.length,
    };
    console.log($votingResults); // console check
    $selectedOption = win.option;
    $checkingResults = -1;
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

    if ($storyNodes[$episode].ended) {
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
        if (optionContainer.dataset.class != nft.class && nft.class != "Ne-Yon")
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
    $selectedOption = optionID;

    if (width < 600 && $selectedOption && $selectedNFTs.length > 0) {
      $userProvider!.getNetwork().then((network) => {
        const baseNetwork: number = 8453;
        console.log(network);
        if (Number(network.chainId) === baseNetwork) vote();
        else
          handlePopUpMessage(
            event as PointerEvent,
            "Please select Base network!"
          );
      });
    }
  }
</script>

<svelte:window bind:innerWidth={width} />

<section class="story-node-wraper">
  <div class="legend blur">
    {#if $story}
      <h1 class="header">
        {$story.season ? $story.title : $story.episodeName}
      </h1>
      <h1 class="season-episode-number">
        The Dischordian Saga: Season {$season} - Episode {$episode + 1}
      </h1>
      <div class="voting-period">
        {#if $storyNodes[$episode].ended}
          <div class="voting-info">
            <p>{$story.duration}</p>
            <span>|</span>
            <p style="color: rgba(255, 60, 64, 0.9);">Voting ended</p>
          </div>
          {#if $votingResults}
            <p class="participation">
              Option: <strong>{$votingResults.win}</strong>
              | Participation:
              <strong
                >{Math.round(
                  ($votingResults.participation / 1035) * 100
                )}%</strong
              >
            </p>
          {:else}
            <div class="check-votes">
              {#if $checkingResults !== -1}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 100 100"
                  class="loading-svg"
                  stroke="transparent"
                  stroke-width="7.5"
                  stroke-dasharray="288.5"
                  stroke-linecap="round"
                  fill="none"
                >
                  <path
                    d="
                      M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92
                    "
                    transform-origin="50 50"
                  />
                </svg>
                <p style="color: rgba(51, 226, 230, 0.75)">Loading...</p>
                <div class="progress-bar">
                  <div
                    class="progress-thumb loading-animation"
                    style="width: {$checkingResults}%;"
                  ></div>
                </div>
                <p>{Math.round($checkingResults)}%</p>
              {:else}
                <button on:click={checkVotingResults}> Check Results </button>
              {/if}
            </div>
          {/if}
        {:else}
          <div class="voting-info">
            <p>{$story.duration}</p>
            <span>|</span>
            <p style="color: rgba(0, 185, 55, 0.9);">Voting active</p>
          </div>
          <p
            class="countdown"
            style={endSoon ? "color: rgba(255, 60, 64, 0.9);" : ""}
          >
            {votingCountdown}
          </p>
        {/if}
      </div>
      {#if $votingResults && $season == 1 && $episode == 2}
        <p class="additional-voting-note">(+2.5% from TikTok)</p>
      {/if}
    {:else if $walletAddress || $storyNodes.length > 0}
      <h1 class="empty-header" class:pulse-animation={$storyNodes.length == 0}>
        {#if $storyNodes.length == 0}
          Loading episodes...
        {:else}
          Select any episode from the tab
        {/if}
      </h1>
    {:else}
      <h1 class="empty-header">Please Sign in Your Profile</h1>
    {/if}
  </div>

  {#if $story}
    <iframe
      src={$story.season
        ? `https://www.youtube.com/embed/${$story.video_url}`
        : $story.video_url}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-100 -100 200 200"
            class="option-selector-svg"
            fill="rgb(51, 226, 230)"
            stroke="rgb(51, 226, 230)"
            stroke-width="20"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-label={mobileTextVisibility ? "Hide" : "Show"}
            style={mobileTextVisibility ? "transform: rotate(180deg)" : ""}
          >
            <polygon
              class="option-selector-icon"
              points="
                -40 -90 -40 90 50 0
              "
              opacity="0.75"
              transform="rotate(90)"
            />
          </svg>
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
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      {#each $story.votes_options as option, index}
        <div
          class="option"
          role="button"
          tabindex="0"
          id={(index + 1).toString()}
          data-class={option.class}
          on:click={selectOption}
          style={$selectedOption == index + 1
            ? "text-shadow: 0 0 0.1vw rgb(51, 226, 230); color: rgb(51, 226, 230);"
            : ""}
        >
          {#if option.class}
            <img
              class="option-selector"
              src="/{option.class}.png"
              alt="Selector"
              style="height: {width > 600 &&
                (optionsCounter >= 5 ? `${12.5 / optionsCounter}vw` : '2.5vw')}
              "
            />
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-100 -100 200 200"
              class="option-selector-svg option-selector"
              fill={$selectedOption == index + 1
                ? "rgb(51, 226, 230)"
                : "#dedede"}
              stroke={$selectedOption == index + 1
                ? "rgb(51, 226, 230)"
                : "#dedede"}
              stroke-width="20"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="height: {width > 600 &&
                (optionsCounter >= 5 ? `${12.5 / optionsCounter}vw` : '2.5vw')}
              "
            >
              <polygon
                class="option-selector-icon"
                points="-40 -90 -40 90 50 0"
                style="transform: {$selectedOption == index + 1
                  ? 'scaleX(1.5)'
                  : ''}"
              />
            </svg>
          {/if}
          {#if $votingResults}
            ({$votingResults.results[index].votes})
          {/if}
          {option.option}
        </div>
      {/each}
    </div>
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
    background-color: #01204e;
    border: 0.1vw solid #203962;
    box-shadow: 0 0.5vw 1vw rgba(0, 0, 0, 0.5);
    margin-top: 2vw;
    margin-bottom: -4vw;
    padding: 1.5vw;
    border-radius: 2.5vw;
  }

  .empty-header {
    font-size: 3.5vw;
    text-align: center;
    padding: 1vw 0;
    color: rgba(51, 226, 230, 0.85);
  }

  .header,
  .season-episode-number {
    font-size: 3vw;
    text-align: center;
    line-height: 5vw;
    color: rgba(51, 226, 230, 0.85);
  }

  .season-episode-number {
    font-size: 2.5vw;
    margin-bottom: 1vw;
    color: #dedede;
  }

  .voting-period {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    width: 90%;
    color: #bebebe;
    background-color: #07387d;
    box-shadow: 0 0.5vw 0.5vw rgba(1, 0, 32, 0.25);
    border: 0.1vw solid #203962;
    border-radius: 1.5vw;
    padding: 1vw 2vw;
    font-size: 1.5vw;
    line-height: 1.5vw;
    gap: 2vw;
  }

  .voting-info {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 2vw;
    padding: 1vw 2vw;
    border-radius: 1vw;
    background-color: #01204e;
    border: 0.1vw solid #203962;
    box-shadow: inset 0 0 0.5vw rgba(1, 0, 32, 0.25);
  }

  .voting-info span {
    color: #010020;
  }

  .participation {
    color: rgba(51, 226, 230, 0.75);
    white-space: nowrap;
  }

  .participation strong {
    color: rgb(51, 226, 230);
  }

  .countdown {
    color: rgba(51, 226, 230, 0.85);
  }

  .check-votes {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 1vw;
  }

  .progress-bar {
    width: 20vw;
  }

  .additional-voting-note {
    font-size: 1.5vw;
    line-height: 4vw;
  }

  .text {
    position: absolute;
    top: 10.4vw;
    width: 84vw;
    left: 8vw;
    overflow-y: scroll;
    height: 47vw;
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
    cursor: pointer;
  }

  .options {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-around;
    position: absolute;
    top: 59vw;
    width: 62vw;
    height: 25.25vw;
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
    cursor: pointer;
  }

  .options::-webkit-scrollbar-thumb:hover,
  .options::-webkit-scrollbar-thumb:active {
    background: rgba(51, 226, 230, 0.5);
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
    transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .option:active,
  .option:hover {
    filter: brightness(125%);
  }

  .option-selector {
    height: 2.5vw;
    width: auto;
    flex: none;
  }

  .loading-svg {
    height: 1.5vw;
    width: 1.5vw;
  }

  @media screen and (max-width: 600px) {
    .video {
      top: 25.5vw;
      display: block;
    }

    .legend {
      margin-bottom: 0.5em;
      padding: 1em 0.75em;
      background-color: rgba(1, 0, 32, 0.85);
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

    .voting-period {
      flex-direction: column;
      gap: 0.5em;
      font-size: 1em;
      line-height: 1.75em;
      padding: 0.5em 1em;
      border-radius: 0.5em;
    }

    .voting-period button {
      gap: 1em;
    }

    .voting-info {
      width: 100%;
      flex-direction: column;
      gap: 0.5em;
      padding: 0.5em;
      background-color: rgba(1, 0, 32, 0.85);
    }

    .voting-info span {
      display: none;
    }

    .check-votes {
      width: 100%;
      gap: 0.5em;
      flex-wrap: wrap;
    }

    .progress-bar {
      width: 80%;
    }

    .additional-voting-note {
      font-size: 1em;
      line-height: 3em;
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
      padding-bottom: 1em;
      display: block;
    }

    .text-wrapper {
      padding-inline: 1em;
      padding-block: 0;
    }

    .options {
      position: static;
      top: auto;
      width: auto;
      height: auto;
      font-size: 1.1em !important;
      white-space: wrap !important;
      margin: 0;
      padding: 0;
      margin-bottom: 4vw;
      padding: 2vw;
      background-color: rgba(1, 0, 32, 0.85);
      border: 0.1vw solid rgba(51, 226, 230, 0.5);
      border-radius: 2.5vw;
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

    .loading-svg {
      height: 1em;
      width: 1em;
    }
  }

  .pulse-animation {
    animation: pulse 3s linear infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
