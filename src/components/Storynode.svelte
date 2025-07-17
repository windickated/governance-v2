<script lang="ts">
  import {
    storyNodes,
    story,
    season,
    episode,
    selectedOption,
    votingResults,
    checkingResults,
    abortVotingCheck,
  } from "@stores/storyNode.ts";
  import { selectedNFTs } from "@stores/NFTs.ts";
  import { walletAddress } from "@stores/auth.ts";
  import vote from "@utils/vote.ts";
  import checkVote from "@lib/voting.js";
  import { userProvider } from "@stores/auth";
  import { toastStore } from "@stores/toast.svelte";

  import SelectorSVG from "@components/icons/Selector.svelte";
  import LoadingSVG from "@components/icons/Loading.svelte";

  let width: number;

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
    const optionVotes: any[] = [];
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
    const target = event.target as HTMLButtonElement;
    const optionContainer =
      target.localName === "button"
        ? target
        : (target.parentElement as HTMLButtonElement);
    const optionID = Number(optionContainer?.id);
    let classMatch: boolean = true;
    if ($selectedOption === optionID) return;

    if ($storyNodes[$episode].ended) {
      toastStore.show("Voting period for this episode is ended", "error");
      return;
    }
    if ($selectedNFTs.length === 0) {
      toastStore.show("Select any Potential to vote!", "error");
      return;
    }
    if (optionContainer.dataset.class) {
      $selectedNFTs.forEach((nft) => {
        if (optionContainer.dataset.class != nft.class && nft.class != "Ne-Yon")
          classMatch = false;
      });
    }
    if (!classMatch) {
      toastStore.show(
        `This option is only for the ${optionContainer.dataset.class} class!`,
        "error"
      );
      return;
    }
    $selectedOption = optionID;

    // Immediately vote on mobiles
    $userProvider!.getNetwork().then((network) => {
      const baseNetwork: number = 8453;
      console.log(network);
      if (Number(network.chainId) === baseNetwork) vote();
      else toastStore.show("Please select Base network!", "error");
    });
  }
</script>

<!-- <section>
  {#if $story}
    <div class="content">
      <iframe
        src={$story.season
          ? `https://www.youtube.com/embed/${$story.video_url}`
          : $story.video_url}
        id="video"
        title="YouTube"
        allowfullscreen
      ></iframe>

      <article class="visible" id="description">
        {$story.description}
      </article>
    </div>
  {/if}


</section> -->

<header class="flex pad round-32">
  <h1 class="sr-only">Galactic Governance Hub</h1>
  {#if $story}
    <h2 class="text-glowing">
      {$story.season ? $story.title : $story.episodeName}
    </h2>
    <h3>The Dischordian Saga: Season {$season} - Episode {$episode + 1}</h3>
    <div class="flex-row">
      {#if $storyNodes[$episode].ended}
        <div class="flex-row">
          <p>{$story.duration}</p>
          <span>|</span>
          <p style="color: rgba(255, 60, 64, 0.9);">Voting ended</p>
        </div>
        {#if $votingResults}
          <p>
            Option: <strong>{$votingResults.win}</strong>
            | Participation:
            <strong
              >{Math.round(
                ($votingResults.participation / 1035) * 100
              )}%</strong
            >
          </p>
        {:else}
          <div>
            {#if $checkingResults !== -1}
              <LoadingSVG />
              <p>Loading...</p>
              <div class="progress-bar">
                <span
                  class="progress-thumb loading-animation"
                  style="width: {$checkingResults}%;"
                ></span>
              </div>
              <p>{Math.round($checkingResults)}%</p>
            {:else}
              <button class="button-glowing" on:click={checkVotingResults}>
                Check Results
              </button>
            {/if}
          </div>
        {/if}
      {:else}
        <div class="voting-info">
          <p>{$story.duration}</p>
          <span>|</span>
          <p>Voting active</p>
        </div>
        <p style={endSoon ? "color: red;" : ""}>{votingCountdown}</p>
      {/if}
    </div>
    {#if $votingResults && $season == 1 && $episode == 2}
      <p class="additional-voting-note">(+2.5% from TikTok)</p>
    {/if}
  {:else if $walletAddress || $storyNodes.length > 0}
    <h2 class="text-glowing" class:pulse-animation={$storyNodes.length == 0}>
      {#if $storyNodes.length == 0}
        Loading episodes...
      {:else}
        Select any episode from the tab
      {/if}
    </h2>
  {:else}
    <h2 class="text-glowing">Please Sign in Your Profile</h2>
  {/if}
</header>

{#if $story}
  <ul class="mobile-options flex pad">
    {#each $story.votes_options as option, index}
      <button
        class="void-btn flex-row"
        class:selected={$selectedOption == index + 1}
        id={(index + 1).toString()}
        data-class={option.class}
        on:click={selectOption}
      >
        {#if option.class}
          <img src="/{option.class}.png" alt="Selector" />
        {:else}
          <SelectorSVG
            focused={$selectedOption == index + 1}
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
{/if}

<!-- <style>
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
</style> -->

<style lang="scss">
  @use "/src/styles/mixins" as *;

  header {
    width: min(85%, 70rem);
    justify-content: space-between;
    background-color: #01204e;
    border: 2px solid #203962;
    @include box-shadow;

    h3 {
      @include white-txt(0.5);
    }
  }

  ul {
    align-items: flex-start;

    @include respond-up(small-desktop) {
      display: none;
    }

    button {
      fill: $white;
      stroke: $white;
      @include white-txt;
      @include font(h5);

      &:hover,
      &:active,
      &:focus {
        fill: $cyan;
        stroke: $cyan;
        @include cyan(1, text);
      }

      img {
        width: 2rem;
      }
    }
  }
</style>
