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

  function selectNFT(event: Event) {
    const target = event.target as HTMLDivElement;
    const nftTile =
      target.localName === "div"
        ? target
        : (target.parentElement as HTMLDivElement);
    const vote = Number(nftTile.dataset.vote);
    $potentials.map((potential) => {
      if (potential.id.toString() === nftTile?.id) {
        if ($listedNumbers.includes(Number(nftTile?.id))) {
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

  // let width: number;

  const openTab = (tab: "nfts" | "episodes") => {
    if (tab === "nfts") {
      console.log("Open NFTs");
    } else if (tab === "episodes") {
      console.log("Open Episodes");
    }
  };

  // let nftBarState: boolean = false;
  // let episodesBarState: boolean = false;

  // let nftsBarPosition: number = nftBarState ? 80 : 0;
  // let episodesBarPosition: number = episodesBarState ? 44 : 0;

  // let nftsInterval: ReturnType<typeof setInterval>;
  // let episodesInterval: ReturnType<typeof setInterval>;

  // function closeActiveTab() {
  //   if (episodesBarState) handleEpisodesBar();
  //   if (nftBarState) handleNFTsBar();
  // }

  // NFTs tab opening
  // function handleNFTsBar() {
  //   if (episodesBarState) handleEpisodesBar();

  //   if (!nftBarState) {
  //     $potentials = $potentials; // force re-render NFTs
  //     if (width <= 600) {
  //       nftsInterval = setInterval(() => {
  //         slideBarMobile(true, "nfts");
  //       }, 5);
  //     } else {
  //       nftsInterval = setInterval(() => {
  //         slideBarPC(true, "nfts");
  //       }, 5);
  //     }
  //     nftBarState = true;
  //     iconHandle("nfts");
  //     BG.style.display = "block";
  //   } else {
  //     if (width <= 600) {
  //       nftsInterval = setInterval(() => {
  //         slideBarMobile(false, "nfts");
  //       }, 5);
  //     } else {
  //       nftsInterval = setInterval(() => {
  //         slideBarPC(false, "nfts");
  //       }, 5);
  //     }
  //     nftBarState = false;
  //     iconHandle("nfts");
  //     BG.style.display = "none";
  //   }
  // }

  //Episodes tab opening
  // function handleEpisodesBar() {
  //   if (nftBarState) handleNFTsBar();

  //   if (!episodesBarState) {
  //     if (width <= 600) {
  //       episodesInterval = setInterval(() => {
  //         slideBarMobile(true, "episodes");
  //       }, 5);
  //     } else {
  //       episodesInterval = setInterval(() => {
  //         slideBarPC(true, "episodes");
  //       }, 5);
  //     }
  //     episodesBarState = true;
  //     iconHandle("episodes");
  //     BG.style.display = "block";
  //   } else {
  //     if (width <= 600) {
  //       episodesInterval = setInterval(() => {
  //         slideBarMobile(false, "episodes");
  //       }, 5);
  //     } else {
  //       episodesInterval = setInterval(() => {
  //         slideBarPC(false, "episodes");
  //       }, 5);
  //     }
  //     episodesBarState = false;
  //     iconHandle("episodes");
  //     BG.style.display = "none";
  //   }
  // }

  // Utility function for icons switching
  // function iconHandle(tab: "nfts" | "episodes") {
  //   if (width <= 600) {
  //     if (tab === "nfts") {
  //       if (nftBarState) {
  //         episodesIcon.style.zIndex = "19";
  //         episodesIcon.style.backgroundImage =
  //           "url('/episodesMobileOpen-Inactive.avif')";
  //         nftIcon.style.backgroundImage = "url('/sideIconMobileClose.avif')";
  //       } else {
  //         episodesIcon.style.zIndex = "19";
  //         episodesIcon.style.backgroundImage =
  //           "url('/episodesMobileOpen.avif')";
  //         nftIcon.style.backgroundImage = "url('/sideIconMobileOpen.avif')";
  //       }
  //     } else if (tab === "episodes") {
  //       if (episodesBarState) {
  //         episodesIcon.style.zIndex = "22";
  //         episodesIcon.style.backgroundImage =
  //           "url('/episodesMobileClose.avif')";
  //         nftIcon.style.backgroundImage =
  //           "url('/sideIconMobileOpen-Inactive.avif')";
  //       } else {
  //         episodesIcon.style.zIndex = "19";
  //         episodesIcon.style.backgroundImage =
  //           "url('/episodesMobileOpen.avif')";
  //         nftIcon.style.backgroundImage = "url('/sideIconMobileOpen.avif')";
  //       }
  //     }
  //   } else {
  //     if (tab === "nfts") {
  //       if (nftBarState) {
  //         nftIcon.style.backgroundImage = "url('/sideIconPCClose.avif')";
  //       } else {
  //         nftIcon.style.backgroundImage = "url('/sideIconPCOpen.avif')";
  //       }
  //     } else if (tab === "episodes") {
  //       if (episodesBarState) {
  //         episodesIcon.style.backgroundImage = "url('/episodesPCClose.avif')";
  //       } else {
  //         episodesIcon.style.backgroundImage = "url('/episodesPCOpen.avif')";
  //       }
  //     }
  //   }
  // }

  // Utility function for PC tabs handling
  // function slideBarPC(open: boolean, tab: "nfts" | "episodes") {
  //   if (tab === "nfts") {
  //     if (open) {
  //       if (nftsBarPosition == 80) {
  //         clearInterval(nftsInterval);
  //       } else {
  //         nftsBarPosition += 4;
  //         nftIcon.style.right = `${nftsBarPosition}vw`;
  //         nftBar.style.right = `${nftsBarPosition - 80}vw`;
  //       }
  //     } else {
  //       if (nftsBarPosition == 0) {
  //         clearInterval(nftsInterval);
  //       } else {
  //         nftsBarPosition -= 4;
  //         nftIcon.style.right = `${nftsBarPosition}vw`;
  //         nftBar.style.right = `${nftsBarPosition - 80}vw`;
  //       }
  //     }
  //   } else if (tab === "episodes") {
  //     if (open) {
  //       if (episodesBarPosition == 40) {
  //         clearInterval(episodesInterval);
  //       } else {
  //         episodesBarPosition += 4;
  //         episodesIcon.style.left = `${episodesBarPosition + 4}vw`;
  //         episodesBar.style.left = `${episodesBarPosition - 40}vw`;
  //       }
  //     } else {
  //       if (episodesBarPosition == 0) {
  //         clearInterval(episodesInterval);
  //       } else {
  //         episodesBarPosition -= 4;
  //         episodesIcon.style.left = `${episodesBarPosition}vw`;
  //         episodesBar.style.left = `${episodesBarPosition - 44}vw`;
  //       }
  //     }
  //   }
  // }

  // Utility function for Mobile tabs handling
  // function slideBarMobile(open: boolean, tab: "nfts" | "episodes") {
  //   if (open) {
  //     if (tab === "nfts") {
  //       if (nftsBarPosition == 80) {
  //         clearInterval(nftsInterval);
  //       } else {
  //         nftsBarPosition += 4;
  //         if (!episodesBarState) episodesIcon.style.top = `${nftsBarPosition}%`;
  //         nftIcon.style.top = `${nftsBarPosition}%`;
  //         nftBar.style.top = `${nftsBarPosition - 80}%`;
  //       }
  //     } else if (tab === "episodes") {
  //       if (episodesBarPosition == 80) {
  //         clearInterval(episodesInterval);
  //       } else {
  //         episodesBarPosition += 4;
  //         if (!nftBarState) nftIcon.style.top = `${episodesBarPosition}%`;
  //         episodesIcon.style.top = `${episodesBarPosition}%`;
  //         episodesBar.style.top = `${episodesBarPosition - 80}%`;
  //       }
  //     }
  //   } else {
  //     if (tab === "nfts") {
  //       if (nftsBarPosition == 0) {
  //         clearInterval(nftsInterval);
  //       } else {
  //         nftsBarPosition -= 4;
  //         if (!episodesBarState) episodesIcon.style.top = `${nftsBarPosition}%`;
  //         nftIcon.style.top = `${nftsBarPosition}%`;
  //         nftBar.style.top = `${nftsBarPosition - 80}%`;
  //       }
  //     } else if (tab === "episodes") {
  //       if (episodesBarPosition == 0) {
  //         clearInterval(episodesInterval);
  //       } else {
  //         episodesBarPosition -= 4;
  //         if (!nftBarState) nftIcon.style.top = `${episodesBarPosition}%`;
  //         episodesIcon.style.top = `${episodesBarPosition}%`;
  //         episodesBar.style.top = `${episodesBarPosition - 80}%`;
  //       }
  //     }
  //   }
  // }

  // SVG Icons
  let contractSvgFocus: boolean = false;
  let refreshSvgFocus: boolean = false;
</script>

<!-- <svelte:window bind:outerWidth={width} /> -->

<!-- --- Episodes tab --- -->
<section class="episodes-tab" bind:this={episodesBar}>
  <button
    bind:this={episodesIcon}
    class="void-btn tab-icon"
    aria-label="Episodes"
    onclick={() => openTab("episodes")}
  >
    Episodes
  </button>

  <h4 class="franchise-title">The Dischordian Saga</h4>

  <button
    class="purple-btn"
    onclick={() => open("https://loredex.degenerousdao.com/", "_blank")}
  >
    Dive into LOREDEX
  </button>

  {#if $walletAddress || $storyNodes.length > 0}
    <select onchange={switchSeason} disabled={$loadingStories !== -1}>
      <option value="1" selected={$season == 1}>Season 1</option>
      <option value="2" selected={$season == 2}>Season 2</option>
    </select>
    {#if $storyNodes.length > 0}
      <ul bind:this={episodes}>
        {#each $storyNodes as episodeObject, index}
          <button
            class="void-btn episode"
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
  {:else}
    <button class="void-btn login-tip" onclick={() => openTab("nfts")}>
      Connect web3 account to load Story Nodes
    </button>
  {/if}
</section>

<!-- --- NFTs tab --- -->
<section class="nfts-tab" bind:this={nftBar}>
  <button
    bind:this={nftIcon}
    class="void-btn tab-icon"
    aria-label="NFTs"
    onclick={() => openTab("nfts")}
  >
    NFTs
  </button>

  <header class="wallet-container flex-row" bind:this={walletContainer}>
    {#if $walletAddress}
      <p>{$username}</p>
      <span class="nfts-selector-wrapper flex-row" bind:this={nftsSelector}>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-100 -100 200 200"
          class="reset-svg filter-image"
          fill="#dedede"
          stroke="#dedede"
          stroke-width="20"
          stroke-linecap="round"
          stroke-linejoin="round"
          onclick={() => {
            if (!$selectedNFTs || $selectedNFTs.length == 0) return;
            undoSelection();
            selectCondition = "";
          }}
          style={!$selectedNFTs || $selectedNFTs.length == 0
            ? "transform: none; fill: #010020; stroke: #010020; opacity: 0.25; cursor: not-allowed;"
            : ""}
          role="button"
          tabindex="0"
          aria-label="Undo selection"
          aria-disabled={selectCondition !== ""}
        >
          <path
            d="
              M 70 -50
              A 85 85 0 1 0 85 0
            "
            fill="none"
          />
          <polygon
            points="
              70 -50 60 -90 30 -55
            "
          />
        </svg>
      </span>
    {:else}
      <p>Connect Wallet:</p>
    {/if}
    <span class="sign-button-wrapper flex-row">
      {#if $walletAddress}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-100 -100 200 200"
          class="contract-svg"
          fill="#dedede"
          stroke="#dedede"
          stroke-width="7.5"
          stroke-linejoin="round"
          stroke-linecap="round"
          onclick={() => ($showModal = true)}
          onpointerover={() => (contractSvgFocus = true)}
          onpointerout={() => (contractSvgFocus = false)}
          role="button"
          tabindex="0"
          aria-label="Delegations"
        >
          <g style="opacity: {contractSvgFocus ? '0.5' : '1'}">
            <path
              d="
                M -10 75
                L -85 75
                L -85 -85
                L 45 -85
                L 45 -15
              "
              fill="none"
              stroke-width="12"
            />
            <circle r="35" cx="-20" cy="-30" fill="none" />
            <path
              d="
                M -40 -30
                L -25 -15
                L 0 -40
              "
              fill="none"
            />
            <path
              d="
                M -65 25
                L -15 25
                M -65 45
                L -25 45
              "
            />
          </g>
          <g
            style={contractSvgFocus
              ? "stroke: rgb(0, 185, 55); transform: scale(1.1) translate(-5%, -2.5%);"
              : ""}
          >
            <g transform="rotate(45) translate(40 -30)">
              <ellipse rx="35" ry="10" cx="15" cy="60" fill="none" />
              <path
                d="
                  M -20 60
                  L -20 35
                  Q 15 20 50 35
                  L 50 60
                  M 0 27
                  Q 10 10 0 -10
                  C -15 -50 45 -50 30 -10
                  Q 20 10 30 27
                "
                fill="none"
              />
            </g>
          </g>
        </svg>
      {/if}
      <WalletConnect />
    </span>
  </header>

  {#if $walletAddress}
    {#if $potentials.length > 0}
      <span class="nfts-legend flex-row">
        <p>
          {#if $fetchingDelegations}
            Loading
          {:else}
            Total
          {/if}
          NFTs: {$potentials.length}
        </p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-100 -100 200 200"
          class="refresh-svg"
          fill="rgb(51, 226, 230)"
          stroke="rgb(51, 226, 230)"
          stroke-width="20"
          stroke-linejoin="round"
          stroke-linecap="round"
          onclick={() => {
            $potentials = $potentials;
          }}
          onpointerover={() => (refreshSvgFocus = true)}
          onpointerout={() => (refreshSvgFocus = false)}
          role="button"
          tabindex="0"
        >
          <g
            id="refresh-arrow"
            style="transform: {refreshSvgFocus
              ? 'scale(0.75) rotate(360deg)'
              : 'none'}"
          >
            <path
              d="
                M -75 -30
                A 80 80 0 0 1 75 -30
              "
              fill="none"
            />
            <polygon
              points="
                75 -30 75 -70 40 -40
              "
            />
          </g>
          <use href="#refresh-arrow" transform="rotate(180)" />
        </svg>

        <p>Selected NFTs: {$selectedNFTs.length}</p>
      </span>

      <ul bind:this={nftTiles}>
        {#each $potentials as NFT}
          {#await nftVote($episode, NFT.id) then vote}
            <button
              class="void-btn nft"
              class:delegated={NFT.delegated}
              id={NFT.id.toString()}
              onclick={selectNFT}
              style={selectedIDs.flat().includes(NFT.id)
                ? `background-color: ${NFT.delegated ? "#50307b" : "#2441BD"}; color: rgba(51, 226, 230, 0.9); box-shadow: 0 0 0.5vw rgb(51, 226, 230); color = #33E2E6; opacity: 1; filter: brightness(125%);`
                : $listedNumbers.includes(NFT.id)
                  ? "background-color: rgb(22, 30, 95);"
                  : `opacity: ${vote > 0 ? "0.5" : "1"}`}
              data-vote={vote}
            >
              <img src={NFT.image} alt={NFT.name} />
              <h5>{NFT.name}</h5>
              <p>{NFT.class}</p>
              {#if vote > 0}
                <p>
                  Selected option: <strong>{vote}</strong>
                </p>
              {/if}
              {#if $listedNumbers.includes(NFT.id)}
                <p class="nft-vote">
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
      <p class="no-nfts-title">
        Your wallet doesn't have any
        <a
          href="https://magiceden.io/collections/ethereum/0xfa511d5c4cce10321e6e86793cc083213c36278e"
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
</style>
