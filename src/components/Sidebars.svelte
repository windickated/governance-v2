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
  } from "@stores/storyNode.ts";
  import {
    potentials,
    selectedNFTs,
    nftVote,
    listedNumbers,
    fetchingDelegations,
  } from "@stores/NFTs.ts";
  import { walletAddress, username } from "@stores/auth";
  import { showModal } from "@stores/modal";
  import { toastStore } from "@stores/toast.svelte";

  import WalletConnect from "@components/web3/WalletConnect.svelte";
  import ResetSVG from "@components/icons/Reset.svelte";
  import RefreshSVG from "@components/icons/Refresh.svelte";
  import ContractSVG from "@components/icons/Contract.svelte";

  let nftIcon: HTMLSpanElement;
  let episodesIcon: HTMLSpanElement;
  let nftBar: HTMLElement;
  let episodesBar: HTMLElement;
  let episodes: HTMLUListElement;
  let walletContainer: HTMLHeadElement;
  let nftsSelector: HTMLSpanElement;
  let nftTiles: HTMLUListElement;
  let BG: HTMLDivElement;

  /* --- EPISODES --- */

  // Setting episode number to local memory
  $: if ($episode !== -1) {
    $activeEpisode = {
      seasonNr: $season,
      episodeNr: $episode,
    };
    localStorage.setItem("activeEpisode", JSON.stringify($activeEpisode));
  }

  const switchSeason = async (event: Event) => {
    const seasonSelector = event.target as HTMLSelectElement;
    $season = Number(seasonSelector?.value);
    $episode = -1;
    $story = null;
    $storyNodes = [];
    $activeEpisode = null;
    localStorage.removeItem("activeEpisode");
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
          toastStore.show("Delist this Potential to vote!", "error");
          return;
        }
        if ($episode === -1) {
          toastStore.show("There is no episode selected!", "error");
          return;
        }
        if ($storyNodes[$episode].ended) {
          if (vote !== 0)
            toastStore.show(
              `This Potential chose the ${vote}${vote == 1 ? "st" : vote == 2 ? "nd" : vote == 3 ? "rd" : "th"} option`
            );
          else toastStore.show("This Potential missed voting", "error");
          return;
        }
        if (vote !== 0 && !potential.selected) {
          toastStore.show("This Potential will change his decision");
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
      toastStore.show("There is no episode selected!", "error");
      if (selectCondition) selectCondition = "";
      return;
    }
    if ($storyNodes[$episode].ended) {
      toastStore.show("Voting for this episode is finished", "error");
      if (selectCondition) selectCondition = "";
      return;
    }
    undoSelection();
    if (selectCondition === "All") {
      $potentials.map((potential) => {
        if (!potential.selected && !$listedNumbers.includes(potential.id)) {
          potential.selected = true;
          $selectedNFTs.push(potential);
        }
      });
    } else if (selectCondition === "Remaining") {
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
    if ($selectedNFTs.length == 0) selectCondition = "";
  };

  /* --- TABS HANDLING --- */

  const openTab = (tab: "nfts" | "episodes") => {
    if (tab === "nfts") {
      console.log("Open NFTs");
    } else if (tab === "episodes") {
      console.log("Open Episodes");
    }
  };
</script>

<!-- --- Episodes tab --- -->
<section class="episodes-tab flex pad" bind:this={episodesBar}>
  <button
    bind:this={episodesIcon}
    class="tab-icon"
    aria-label="Episodes"
    onclick={() => openTab("episodes")}
  >
    Episodes
  </button>

  <h3 class="franchise-title">The Dischordian Saga</h3>

  <button
    class="button-glowing"
    onclick={() => open("https://loredex.degenerousdao.com/", "_blank")}
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
    <ul bind:this={episodes}>
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
      <div
        class="progress-thumb loading-animation"
        style="width: {$loadingStories}%;"
      ></div>
    </div>
  {/if}
</section>

<!-- --- NFTs tab --- -->
<section class="nfts-tab flex pad" bind:this={nftBar}>
  <button
    bind:this={nftIcon}
    class="tab-icon"
    aria-label="NFTs"
    onclick={() => openTab("nfts")}
  >
    NFTs
  </button>

  <header class="flex-row" bind:this={walletContainer}>
    {#if $walletAddress}
      <p class="pc-only">{$username}</p>
      <span class="flex-row gap-8" bind:this={nftsSelector}>
        <p class="pc-only">Select Potentials:</p>
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
            selectCondition = "";
          }}
          disabled={selectCondition === ""}
        />
      </span>
    {:else}
      <p>Connect Wallet:</p>
    {/if}
    <span class="flex-row gap-8">
      {#if $walletAddress}
        <ContractSVG onclick={() => ($showModal = true)} />
      {/if}
      <WalletConnect />
    </span>
  </header>

  {#if $walletAddress}
    {#if $potentials.length}
      <div class="nfts-legend flex-row flex-wrap gap-8">
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
          Selected<strong class="pc-only">NFTs</strong>:
          {$selectedNFTs.length}
        </h5>
      </div>

      <ul class="flex-row flex-wrap" bind:this={nftTiles}>
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
      <p>
        Your wallet doesn't have any
        <a
          href="https://magiceden.io/collections/ethereum/0xfa511d5c4cce10321e6e86793cc083213c36278e"
          target="_blank"
        >
          Potential
        </a>... You're not allowed to enter the Galactic Governance Hub unless
        you have any delegated NFTs.
      </p>
    {/if}
  {/if}
</section>

<!-- <div class="bg" onclick={closeActiveTab} bind:this={BG}></div> -->

<!-- <style>
  .nft-icon {
    position: fixed;
    z-index: 21;
    top: 0;
    right: 0;
    height: 6vw;
    width: 18vw;
    filter: drop-shadow(-0.1vw 0.1vw 0.5vw #010020);
    cursor: pointer;
    background-image: url("/sideIconPCOpen.avif");
    background-repeat: no-repeat;
    background-size: contain;
    background-position: top;
  }

  .episodes-icon {
    position: fixed;
    z-index: 19;
    top: 0;
    left: 0;
    height: 6vw;
    width: 16.6vw;
    filter: drop-shadow(0.1vw 0.1vw 0.5vw #010020);
    cursor: pointer;
    background-image: url("/episodesPCOpen.avif");
    background-repeat: no-repeat;
    background-size: contain;
    background-position: top;
  }

  .nft-bar {
    position: fixed;
    z-index: 20;
    top: 0;
    left: auto;
    right: -80vw;
    height: 100%;
    width: 80vw;
    background-image: url("/sideBorder.avif");
    background-size: contain;
    background-repeat: no-repeat;
    background-color: rgba(1, 0, 32, 0.25);
    -webkit-backdrop-filter: blur(1vw);
    backdrop-filter: blur(1vw);
    filter: drop-shadow(-0.1vw 0.1vw 0.5vw #010020);
    overflow-y: scroll;
  }

  .episodes-bar {
    position: fixed;
    z-index: 18;
    top: 0;
    left: -44vw;
    height: 100%;
    width: 44vw;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    gap: 2vw;
    background-image: url("/sideBorder.avif");
    background-size: contain;
    background-repeat: no-repeat;
    background-color: rgba(1, 0, 32, 0.25);
    background-position: right;
    -webkit-backdrop-filter: blur(1vw);
    backdrop-filter: blur(1vw);
    filter: drop-shadow(-0.1vw 0.1vw 0.5vw #010020);
    overflow-y: scroll;
    padding-inline: 2vw;
    padding-block: 2.5%;
  }

  .nft-bar::-webkit-scrollbar,
  .episodes-bar::-webkit-scrollbar {
    width: 0px;
  }

  .bg {
    display: none;
    position: fixed;
    z-index: 15;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
  }
</style> -->

<style lang="scss">
  @use "/src/styles/mixins" as *;

  .nfts-tab {
    .nfts-legend {
      justify-content: space-between;

      h5 {
        @include white-txt;
      }
    }
  }

  @media screen and (max-width: 1024px) {
    select {
      width: 100%;
    }
  }
</style>
