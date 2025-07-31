<!-- LEGACY SVELTE 3/4 SYNTAX -->
<script lang="ts">
  import { onMount } from 'svelte';

  import {
    storyNodes,
    story,
    season,
    episode,
    selectedOption,
    votingResults,
    checkingResults,
    abortVotingCheck,
    activeEpisode,
    get_nodes,
  } from '@stores/storyNode';
  import { selectedNFTs } from '@stores/NFTs';
  import { userProvider } from '@stores/auth.svelte';
  import vote from '@utils/vote';
  import checkVote from '@lib/voting';
  import { toastStore } from '@stores/toast.svelte';
  import {
    GetCache,
    SetCache,
    ClearCache,
    ACTIVE_EPISODE_KEY,
    DISCHORDIAN_SAGA_KEY,
  } from '@constants/cache';
  import { activeTab } from '@stores/modal.svelte';

  import SelectorSVG from '@components/icons/Selector.svelte';
  import LoadingSVG from '@components/icons/Loading.svelte';

  let votingCountdown: string = '';
  let interval: NodeJS.Timeout;

  onMount(async () => {
    const lastSeason: number = 2; // temp last season Nr

    const paramsString = window.location.search;
    const searchParams = new URLSearchParams(paramsString);

    if (searchParams.has('season') && searchParams.has('season')) {
      SetCache(ACTIVE_EPISODE_KEY, {
        seasonNr: Number(searchParams.get('season')),
        episodeNr: Number(searchParams.get('episode')) - 1,
      });
    }

    const storedNode = GetCache<ActiveEpisode>(ACTIVE_EPISODE_KEY);
    if (storedNode) {
      const { seasonNr } = storedNode;
      if (seasonNr > 0 && seasonNr <= lastSeason) season.set(seasonNr);
      else {
        toastStore.show(
          `Season ${seasonNr} does not exist. Last season is ${lastSeason}`,
          'error',
        );
        storedNode.seasonNr = lastSeason;
        ClearCache(ACTIVE_EPISODE_KEY);
        season.set(lastSeason);
      }
    } else season.set(lastSeason);

    const nodes = await get_nodes();
    storyNodes.set(nodes);

    if (storedNode) {
      const { episodeNr } = storedNode;
      if (nodes.length >= episodeNr) episode.set(episodeNr);
      else {
        toastStore.show(
          `Episode ${episodeNr + 1} does not exist. Last episode is ${nodes.length}`,
          'error',
        );
        ClearCache(ACTIVE_EPISODE_KEY);
        episode.set(nodes.length - 1);
      }
    } else episode.set(nodes.length - 1);
  });

  $: if ($storyNodes.length > 0) {
    clearInterval(interval);
    votingCountdown = '0:00:00:00';
    if ($episode !== -1) {
      $story = $storyNodes[$episode];
      $activeEpisode = {
        seasonNr: $season,
        episodeNr: $episode,
      };
      SetCache(ACTIVE_EPISODE_KEY, $activeEpisode);
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

    if (distance <= 0) {
      // Update the selected episode as ended and cache the franchise
      const storedFranchise = GetCache<Franchise>(DISCHORDIAN_SAGA_KEY);
      if (storedFranchise) {
        const updatedFranchise = storedFranchise.map((f) => {
          if (f.season == $season) {
            f.episodes.map((ep, i) => {
              if (i == $episode) {
                ep.ended = true;
              }
              return ep;
            });
          }
          return f;
        });
        SetCache(DISCHORDIAN_SAGA_KEY, updatedFranchise);
        window.open('/', '_self');
      }
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

    // Immediately vote on mobiles
    $userProvider!.getNetwork().then((network) => {
      const baseNetwork: number = 8453;
      if (Number(network.chainId) === baseNetwork) vote();
      else toastStore.show('Please select Base network', 'error');
    });
  }
</script>

<header class="flex pad round-24">
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

      {#if $storyNodes[$episode] && $storyNodes[$episode].ended}
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
        <p class:red-txt={endSoon}>{votingCountdown}</p>
      {/if}
    </section>
    {#if $votingResults && $season == 1 && $episode == 2}
      <p class="transparent-white-txt">(+2.5% from TikTok)</p>
    {/if}
  {:else}
    <h2 class="text-glowing" class:pulse-animation={$storyNodes.length == 0}>
      {#if $storyNodes.length == 0}
        Loading episodes...
      {:else}
        Pick an Episode to Watch
      {/if}
    </h2>
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
          <img src="/icons/{option.class}.png" alt="Selector" />
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
{:else}
  <div class="open-episodes-wrapper container">
    <p class="white-txt">
      The Galactic Governance Hub enables community-driven franchises to evolve
      through participatory IP development, facilitated by decentralized voting.
      We provide creators with secure, transparent results on their story nodes
      to propel the plot that their community wants.
    </p>
    <button class="blur" onclick={() => activeTab.set('episodes')}>
      Open Episodes Tab
    </button>
  </div>
{/if}

<style lang="scss">
  @use '/src/styles/mixins' as *;

  header {
    width: 100%;
    max-width: min(95%, 70rem);
    background-color: #01204e;
    border: 2px solid #203962;
    @include box-shadow;

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
        fill: $light-blue;
        stroke: $light-blue;
        @include light-blue(1, text);
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

  .open-episodes-wrapper {
    margin-bottom: 7.5rem;
  }

  @include respond-up(small-desktop) {
    header {
      box-shadow: none;
    }

    article,
    ul {
      display: none;
    }

    .open-episodes-wrapper {
      display: none;
    }
  }
</style>
