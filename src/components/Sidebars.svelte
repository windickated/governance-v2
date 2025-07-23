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
    fetchingDelegations,
  } from '@stores/NFTs.ts';
  import { walletAddress, username } from '@stores/auth';
  import { showModal } from '@stores/modal';
  import { toastStore } from '@stores/toast.svelte';

  import WalletConnect from '@components/web3/WalletConnect.svelte';
  import ResetSVG from '@components/icons/Reset.svelte';
  import RefreshSVG from '@components/icons/Refresh.svelte';
  import ContractSVG from '@components/icons/Contract.svelte';

  let activeTab: Tab = null;

  const handleTab = (tab: Tab = null) => {
    switch (tab) {
      case 'nfts':
        activeTab = activeTab === 'nfts' ? null : 'nfts';
        break;
      case 'episodes':
        activeTab = activeTab === 'episodes' ? null : 'episodes';
        break;
      default:
        activeTab = null;
    }
  };

  /* --- EPISODES --- */

  // Setting episode number to local memory
  $: if ($episode !== -1) {
    $activeEpisode = {
      seasonNr: $season,
      episodeNr: $episode,
    };
    localStorage.setItem('activeEpisode', JSON.stringify($activeEpisode));
  }

  const switchSeason = async (event: Event) => {
    const seasonSelector = event.target as HTMLSelectElement;
    $season = Number(seasonSelector?.value);
    $episode = -1;
    $story = null;
    $storyNodes = [];
    $activeEpisode = null;
    localStorage.removeItem('activeEpisode');
    try {
      $storyNodes = await get_nodes();
    } catch (error) {
      console.log(error);
    }
  };

  const switchEpisode = async (number: number) => {
    $episode = number;
    $selectedOption = null;
  };

  /* --- NFTs --- */
  $: selectedIDs = $selectedNFTs.map((nft) => nft.id);

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

  let selectCondition: string;
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

  <h2 class="franchise-title text-glowing">The Dischordian Saga</h2>

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
    <ul class="flex pad round dark-glowing vert-scrollbar">
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
  {:else}
    <h5>Loading Season {$season}</h5>
    <div class="progress-bar">
      <div class="loading-animation" style:width="{$loadingStories}%"></div>
    </div>
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
          disabled={selectCondition === ''}
        />
      </span>
    {:else}
      <h4>Connect Web3 Wallet</h4>
    {/if}
    <span class="flex-row gap-8">
      {#if $walletAddress}
        <ContractSVG onclick={() => ($showModal = true)} />
      {/if}
      <WalletConnect />
    </span>
  </header>

  {#if $walletAddress || $fetchingDelegations}
    {#if $potentials.length}
      <div class="nfts-legend flex-row gap-8">
        <span class="flex-row gap-8">
          <h5>
            {#if $fetchingDelegations}
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

      <ul class="flex-row flex-wrap pad round dark-glowing vert-scrollbar">
        {#each $potentials as NFT}
          {#await nftVote($episode, NFT.id) then vote}
            <button
              class="void-btn nft potential-tile"
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
      <p class="validation pad-inline">
        Your wallet doesn't have any
        <a
          href="https://magiceden.io/collections/ethereum/0xfa511d5c4cce10321e6e86793cc083213c36278e"
          target="_blank"
        >
          Potential
        </a>... You're not allowed to enter the Galactic Governance Hub unless
        you have any delegated NFTs
      </p>
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

      .franchise-title {
        margin-top: 1rem;
        @include font(h4);
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

        &.used {
          @include gray(0.75, text);

          &:hover:not(&:disabled),
          &:active:not(&:disabled),
          &:focus:not(&:disabled) {
            @include orange(1, text, bright);
          }
        }

        &.selected {
          @include purple(1, bg, bright);
          @include dark-blue(1, text);
        }
      }

      .web3-address {
        @include dark-red(0.5);
        @include orange(1, text, bright);
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

        header {
          width: calc(100% - 2rem);
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          padding-block: 0.5rem;
          min-height: 4.5rem;
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
