<script lang="ts">
  import {
    storyNodes,
    story,
    season,
    episode,
    selectedOption,
    get_nodes,
    loadingStories,
  } from "../stores/storyNode.ts";
  import {
    potentials,
    selectedNFTs,
    nftVote,
    listedNumbers,
    fetchingDelegations,
  } from "../stores/NFTs.ts";
  import { walletAddress, username } from "../stores/auth";
  import { showModal } from "../stores/modal";
  import Modal from "./Modal.svelte";
  import WalletConnect from "./WalletConnect.svelte";

  export let handlePopUpMessage: Function;

  /* --- EPISODES --- */

  let episodes: HTMLDivElement;

  const switchSeason = async (event: Event) => {
    const seasonSelector = event.target as HTMLSelectElement;
    $season = Number(seasonSelector?.value);
    $episode = -1;
    $story = null;
    $storyNodes = [];
    try {
      $storyNodes = await get_nodes();
    } catch (error) {
      console.log(error);
    }
  };

  const switchEpisode = async (event: Event) => {
    const target = event.target as HTMLDivElement;
    const episodeContainer =
      target.localName === "div"
        ? target
        : (target.parentElement as HTMLDivElement);
    $episode = Number(episodeContainer?.id);
    $selectedOption = null;
  };

  $: if ($episode !== -1) {
    Array.from(episodes.children).forEach((node: ChildNode) => {
      const episode = node as HTMLDivElement;
      if ($episode == Number(episode.id)) {
        episode!.style.color = "#010020";
        episode!.style.boxShadow =
          "inset 0 0 0.5vw rgba(51, 226, 230, 0.5), 0 0 0.5vw rgb(51, 226, 230)";
        episode!.style.backgroundColor = "rgba(51, 226, 230, 0.75)";
      } else {
        episode.style.color = "inherit";
        episode.style.boxShadow = "inset 0 0 0.5vw #010020";
        episode.style.backgroundColor = "rgba(51, 226, 230, 0.5)";
      }
    });
  }

  /* --- NFTs --- */

  let walletContainer: HTMLDivElement;
  let nftsSelector: HTMLDivElement;

  let nftTiles: HTMLDivElement;
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
          handlePopUpMessage(
            event as PointerEvent,
            "Delist this Potential to vote!"
          );
          return;
        }
        if ($episode === -1) {
          handlePopUpMessage(
            event as PointerEvent,
            "There is no episode selected!"
          );
          return;
        }
        if ($storyNodes[$episode].ended) {
          if (vote !== 0)
            handlePopUpMessage(
              event as PointerEvent,
              `This Potential chose the ${vote}${vote == 1 ? "st" : vote == 2 ? "nd" : vote == 3 ? "rd" : "th"} option.`
            );
          else
            handlePopUpMessage(
              event as PointerEvent,
              "This Potential missed voting."
            );
          return;
        }
        if (vote !== 0 && !potential.selected) {
          handlePopUpMessage(
            event as PointerEvent,
            `This Potential will change his decision.`
          );
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

  let selectCondition: string;
  const selectMultipleNFTs = () => {
    if ($episode === -1) {
      handlePopUpMessage(
        event as PointerEvent,
        "There is no episode selected!"
      );
      if (selectCondition) selectCondition = "";
      return;
    }
    if ($storyNodes[$episode].ended) {
      handlePopUpMessage(
        event as PointerEvent,
        "Voting for this episode is finished."
      );
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

  /* --- TABS HANDLING --- */

  let width: number;
  let nftIcon: HTMLSpanElement;
  let episodesIcon: HTMLSpanElement;
  let nftBar: HTMLDivElement;
  let episodesBar: HTMLDivElement;
  let BG: HTMLDivElement;

  let nftBarState: boolean = false;
  let episodesBarState: boolean = false;

  let nftsBarPosition: number = nftBarState ? 80 : 0;
  let episodesBarPosition: number = episodesBarState ? 44 : 0;

  let nftsInterval: ReturnType<typeof setInterval>;
  let episodesInterval: ReturnType<typeof setInterval>;

  function closeActiveTab() {
    if (episodesBarState) handleEpisodesBar();
    if (nftBarState) handleNFTsBar();
  }

  // NFTs tab opening
  function handleNFTsBar() {
    if (episodesBarState) handleEpisodesBar();

    if (!nftBarState) {
      $potentials = $potentials; // force re-render NFTs
      if (width <= 600) {
        nftsInterval = setInterval(() => {
          slideBarMobile(true, "nfts");
        }, 5);
      } else {
        nftsInterval = setInterval(() => {
          slideBarPC(true, "nfts");
        }, 5);
      }
      nftBarState = true;
      iconHandle("nfts");
      BG.style.display = "block";
    } else {
      if (width <= 600) {
        nftsInterval = setInterval(() => {
          slideBarMobile(false, "nfts");
        }, 5);
      } else {
        nftsInterval = setInterval(() => {
          slideBarPC(false, "nfts");
        }, 5);
      }
      nftBarState = false;
      iconHandle("nfts");
      BG.style.display = "none";
    }
  }

  //Episodes tab opening
  function handleEpisodesBar() {
    if (nftBarState) handleNFTsBar();

    if (!episodesBarState) {
      if (width <= 600) {
        episodesInterval = setInterval(() => {
          slideBarMobile(true, "episodes");
        }, 5);
      } else {
        episodesInterval = setInterval(() => {
          slideBarPC(true, "episodes");
        }, 5);
      }
      episodesBarState = true;
      iconHandle("episodes");
      BG.style.display = "block";
    } else {
      if (width <= 600) {
        episodesInterval = setInterval(() => {
          slideBarMobile(false, "episodes");
        }, 5);
      } else {
        episodesInterval = setInterval(() => {
          slideBarPC(false, "episodes");
        }, 5);
      }
      episodesBarState = false;
      iconHandle("episodes");
      BG.style.display = "none";
    }
  }

  // Utility function for icons switching
  function iconHandle(tab: "nfts" | "episodes") {
    if (width <= 600) {
      if (tab === "nfts") {
        if (nftBarState) {
          episodesIcon.style.zIndex = "19";
          episodesIcon.style.backgroundImage =
            "url('/episodesMobileOpen-Inactive.avif')";
          nftIcon.style.backgroundImage = "url('/sideIconMobileClose.avif')";
        } else {
          episodesIcon.style.zIndex = "19";
          episodesIcon.style.backgroundImage =
            "url('/episodesMobileOpen.avif')";
          nftIcon.style.backgroundImage = "url('/sideIconMobileOpen.avif')";
        }
      } else if (tab === "episodes") {
        if (episodesBarState) {
          episodesIcon.style.zIndex = "22";
          episodesIcon.style.backgroundImage =
            "url('/episodesMobileClose.avif')";
          nftIcon.style.backgroundImage =
            "url('/sideIconMobileOpen-Inactive.avif')";
        } else {
          episodesIcon.style.zIndex = "19";
          episodesIcon.style.backgroundImage =
            "url('/episodesMobileOpen.avif')";
          nftIcon.style.backgroundImage = "url('/sideIconMobileOpen.avif')";
        }
      }
    } else {
      if (tab === "nfts") {
        if (nftBarState) {
          nftIcon.style.backgroundImage = "url('/sideIconPCClose.avif')";
        } else {
          nftIcon.style.backgroundImage = "url('/sideIconPCOpen.avif')";
        }
      } else if (tab === "episodes") {
        if (episodesBarState) {
          episodesIcon.style.backgroundImage = "url('/episodesPCClose.avif')";
        } else {
          episodesIcon.style.backgroundImage = "url('/episodesPCOpen.avif')";
        }
      }
    }
  }

  // Utility function for PC tabs handling
  function slideBarPC(open: boolean, tab: "nfts" | "episodes") {
    if (tab === "nfts") {
      if (open) {
        if (nftsBarPosition == 80) {
          clearInterval(nftsInterval);
        } else {
          nftsBarPosition += 4;
          nftIcon.style.right = `${nftsBarPosition}vw`;
          nftBar.style.right = `${nftsBarPosition - 80}vw`;
        }
      } else {
        if (nftsBarPosition == 0) {
          clearInterval(nftsInterval);
        } else {
          nftsBarPosition -= 4;
          nftIcon.style.right = `${nftsBarPosition}vw`;
          nftBar.style.right = `${nftsBarPosition - 80}vw`;
        }
      }
    } else if (tab === "episodes") {
      if (open) {
        if (episodesBarPosition == 40) {
          clearInterval(episodesInterval);
        } else {
          episodesBarPosition += 4;
          episodesIcon.style.left = `${episodesBarPosition + 4}vw`;
          episodesBar.style.left = `${episodesBarPosition - 40}vw`;
        }
      } else {
        if (episodesBarPosition == 0) {
          clearInterval(episodesInterval);
        } else {
          episodesBarPosition -= 4;
          episodesIcon.style.left = `${episodesBarPosition}vw`;
          episodesBar.style.left = `${episodesBarPosition - 44}vw`;
        }
      }
    }
  }

  // Utility function for Mobile tabs handling
  function slideBarMobile(open: boolean, tab: "nfts" | "episodes") {
    if (open) {
      if (tab === "nfts") {
        if (nftsBarPosition == 80) {
          clearInterval(nftsInterval);
        } else {
          nftsBarPosition += 4;
          if (!episodesBarState) episodesIcon.style.top = `${nftsBarPosition}%`;
          nftIcon.style.top = `${nftsBarPosition}%`;
          nftBar.style.top = `${nftsBarPosition - 80}%`;
        }
      } else if (tab === "episodes") {
        if (episodesBarPosition == 80) {
          clearInterval(episodesInterval);
        } else {
          episodesBarPosition += 4;
          if (!nftBarState) nftIcon.style.top = `${episodesBarPosition}%`;
          episodesIcon.style.top = `${episodesBarPosition}%`;
          episodesBar.style.top = `${episodesBarPosition - 80}%`;
        }
      }
    } else {
      if (tab === "nfts") {
        if (nftsBarPosition == 0) {
          clearInterval(nftsInterval);
        } else {
          nftsBarPosition -= 4;
          if (!episodesBarState) episodesIcon.style.top = `${nftsBarPosition}%`;
          nftIcon.style.top = `${nftsBarPosition}%`;
          nftBar.style.top = `${nftsBarPosition - 80}%`;
        }
      } else if (tab === "episodes") {
        if (episodesBarPosition == 0) {
          clearInterval(episodesInterval);
        } else {
          episodesBarPosition -= 4;
          if (!nftBarState) nftIcon.style.top = `${episodesBarPosition}%`;
          episodesIcon.style.top = `${episodesBarPosition}%`;
          episodesBar.style.top = `${episodesBarPosition - 80}%`;
        }
      }
    }
  }

  // SVG Icons
  let contractSvgFocus: boolean = false;
  let refreshSvgFocus: boolean = false;
</script>

<svelte:window bind:outerWidth={width} />

<!-- --- Episodes tab --- -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<span
  bind:this={episodesIcon}
  role="button"
  tabindex="0"
  class="episodes-icon"
  on:click={handleEpisodesBar}
></span>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="episodes-bar" bind:this={episodesBar}>
  <p class="season-title">The Dischordian Saga</p>
  <button
    class="loredex"
    on:click={() => open("https://loredex.degenerousdao.com/", "_blank")}
    >Dive into LOREDEX</button
  >
  {#if $walletAddress || $storyNodes.length > 0}
    <select
      class="season"
      on:change={switchSeason}
      disabled={$loadingStories !== -1}
    >
      <option value="1">Season 1</option>
      <option value="2" selected={true}>Season 2</option>
    </select>
    {#if $storyNodes.length > 0}
      <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
      <div class="episodes-container" bind:this={episodes}>
        {#each $storyNodes as episode, number}
          <div
            role="button"
            tabindex="0"
            class="episode"
            id={number.toString()}
            on:click={switchEpisode}
          >
            <img
              class="episode-image"
              src={episode.image_url}
              alt="Episode {number + 1}"
              draggable="false"
            />
            <p class="episode-title">
              {episode.season ? episode.title : episode.episodeName}
            </p>
            <p class="episode-number">Episode {number + 1}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="season-title loading">Loading Season {$season}</p>
      <div class="progress-bar">
        <div
          class="progress-thumb loading-animation"
          style="width: {$loadingStories}%;"
        ></div>
      </div>
    {/if}
  {:else}
    <span
      class="season-title login-tip"
      on:click={handleNFTsBar}
      role="button"
      tabindex="0"
    >
      Connect web3 account to load Story Nodes
    </span>
  {/if}
</div>

<!-- --- NFTs tab --- -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<span
  bind:this={nftIcon}
  role="button"
  tabindex="0"
  class="nft-icon"
  on:click={handleNFTsBar}
></span>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role a11y_click_events_have_key_events -->
<div class="nft-bar" bind:this={nftBar}>
  <div class="wallet-container" bind:this={walletContainer}>
    {#if $walletAddress}
      <p class="wallet">{$username}</p>
      <div class="nfts-selector-wrapper" bind:this={nftsSelector}>
        {#if width > 600}
          <p>Select Potentials:</p>
        {/if}
        <select
          class="nfts-selector"
          bind:value={selectCondition}
          on:change={selectMultipleNFTs}
          disabled={!$selectedNFTs || $selectedNFTs.length == 0}
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
          on:click={() => {
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
      </div>
    {:else}
      <p class="wallet-legend">Connect Wallet:</p>
    {/if}
    <div class="sign-button-wrapper">
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
          on:click={() => ($showModal = true)}
          on:pointerover={() => (contractSvgFocus = true)}
          on:pointerout={() => (contractSvgFocus = false)}
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
    </div>
  </div>

  {#if $walletAddress}
    {#if $potentials.length > 0}
      <div class="nfts-legend">
        <p class="nfts-total">
          {#if $fetchingDelegations}
            Loading
          {:else}
            Total
          {/if}
          NFTs: {$potentials.length}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-100 -100 200 200"
            class="refresh-svg"
            fill="rgb(51, 226, 230)"
            stroke="rgb(51, 226, 230)"
            stroke-width="20"
            stroke-linejoin="round"
            stroke-linecap="round"
            on:click={() => {
              $potentials = $potentials;
            }}
            on:pointerover={() => (refreshSvgFocus = true)}
            on:pointerout={() => (refreshSvgFocus = false)}
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
        </p>
        <p class="nfts-selected">Selected NFTs: {$selectedNFTs.length}</p>
      </div>
      <div class="nfts-container" bind:this={nftTiles}>
        {#each $potentials as NFT}
          {#await nftVote($episode, NFT.id) then vote}
            <div
              class="nft"
              class:delegated={NFT.delegated}
              id={NFT.id.toString()}
              on:click={selectNFT}
              style={selectedIDs.flat().includes(NFT.id)
                ? `background-color: ${NFT.delegated ? "#50307b" : "#2441BD"}; color: rgba(51, 226, 230, 0.9); box-shadow: 0 0 0.5vw rgb(51, 226, 230); color = #33E2E6; opacity: 1; filter: brightness(125%);`
                : $listedNumbers.includes(NFT.id)
                  ? "background-color: rgb(22, 30, 95);"
                  : `opacity: ${vote > 0 ? "0.5" : "1"}`}
              data-vote={vote}
              role="button"
              tabindex="0"
            >
              <img class="nft-image" src={NFT.image} alt={NFT.name} />
              <p class="nft-name">{NFT.name}</p>
              <p class="nft-class">{NFT.class}</p>
              {#if vote > 0}
                <p class="nft-vote">
                  Selected option: <strong>{vote}</strong>
                </p>
              {/if}
              {#if $listedNumbers.includes(NFT.id)}
                <p class="nft-vote">
                  Listed
                  {#if width > 600}
                    on marketplace
                  {/if}
                </p>
              {/if}
              {#if NFT.delegated}
                <p class="nft-vote">
                  {#if width > 600}
                    Owner: {NFT.delegated}
                  {:else}
                    Delegated
                  {/if}
                </p>
              {/if}
            </div>
          {/await}
        {/each}
      </div>
    {:else}
      <p class="no-nfts-title">
        Your wallet doesn't have any <a
          href="https://magiceden.io/collections/ethereum/0xfa511d5c4cce10321e6e86793cc083213c36278e"
          >Potential</a
        >... You're not allowed to enter the Galactic Governance Hub unless you
        have any delegated NFTs.
      </p>
    {/if}
  {/if}
</div>

<Modal />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions
a11y-no-static-element-interactions -->
<div class="bg" on:click={closeActiveTab} bind:this={BG}></div>

<style>
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

  .progress-bar {
    width: 35vw;
  }

  /* EPISODES bar */
  .season-title {
    text-align: center;
    font-size: 2.5vw;
    line-height: 2.5vw;
    color: rgba(51, 226, 230, 0.9);
    text-shadow: 0 0 0.1vw rgb(51, 226, 230);
  }

  .login-tip {
    color: rgba(51, 226, 230, 0.5);
    text-shadow: none;
    font-size: 2vw;
    line-height: 3vw;
    width: 90%;
    cursor: pointer;
  }

  .login-tip:hover,
  .login-tip:active {
    color: rgb(51, 226, 230);
    text-decoration: underline;
  }

  .loredex {
    width: 35vw;
    font-size: 2vw;
    padding: 0.5vw 1vw;
    line-height: 3vw;
    border-radius: 1.5vw;
  }

  .season {
    width: 35vw;
    text-align: center;
    font-size: 2vw;
    padding: 0.75vw 0;
    line-height: 3vw;
    color: rgba(1, 0, 32, 0.9);
    outline: none;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 1.5vw;
    background-color: rgba(51, 226, 230, 0.5);
    cursor: pointer;
  }

  .season:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .episodes-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    gap: 2vw;
  }

  .episode {
    width: 37vw;
    padding: 0.5vw;
    background-color: rgba(51, 226, 230, 0.5);
    box-shadow:
      inset 0 0 0.5vw #010020,
      0 0 0.5vw #010020;
    border-radius: 1.5vw;
    cursor: pointer;
    transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .episode-image {
    object-fit: cover;
    border-radius: 1vw;
    width: 100%;
    height: 20vw;
    box-shadow: 0 0 0.5vw rgba(51, 226, 230, 0.5);
  }

  .episode-title {
    text-align: center;
    white-space: wrap;
    width: 37vw;
    font-size: 2.5vw;
    line-height: 4vw;
    text-shadow: 0 0 0.1vw #010020;
  }

  .episode-number {
    text-align: center;
    font-size: 1.5vw;
    line-height: 2.5vw;
    opacity: 0.75;
  }

  .episode:hover {
    filter: brightness(125%);
    transform: scale(1.01);
  }

  /* NFTs bar */

  .wallet-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(36, 65, 189, 0.75);
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    box-shadow: 0 0.5vw 0.5vw #010020;
    margin-block: 3vw 1vw;
    margin-inline: 5vw;
    padding: 1vw;
    border-radius: 1.5vw;
  }

  .wallet-legend {
    font-size: 2.5vw;
    text-align: right;
    padding-right: 2.5vw;
  }

  .wallet {
    padding: 0 2vw;
    font-size: 1.5vw;
    line-height: 3vw;
    color: rgba(51, 226, 230, 1);
    background-color: rgba(22, 30, 95, 0.9);
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 1vw;
    white-space: nowrap;
    max-width: 20vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nfts-legend {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    padding-inline: 7.5vw;
  }

  .nfts-selector-wrapper {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 1vw;
    font-size: 1.5vw;
  }

  .sign-button-wrapper {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 1vw;
  }

  .nfts-selector {
    font-size: 1.5vw;
    line-height: 3vw;
    padding-block: 0.75vw;
    width: 15vw;
    text-align: center;
    outline: none;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 1vw;
    cursor: pointer;
    /* color: rgba(1, 0, 32, 0.9); */
    /* background-color: rgba(51, 226, 230, 0.5); */
    color: rgba(51, 226, 230, 0.9);
    background-color: rgba(22, 30, 95, 0.9);
  }

  .nfts-selector:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nfts-total,
  .nfts-selected {
    color: rgb(51, 226, 230);
    -webkit-text-stroke: 0.1vw rgb(51, 226, 230);
    font-size: 2vw;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 1vw;
  }

  .no-nfts-title {
    width: 80%;
    text-align: center;
    font-size: 2vw;
    line-height: 4vw;
    margin: 2vw auto;
    color: rgba(51, 226, 230, 0.8);
  }

  .no-nfts-title a {
    color: rgba(51, 226, 230, 0.9);
    font-size: inherit;
    line-height: inherit;
  }

  .nfts-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    padding: 1vw 2vw;
    gap: 1vw;
  }

  .nft {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 18vw;
    background-color: rgba(36, 65, 189, 0.75);
    color: rgba(255, 255, 255, 0.6);
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 1.5vw;
    box-shadow: 0 0 0.5vw #010020;
    cursor: pointer;
    text-decoration: none;
    flex: none;
    transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .nft:hover,
  .nft:active {
    background-color: rgba(45, 90, 216, 0.9);
    color: rgba(51, 226, 230, 0.9);
    box-shadow: 0 0.5vw 0.5vw #010020;
    transform: scale(1.025) translateY(-0.5vw);
  }

  .nft-image {
    object-fit: cover;
    aspect-ratio: 1/1;
    width: 95%;
    height: 17.5vw;
    margin: 2.5%;
    margin-bottom: 0;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 1vw;
    flex: 1;
    background-color: rgba(0, 0, 0, 0.9);
    cursor: pointer;
  }

  .nft-name {
    text-align: center;
    padding: 1vw;
    font-size: 2vw;
    line-height: 2vw;
    text-shadow: 0 0 1vw rgba(1, 0, 32, 0.4);
    cursor: pointer;
  }

  .nft-class {
    font-size: 1.5vw;
    line-height: 1.5vw;
    opacity: 0.75;
    padding-bottom: 1vw;
  }

  .nft-vote {
    text-align: center;
    font-size: 1.2vw;
    line-height: 1.2vw;
    opacity: 0.5;
    padding-bottom: 1vw;
  }

  .nft-vote strong {
    color: white;
  }

  .loading:after {
    content: "";
    animation: dots 2s linear infinite;
  }

  .delegated {
    background-color: #50307b;
  }

  .delegated:hover,
  .delegated:active {
    background-color: #6b3fa0;
  }

  @media screen and (max-width: 600px) {
    .progress-bar {
      width: 80vw;
    }

    .nft-icon {
      width: 70vw;
      height: 12vw;
      top: 0;
      filter: drop-shadow(0 0.5vw 1vw #010020);
      background-image: url("/sideIconMobileOpen.avif");
    }

    .episodes-icon {
      width: 40vw;
      height: 12vw;
      filter: drop-shadow(0 0.5vw 1vw #010020);
      background-image: url("/episodesMobileOpen.avif");
    }

    .nft-bar,
    .episodes-bar {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      gap: 1em;
      width: 100vw;
      height: 80%;
      top: -80%;
      right: auto;
      left: 0;
      padding: 0 0 1em 0;
      background-image: none;
    }

    .season-title {
      padding-top: 1em;
      font-size: 1.5em;
      line-height: 1.5em;
    }

    .login-tip {
      font-size: 1.5em;
      line-height: 1.5em;
    }

    .loredex {
      width: 80vw;
      font-size: 1.2em;
      line-height: 1.5em;
      padding: 0.5em;
      border-radius: 1em;
    }

    .season {
      width: 80vw;
      font-size: 1.2em;
      line-height: 1.5em;
      padding: 0.5em;
      border-radius: 1em;
    }

    .episodes-container {
      gap: 1em;
    }

    .episode {
      width: 86vw;
      padding: 0.25em;
      padding-bottom: 0.5em;
      border-radius: 1em;
    }

    .episode-image {
      height: 48vw;
      border-radius: 0.75em;
    }

    .episode-title {
      padding-left: 2.5%;
      font-size: 1.25em;
      line-height: 2em;
      width: 95%;
    }

    .episode-number {
      font-size: 1em;
      line-height: 1.5em;
    }

    .wallet-container {
      margin-top: 6vw;
      margin-bottom: 2vw;
      width: 80vw;
      height: auto;
      padding: 0.5em 1em;
      border-radius: 0.5em;
      gap: 0.5em;
    }

    .wallet-legend {
      font-size: inherit;
    }

    .wallet {
      display: none;
      font-size: 1em;
      line-height: 1.75em;
      padding: 0.25em 1em;
      border-radius: 0.5em;
    }

    .nfts-legend {
      width: 90vw;
      padding-inline: 1em;
      gap: 1em;
    }

    .nfts-total,
    .nfts-selected {
      font-size: inherit;
      gap: 0.5em;
    }

    .no-nfts-title {
      font-size: 1em;
      line-height: 1.6em;
      margin-block: 2em;
    }

    .nfts-selector-wrapper {
      font-size: 1em;
      gap: 0.5em;
      flex-direction: row-reverse;
    }

    .sign-button-wrapper {
      gap: 1em;
    }

    .nfts-selector {
      font-size: 1em;
      line-height: 1.5em;
      padding-block: 0.5em;
      width: 25vw;
      border-radius: 0.5em;
    }

    .nfts-container {
      gap: 1em;
    }

    .nft {
      width: 40vw;
      border-radius: 1em;
    }

    .nft-image {
      height: 38vw;
      border-radius: 0.75em;
    }

    .nft-name {
      font-size: 1em;
      line-height: 1.5em;
    }

    .nft-class {
      font-size: 0.9em;
      line-height: 1.5em;
    }

    .nft-vote {
      font-size: 0.9em;
      line-height: 1.5em;
    }
  }

  @keyframes dots {
    0%,
    10% {
      content: "";
    }
    30% {
      content: ".";
    }
    50% {
      content: "..";
    }
    70% {
      content: "...";
    }
    90%,
    100% {
      content: "";
    }
  }
</style>
