<script lang="ts">
  import {
    storyNodes,
    story,
    season,
    episode,
    selectedOption,
    get_nodes,
    loadingStories,
    activeEpisode,
  } from '@stores/storyNode.ts';
  import {
    potentials,
    selectedNFTs,
    nftVote,
    listedNumbers,
    loadingNFTs,
  } from '@stores/NFTs.ts';
  import { walletAddress, username } from '@stores/auth';
  import { showModal } from '@stores/modal';
  import { toastStore } from '@stores/toast.svelte';
  import { ClearCache, ACTIVE_EPISODE_KEY } from '@constants/cache.js';

  import WalletConnect from '@components/web3/WalletConnect.svelte';
  import ResetSVG from '@components/icons/Reset.svelte';
  import RefreshSVG from '@components/icons/Refresh.svelte';
  import ContractSVG from '@components/icons/Contract.svelte';
  import ArrowSVG from '@components/icons/Arrow.svelte';
  import LoadingSVG from '@components/icons/Loading.svelte';

  let activeTab = $state<Tab>(null);

  const handleTab = (tab: Tab = null) => {
    switch (tab) {
      case 'nfts':
        activeTab = activeTab === 'nfts' ? null : 'nfts';
        $potentials = $potentials; // to trigger reactivity
        break;
      case 'episodes':
        activeTab = activeTab === 'episodes' ? null : 'episodes';
        break;
      default:
        activeTab = null;
    }
  };

  /* --- EPISODES --- */

  const switchSeason = async (event: Event) => {
    const seasonSelector = event.target as HTMLSelectElement;
    $season = Number(seasonSelector?.value);
    $episode = -1;
    $story = null;
    $storyNodes = [];
    $activeEpisode = null;
    ClearCache(ACTIVE_EPISODE_KEY);
    try {
      $storyNodes = await get_nodes();
    } catch (error) {
      console.error(error);
    }
  };

  const switchEpisode = async (number: number) => {
    $episode = number;
    $selectedOption = null;
  };

  /* --- NFTs --- */
  let selectedIDs = $derived($selectedNFTs.map((nft) => nft.id));

  let modalFocus = $state<boolean>(false);

  function selectNFT(id: number, vote: number) {
    $potentials.map((potential) => {
      if (potential.id === id) {
        if ($listedNumbers.includes(id)) {
          toastStore.show('Delist this Potential to vote!', 'error');
          return;
        }
        if ($episode === -1) {
          toastStore.show('There is no episode selected!', 'error');
          return;
        }
        if ($storyNodes[$episode].ended) {
          if (vote !== 0)
            toastStore.show(
              `This Potential chose the ${vote}${vote == 1 ? 'st' : vote == 2 ? 'nd' : vote == 3 ? 'rd' : 'th'} option`,
            );
          else toastStore.show('This Potential missed voting', 'error');
          return;
        }
        if (vote !== 0 && !potential.selected) {
          toastStore.show('This Potential will change his decision');
        }
        if ($selectedOption) $selectedOption = null;
        potential.selected = !potential.selected;
        if (potential.selected) {
          $selectedNFTs.push(potential);
          $selectedNFTs = $selectedNFTs; // for Count re-render
        } else {
          $selectedNFTs = $selectedNFTs.filter((nft) => nft !== potential);
        }
      }
    });
  }

  const undoSelection = () => {
    $potentials.map((potential) => {
      if (potential.selected) {
        potential.selected = false;
        $selectedNFTs = $selectedNFTs.filter((nft) => nft !== potential);
      }
    });
    $selectedNFTs = $selectedNFTs;
    if ($selectedOption) $selectedOption = null;
  };

  let selectCondition = $state<string>('');
  const selectMultipleNFTs = () => {
    if ($episode === -1) {
      toastStore.show('There is no episode selected!', 'error');
      if (selectCondition) selectCondition = '';
      return;
    }
    if ($storyNodes[$episode].ended) {
      toastStore.show('Voting for this episode is finished', 'error');
      if (selectCondition) selectCondition = '';
      return;
    }
    undoSelection();
    if (selectCondition === 'All') {
      $potentials.map((potential) => {
        if (!potential.selected && !$listedNumbers.includes(potential.id)) {
          potential.selected = true;
          $selectedNFTs.push(potential);
        }
      });
    } else if (selectCondition === 'Remaining') {
      $potentials.map(async (potential) => {
        if (!potential.selected && !$listedNumbers.includes(potential.id)) {
          await nftVote($episode, potential.id).then((vote) => {
            if (Number(vote) === 0) {
              potential.selected = true;
              $selectedNFTs.push(potential);
            }
          });
        }
        $selectedNFTs = $selectedNFTs;
      });
      return;
    } else if (selectCondition) {
      $potentials.map((potential) => {
        if (!potential.selected && !$listedNumbers.includes(potential.id)) {
          if (potential.class == selectCondition) {
            potential.selected = true;
            $selectedNFTs.push(potential);
          }
        }
      });
    }
    $selectedNFTs = $selectedNFTs;
    if ($selectedNFTs.length == 0) selectCondition = '';
  };
</script>

<!-- --- Episodes tab --- -->
<section
  class="episodes-tab transition blur flex transparent-glowing"
  class:open={activeTab === 'episodes'}
>
  <button
    class="tab-icon void-btn pad-8 pad-inline flex-row"
    aria-label="Episodes"
    onclick={() => handleTab('episodes')}
  >
    <img src="/icons/episode.png" alt="Episodes" />
    Episodes
  </button>
  <button
    class="secondary-tab tab-icon void-btn pad-8 pad-inline flex-row"
    class:visible={activeTab === 'episodes'}
    aria-label="NFTs"
    onclick={() => handleTab('nfts')}
  >
    <img src="/icons/selection.png" alt="NFTs" />
    NFTs
  </button>

  <header class="flex-row pad shad">
    <ArrowSVG onclick={() => {}} disabled={true} />
    <h2>The Dischordian Saga</h2>
    <ArrowSVG onclick={() => {}} rotate={true} disabled={true} />
  </header>

  <button
    class="button-glowing"
    onclick={() => open('https://loredex.degenerousdao.com/', '_blank')}
  >
    Dive into LOREDEX
  </button>

  <select
    onchange={switchSeason}
    disabled={!$storyNodes.length || $loadingStories !== -1}
  >
    <option value="1" selected={$season == 1}>Season 1</option>
    <option value="2" selected={$season == 2}>Season 2</option>
  </select>
  {#if $storyNodes.length}
    <ul class="flex-row flex-wrap pad round dark-glowing vert-scrollbar">
      {#each $storyNodes as episodeObject, index}
        <button
          class="void-btn episode tile"
          class:active={$episode == index}
          onclick={() => switchEpisode(index)}
        >
          <img src={episodeObject.image_url} alt="Episode {index + 1}" />
          <h5>
            {episodeObject.season
              ? episodeObject.title
              : episodeObject.episodeName}
          </h5>
          <p>Episode {index + 1}</p>
        </button>
      {/each}
    </ul>
  {:else if $loadingStories !== -1}
    <span class="flex-row">
      <LoadingSVG />
      <h5>Loading...</h5>
    </span>
    <div class="progress-bar">
      <div class="loading-animation" style:width="{$loadingStories}%"></div>
    </div>
  {:else}
    <ul class="flex-row flex-wrap pad round dark-glowing vert-scrollbar">
      {#each Array(2) as _}
        <div class="loading-tile">
          <div class="loading-animation"></div>
          <span class="loading-animation"></span>
        </div>
      {/each}
    </ul>
  {/if}
</section>

<!-- --- NFTs tab --- -->
<section
  class="nfts-tab transition blur flex transparent-glowing"
  class:open={activeTab === 'nfts'}
>
  <button
    class="tab-icon void-btn pad-8 pad-inline flex-row"
    aria-label="NFTs"
    onclick={() => handleTab('nfts')}
  >
    <img src="/icons/selection.png" alt="NFTs" />
    NFTs
  </button>
  <button
    class="secondary-tab tab-icon void-btn pad-8 pad-inline flex-row"
    class:visible={activeTab === 'nfts'}
    aria-label="Episodes"
    onclick={() => handleTab('episodes')}
  >
    <img src="/icons/episode.png" alt="NFTs" />
    Episodes
  </button>

  <header class="flex-row pad shad">
    {#if $walletAddress}
      <p class="web3-address pc-only pad-8 pad-inline round-8 shad-inset">
        {$username}
      </p>
      <span class="flex-row gap-8">
        <h5 class="pc-only">Select Potentials:</h5>
        <select
          bind:value={selectCondition}
          onchange={selectMultipleNFTs}
          disabled={$episode == -1}
        >
          <option value="" selected disabled hidden>Select</option>
          <option value="All">All</option>
          <option value="Remaining">Remaining</option>
          <option value="Assassin">Assassin</option>
          <option value="Soldier">Soldier</option>
          <option value="Spy">Spy</option>
          <option value="Engineer">Engineer</option>
          <option value="Oracle">Oracle</option>
        </select>
        <ResetSVG
          onclick={() => {
            if (!$selectedNFTs || $selectedNFTs.length == 0) return;
            undoSelection();
            selectCondition = '';
          }}
          disabled={!$selectedNFTs || $selectedNFTs.length == 0}
        />
      </span>
    {:else}
      <h4>Connect Web3 Wallet</h4>
    {/if}
    <span class="flex-row gap-8">
      {#if $walletAddress}
        <ContractSVG onclick={() => ($showModal = true)} {modalFocus} />
      {/if}
      <WalletConnect />
    </span>
  </header>

  {#if $walletAddress}
    <div class="nfts-legend flex-row gap-8">
      <span class="flex-row gap-8">
        <h5>
          {#if $loadingNFTs}
            Loading
          {:else}
            Total
          {/if}
          NFTs: {$potentials.length}
        </h5>
        <RefreshSVG
          onclick={() => {
            $potentials = $potentials;
          }}
        />
      </span>

      <h5>
        Selected<strong class="pc-only">&nbsp;NFTs</strong>:
        {$selectedNFTs.length}
      </h5>
    </div>

    {#if $loadingNFTs}
      <ul class="flex-row flex-wrap pad round dark-glowing vert-scrollbar">
        {#each Array(Math.floor(Math.random() * 2) + 2) as _}
          <div class="potential-tile loading-tile">
            <div class="loading-animation"></div>
            <span class="loading-animation"></span>
          </div>
        {/each}
      </ul>
    {:else if $potentials.length}
      <ul class="flex-row flex-wrap pad round dark-glowing vert-scrollbar">
        {#each $potentials as NFT}
          {#await nftVote($episode, NFT.id) then vote}
            <button
              class="void-btn nft potential-tile fade-in"
              class:selected={selectedIDs.flat().includes(NFT.id)}
              class:delegated={NFT.delegated}
              class:listed={$listedNumbers.includes(NFT.id)}
              class:used={vote > 0}
              onclick={() => selectNFT(NFT.id, Number(vote))}
            >
              <img src={NFT.image} alt={NFT.name} />
              <h5>{NFT.name}</h5>
              {#if vote > 0}
                <p>
                  Selected option: <strong>{vote}</strong>
                </p>
              {/if}
              {#if $listedNumbers.includes(NFT.id)}
                <p>
                  Listed
                  <strong class="pc-only"> on marketplace </strong>
                </p>
              {/if}
              {#if NFT.delegated}
                <p class="pc-only">Owner: {NFT.delegated}</p>
                <p class="mobile-only">Delegated</p>
              {/if}
            </button>
          {/await}
        {/each}
      </ul>
    {:else}
      <div class="potential-banner container flex-row">
        <div class="flex">
          <p class="validation">Your wallet doesn't have any Potential</p>

          <p class="text-glowing">
            You don’t hold any Potentials directly, but delegated NFTs may grant
            you voting power. Open the Delegation Panel to explore shared
            access.
          </p>

          <button
            class="button-glowing"
            onclick={() => ($showModal = true)}
            onpointerover={() => (modalFocus = true)}
            onpointerout={() => (modalFocus = false)}
          >
            Check Delegations
          </button>

          <hr />

          <p class="text-glowing">
            Or explore the Marketplace to discover a Potential that resonates
            with your journey.
          </p>

          <span class="flex-row flex-wrap">
            <a
              class="button-anchor button-glowing"
              href="https://magiceden.io/collections/ethereum/0xfa511d5c4cce10321e6e86793cc083213c36278e"
              target="_blank"
            >
              <img src="/icons/magiceden.png" alt="Magic Eden marketplace" />
              Magic Eden
            </a>
            <a
              class="button-anchor button-glowing"
              href="https://opensea.io/collection/potentials-eth"
              target="_blank"
            >
              <img src="/icons/opensea.png" alt="OpenSea marketplace" />
              OpenSea
            </a>
          </span>
        </div>

        <img class="potential" src="/quarchon.avif" alt="Potential" />
      </div>
    {/if}
  {/if}
</section>

<button
  id="bg"
  class="void-btn fade-in"
  class:hidden={!activeTab}
  onclick={() => handleTab()}
  aria-label="Background"
></button>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  section {
    position: fixed;
    width: 100vw;
    height: 85vh;
    top: -85vh;
    left: 0;
    justify-content: flex-start;
    z-index: 20;

    &.open {
      top: 0;
      z-index: 30;
    }

    ul {
      width: 100%;
      height: 100%;
      overflow-y: scroll;
      margin-bottom: 1rem;
      @include box-shadow(soft, inset);
    }

    .tab-icon {
      position: absolute;
      top: 100%;
      width: 50vw;
      @include blue;
      @include white-txt;
      @include font(h4);

      img {
        width: 1.5rem;
      }

      &.secondary-tab {
        display: none;

        &.visible {
          display: flex;
        }
      }
    }

    &.episodes-tab {
      .tab-icon {
        left: 0;
        background-color: $navy;

        &:hover,
        &:active,
        &:focus {
          @include bright(150%);
        }

        &.secondary-tab {
          left: unset;
          right: 0;
          background-color: $royal-purple;
        }
      }

      &.open {
        .tab-icon:not(.secondary-tab) {
          background-color: $blue;
          filter: none;
        }

        .secondary-tab {
          @include bright(50%);
        }
      }

      header {
        width: 100%;
        justify-content: space-between;
        @include navy;

        h2 {
          @include cyan(1, text);
          @include font(h4);
        }
      }

      select {
        flex: none;
      }

      .episode {
        width: 100%;

        &.active {
          @include cyan(0.85);
          @include dark-blue(1, text);
        }

        img {
          aspect-ratio: 16 / 9;
        }
      }

      .loading-tile {
        width: 100%;

        div {
          aspect-ratio: 16 / 9;
        }
      }
    }

    &.nfts-tab {
      .tab-icon {
        right: 0;
        background-color: $royal-purple;

        &:hover,
        &:active,
        &:focus {
          @include bright(150%);
        }

        &.secondary-tab {
          right: unset;
          left: 0;
          background-color: $navy;
        }
      }

      &.open {
        .tab-icon:not(.secondary-tab) {
          background-color: $purple;
          filter: none;
        }

        .secondary-tab {
          @include bright(50%);
        }
      }

      header {
        width: 100%;
        justify-content: space-between;
        background-color: $royal-purple;

        h4,
        h5 {
          @include orange(1, text, bright);
        }

        select {
          @include orange-border;
          @include orange(1, text, bright);
        }
      }

      .nfts-legend {
        width: 90%;
        justify-content: space-between;
        white-space: nowrap;

        h5 {
          @include white-txt;
        }
      }

      .nft {
        max-width: calc(50% - 0.5rem);

        &.delegated {
          @include gray(0.25);

          &:hover:not(&:disabled),
          &:active:not(&:disabled),
          &:focus:not(&:disabled) {
            @include gray(0.35);
          }
        }

        &.listed {
          @include deep-red(0.25);

          &:hover:not(&:disabled),
          &:active:not(&:disabled),
          &:focus:not(&:disabled) {
            @include deep-red(0.35);
          }
        }

        &.used:not(&.selected) {
          @include bright(50%);
        }

        &.selected {
          background-color: $bright-purple !important;
          @include dark-blue(1, text);
        }
      }

      .loading-tile {
        max-width: calc(50% - 0.5rem);

        div {
          aspect-ratio: 2 / 2.5;
        }
      }

      .web3-address {
        @include dark-red(0.5);
        @include orange(1, text, bright);
      }

      .potential-banner {
        .potential {
          display: none;
        }
      }
    }

    @include respond-up(small-desktop) {
      height: 100vh;
      top: 0;
      @include box-shadow;

      ul {
        width: calc(100% - 2rem);
      }

      .tab-icon {
        width: auto;
        top: 0;
        height: 4.5rem;
        min-height: 4vw;

        img {
          width: 2rem;
          min-width: 1.5vw;
        }

        &.secondary-tab {
          display: none !important;
        }
      }

      strong {
        display: inline;
      }

      &.episodes-tab,
      &.nfts-tab {
        header {
          width: calc(100% - 2rem);
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          padding-block: 0.5rem;
          min-height: 4.5rem;
        }
      }

      &.episodes-tab {
        width: 30rem;
        left: -30rem;
        border-right: 0.25rem solid $navy;

        &.open {
          left: 0;
          border-right-color: $blue;
        }

        .tab-icon {
          left: 100%;
          border-bottom-right-radius: 1rem;
          @include box-shadow(0.1rem 0.1rem 0.25rem rgba(0, 0, 0, 0.5));
        }
      }

      &.nfts-tab {
        width: min(80vw, 68rem);
        left: unset;
        right: max(-80vw, -68rem);
        border-left: 0.25rem solid $royal-purple;
        border-left-color: $purple;

        &.open {
          right: 0;
        }

        .tab-icon {
          right: 100%;
          border-bottom-left-radius: 1rem;
          @include box-shadow(-0.1rem 0.1rem 0.25rem rgba(0, 0, 0, 0.5));
        }

        .potential-banner {
          width: calc(100% - 2rem);
          padding-bottom: 0;
          align-items: flex-end;

          div {
            padding-bottom: 1rem;
          }

          .potential {
            display: block;
            width: 20rem;
          }
        }
      }
    }
  }

  #bg {
    width: 100vw;
    height: 100vh;
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.75);
    z-index: 15;
    transform: none;
    cursor: default;

    &.hidden {
      opacity: 0;
      pointer-events: none;
    }
  }

  .progress-bar {
    width: 90%;
  }

  @media screen and (max-width: 1024px) {
    select {
      width: 90%;
    }
  }

  // Only for mobiles
  @media screen and (max-width: 1024px) {
  }
</style>
