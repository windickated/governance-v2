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
  } from '@stores/storyNode.ts';
  import { selectedNFTs } from '@stores/NFTs.ts';
  import { walletAddress } from '@stores/auth.ts';
  import vote from '@utils/vote.ts';
  import checkVote from '@lib/voting.js';
  import { userProvider } from '@stores/auth';
  import { toastStore } from '@stores/toast.svelte';

  import SelectorSVG from '@components/icons/Selector.svelte';
  import LoadingSVG from '@components/icons/Loading.svelte';

  let votingCountdown: string = '';
  let interval: NodeJS.Timeout;

  $: if ($storyNodes.length > 0) {
    clearInterval(interval);
    votingCountdown = '0:00:00:00';
    if ($episode !== -1) {
      $story = $storyNodes[$episode];
      endSoon = false;
      if (!$story.ended)
        interval = setInterval(
          () =>
            calculateVotingEnd(new Date(Number($story!.endTimestamp) * 1000)),
          1000,
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
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (days == 0 && hours == 0 && !endSoon) {
      endSoon = true;
    }

    if (days == 0 && hours == 0 && minutes == 0 && seconds == 0) {
      window.open('/', '_self');
    }

    votingCountdown = `${days}:${
      hours < 10 ? '0' + hours : hours
    }:${minutes < 10 ? '0' + minutes : minutes}:${
      seconds < 10 ? '0' + seconds : seconds
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
      toastStore.show('Select any Potential to vote!', 'error');
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
        `This option is only for the ${optionClass} class!`,
        'error',
      );
      return;
    }
    $selectedOption = optionID;

    // Immediately vote on mobiles
    $userProvider!.getNetwork().then((network) => {
      const baseNetwork: number = 8453;
      console.log(network);
      if (Number(network.chainId) === baseNetwork) vote();
      else toastStore.show('Please select Base network!', 'error');
    });
  }
</script>

<header class="flex pad round-32">
  <h1 class="sr-only">Galactic Governance Hub</h1>
  {#if $story}
    <h2 class="text-glowing">
      {$story.season ? $story.title : $story.episodeName}
    </h2>
    <h3>The Dischordian Saga: Season {$season} - Episode {$episode + 1}</h3>
    <section class="flex-row flex-wrap pad-8 round">
      <div class="voting-info flex-row flex-wrap round">
        <h5>{$story.duration}</h5>
        <span class="dark-txt pc-only">|</span>
        <p class="validation" class:green-txt={!$storyNodes[$episode].ended}>
          Voting
          {$storyNodes[$episode].ended ? 'ended' : 'active'}
        </p>
      </div>

      {#if $storyNodes[$episode].ended}
        {#if $votingResults}
          <span class="results flex">
            <h5>Option: {$votingResults.win}</h5>
            <span class="dark-txt pc-only">|</span>
            <h5>
              Participation:
              {Math.round(($votingResults.participation / 1035) * 100)}%
            </h5>
            <p class="validation green-txt mobile-only">Check results below</p>
          </span>
        {:else}
          <span class="flex-row gap-8">
            {#if $checkingResults !== -1}
              <LoadingSVG />
              <h5>{Math.round($checkingResults)}%</h5>
              <h5>Loading...</h5>
            {:else}
              <button class="button-glowing" onclick={checkVotingResults}>
                Check Results
              </button>
            {/if}
          </span>
        {/if}
      {:else}
        <p style={endSoon ? 'color: red;' : ''}>{votingCountdown}</p>
      {/if}
    </section>
    {#if $votingResults && $season == 1 && $episode == 2}
      <p class="transparent-white-txt">(+2.5% from TikTok)</p>
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
  <article class="container">
    {$story.description}
  </article>

  <ul class="transparent-container">
    {#each $story.votes_options as option, index}
      <button
        class="void-btn flex-row"
        class:selected={$selectedOption == index + 1}
        onclick={() => selectOption(index + 1, option.class)}
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

<style lang="scss">
  @use '/src/styles/mixins' as *;

  header {
    width: 100%;
    max-width: min(95%, 70rem);
    background-color: #01204e;
    border: 2px solid #203962;

    h3 {
      @include white-txt(soft);
    }

    section {
      width: 100%;
      background-color: #07387d;
      border: 2px solid #203962;
      gap: 0.5rem;
      @include box-shadow;

      @include respond-up(tablet) {
        gap: 1rem;
      }

      .voting-info {
        padding: 0.5rem 1.5rem;
        background-color: #01204e;
        border: 1px solid #203962;
        @include box-shadow(soft, inset);
      }
    }

    .results {
      @include respond-up(small-desktop) {
        flex-direction: row;
      }
    }
  }

  article {
    width: 95%;
    white-space: pre-wrap;
    text-align: justify;
    padding-inline: 2rem;
    @include white-txt;
  }

  ul {
    width: 95%;
    align-items: flex-start;

    button {
      text-align: left;
      gap: 0.5rem;
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

      &.selected {
        fill: $bright-purple;
        stroke: $bright-purple;
        @include purple(1, text, bright);
      }
    }
  }

  @include respond-up(small-desktop) {
    article,
    ul {
      display: none;
    }
  }
</style>
