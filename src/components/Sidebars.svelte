<script lang="ts">
  import {
    storyNodes,
    story,
    season,
    episode,
    selectedOption,
    get_nodes,
  } from "../stores/storyNode.ts";
  import {
    potentials,
    selectedNFTs,
    getNFTs,
    nftVote,
    walletAddress,
    transactionInfo,
  } from "../stores/NFTs.ts";
  import { isLogged } from "../stores/auth.ts";
  import handleOptions from "../utils/options.ts";
  import handleNftTiles from "../utils/nftTiles.ts";
  import Modal from "./Modal.svelte";
  import { showModal } from "../stores/modal.ts";
  import { provider, switch_network, network } from "../lib/ethers";

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

  const switchEpisode = (event: Event) => {
    const target = event.target as HTMLDivElement;
    const episodeContainer =
      target.localName === "div"
        ? target
        : (target.parentElement as HTMLDivElement);
    $episode = Number(episodeContainer?.id);
    handleOptions.reset(null);
  };

  $: if ($episode !== -1) {
    Array.from(episodes.children).forEach((node: ChildNode) => {
      const episode = node as HTMLDivElement;
      if ($episode == Number(episode.id)) {
        episode!.style.color = "#010020";
        episode!.style.filter = "drop-shadow(0 0 1vw rgba(51, 226, 230, 0.8))";
      } else {
        episode.style.color = "inherit";
        episode.style.filter = "none";
      }
    });
  }

  /* --- NFTs --- */

  let walletContainer: HTMLDivElement;
  let walletLegend: HTMLParagraphElement;
  let wallet: HTMLParagraphElement;
  let walletButton: HTMLButtonElement;
  let networkSwitcher: HTMLButtonElement;

  let nftTiles: HTMLDivElement;
  let selectedNftTile: HTMLDivElement;

  async function connectWallet() {
    if (!$isLogged) {
      await provider.getNetwork().then(async (net) => {
        if (net.chainId === BigInt(network.chainId)) {
          await provider.send("eth_requestAccounts", []);
          let reject: boolean = false;
          await getNFTs().then((res) => {
            if (res === null) reject = true;
          });
          if (reject) return;
          $isLogged = true;
          networkSwitcher.style.display = "none";
          walletButton.style.display = "block";
          walletButton.innerHTML = "Disconnect";
          walletLegend.style.display = "none";
          wallet.style.display = "block";
        } else {
          walletLegend.innerHTML = "You're on a wrong network!";
          walletButton.style.display = "none";
          networkSwitcher.style.display = "block";
        }
      });
    } else {
      $isLogged = false;
      $potentials = [];
      walletButton.innerHTML = "Sign in";
      walletLegend.style.display = "block";
      wallet.style.display = "none";
    }
  }

  function selectNFT(event: Event) {
    if ($selectedOption) handleOptions.reset(null);
    const target = event.target as HTMLDivElement;
    const nftTile =
      target.localName === "div"
        ? target
        : (target.parentElement as HTMLDivElement);
    const vote = Number(nftTile.dataset.vote);
    $potentials.map((potential) => {
      if (potential.id.toString() === nftTile?.id) {
        if ($episode === -1) {
          handlePopUpMessage(
            event as PointerEvent,
            "There is no episode selected!"
          );
          return;
        }
        // if ($storyNodes[$episode].ended) {
        //   if (vote !== 0)
        //     handlePopUpMessage(
        //       event as PointerEvent,
        //       `This Potential chose the ${vote}${vote == 1 ? "st" : vote == 2 ? "nd" : vote == 3 ? "rd" : "th"} option.`
        //     );
        //   else
        //     handlePopUpMessage(
        //       event as PointerEvent,
        //       "This Potential missed voting."
        //     );
        //   return;
        // }
        if (vote !== 0 && !potential.selected) {
          handlePopUpMessage(
            event as PointerEvent,
            `This Potential will change his decision.`
          );
          // $showModal = true;
          // selectedNftTile = nftTile;
          // return;
        }
        potential.selected = !potential.selected;
        if (potential.selected) {
          $selectedNFTs.push(potential);
          $selectedNFTs = $selectedNFTs; // for Count re-render
          handleNftTiles.focus(nftTile);
        } else {
          $selectedNFTs = $selectedNFTs.filter((nft) => nft !== potential);
          handleNftTiles.blur(nftTile);
        }
      }
    });
  }

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
</script>

<svelte:window bind:outerWidth={width} />

<Modal {selectedNftTile} />

<!-- --- Episodes tab --- -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<span
  bind:this={episodesIcon}
  role="button"
  tabindex="0"
  class="episodes-icon"
  on:click={handleEpisodesBar}
></span>

<div class="episodes-bar" bind:this={episodesBar}>
  <p class="season-title">The Dishordian Saga</p>
  <select class="season" on:change={switchSeason}>
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
            {episode.episodeName}
          </p>
          <p class="episode-number">Episode {number + 1}</p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="season-title loading">Loading Season {$season}</p>
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

<div class="nft-bar" bind:this={nftBar}>
  <div
    class="wallet-container"
    bind:this={walletContainer}
    style="
    background-color: {$isLogged
      ? 'rgba(22, 30, 95, 0.75)'
      : 'rgba(51, 226, 230, 0.5)'};
    filter: {$isLogged
      ? 'drop-shadow(0 0 0.5vw rgba(51, 226, 230, 0.2))'
      : 'drop-shadow(0 0 1vw rgba(51, 226, 230, 0.5))'}
  "
  >
    <p class="wallet-legend" bind:this={walletLegend}>Connect Wallet:</p>
    <p class="wallet" bind:this={wallet}>{$walletAddress}</p>
    <button
      class="wallet-connect"
      bind:this={walletButton}
      style="
        background-color: {$isLogged ? 'rgba(51, 226, 230, 0.9)' : '#161E5F'};
        color: {$isLogged ? '#010020' : '#33E2E6'}
      "
      on:click={connectWallet}
    >
      Sign in
    </button>
    <button
      class="switch-network"
      bind:this={networkSwitcher}
      on:click={switch_network}
    >
      Switch network
    </button>
  </div>

  {#if $isLogged}
    {#if $potentials.length > 0}
      <div class="nfts-legend">
        <p class="nfts-total">
          Total NFTs: {$potentials.length}
        </p>
        <p class="nfts-selected">Selected NFTs: {$selectedNFTs.length}</p>
      </div>
      <div class="nfts-container" bind:this={nftTiles}>
        {#key $selectedOption}
          {#each $potentials as NFT}
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions
          a11y-no-static-element-interactions -->
            {#await nftVote($episode, NFT.id) then vote}
              <div
                class="nft"
                id={NFT.id.toString()}
                on:click={selectNFT}
                style={vote > 0 ? "opacity: 0.5;" : ""}
                data-vote={vote}
              >
                <img class="nft-image" src={NFT.image} alt={NFT.name} />
                <p class="nft-name">{NFT.name}</p>
                <p class="nft-class">{NFT.class}</p>
                {#if vote > 0}
                  <p class="nft-vote">
                    Selected option: <strong>{vote}</strong>
                  </p>
                {/if}
              </div>
            {/await}
          {/each}
        {/key}
      </div>
    {:else}
      <p class="no-nfts-title">
        Your wallet doesn't have any <a
          href="https://magiceden.io/collections/ethereum/0xfa511d5c4cce10321e6e86793cc083213c36278e"
          >Potential</a
        >... You're not allowed to enter the Galactic Governance Hub.
      </p>
    {/if}
  {:else if $transactionInfo}
    <p class="transaction-info">
      {$transactionInfo}
    </p>
  {/if}
</div>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions
a11y-no-static-element-interactions -->
<div class="bg" on:click={closeActiveTab} bind:this={BG}></div>

<style>
  button {
    transition: all 0.15s ease-in-out;
  }

  button:hover,
  button:active {
    opacity: 0.9;
    transform: scale(1.025);
  }

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
    background-color: rgba(1, 0, 32, 0.5);
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
    width: 40vw;
    display: flex;
    flex-flow: column nowrap;
    background-image: url("/sideBorder.avif");
    background-size: contain;
    background-repeat: no-repeat;
    background-color: rgba(1, 0, 32, 0.5);
    background-position: right;
    -webkit-backdrop-filter: blur(1vw);
    backdrop-filter: blur(1vw);
    filter: drop-shadow(-0.1vw 0.1vw 0.5vw #010020);
    overflow-y: scroll;
    padding: 1vw 2vw;
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

  /* EPISODES bar */

  .season-title {
    text-align: center;
    padding: 2vw;
    font-size: 2.5vw;
    color: rgba(51, 226, 230, 0.9);
    filter: drop-shadow(0 0 1vw 5vw #33e2e6);
  }

  .season {
    width: 35vw;
    margin-inline: auto;
    margin-top: 1vw;
    margin-bottom: 2vw;
    text-align: center;
    font-size: 2vw;
    padding: 1vw 0;
    line-height: 3vw;
    color: rgba(1, 0, 32, 0.9);
    outline: none;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 2vw;
    background-color: rgba(51, 226, 230, 0.5);
    cursor: pointer;
  }

  .episode {
    width: 37vw;
    padding: 0.5vw;
    margin: 1vw;
    margin-bottom: 2vw;
    background-color: rgba(51, 226, 230, 0.4);
    border: 0.05vw solid #33e2e6;
    border-radius: 1.5vw;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .episode-image {
    object-fit: cover;
    border: 0.05vw solid #33e2e6;
    border-radius: 1vw;
    width: 100%;
    height: 20vw;
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
    background-color: rgba(51, 226, 230, 0.5);
    transform: scale(1.01);
  }

  /* NFTs bar */

  .wallet-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(51, 226, 230, 0.5);
    filter: drop-shadow(0 0 1vw rgba(51, 226, 230, 0.5));
    margin: 3vw 5vw 1vw 5vw;
    padding: 1vw 2vw;
    border: 0.05vw solid #33e2e6;
    border-radius: 1.5vw;
  }

  .wallet-legend {
    color: #010020;
    font-size: 2.5vw;
    filter: drop-shadow(0 0 0.05vw #010020);
    text-align: right;
    padding-right: 2.5vw;
  }

  .wallet {
    display: none;
    padding: 0 3vw;
    font-size: 2vw;
    color: rgba(51, 226, 230, 1);
    background-color: rgba(51, 226, 230, 0.2);
    border: 0.05vw solid #33e2e6;
    border-radius: 1vw;
    line-height: 3.5vw;
  }

  .wallet-connect,
  .switch-network {
    height: 3.5vw;
    width: 18vw;
    border: 0.05vw solid #33e2e6;
    border-radius: 1vw;
    font-size: 2vw;
    background-color: #161e5f;
    color: #33e2e6;
  }

  .switch-network {
    display: none;
    background-color: rgba(36, 65, 189, 0.9);
    color: inherit;
  }

  .nfts-legend {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
  }

  .nfts-total,
  .nfts-selected {
    color: #33e2e6;
    -webkit-text-stroke: 0.1vw #33e2e6;
    padding-top: 2.5vw;
    padding-bottom: 1vw;
    padding-left: 5vw;
    padding-right: 5vw;
    font-size: 2vw;
    white-space: nowrap;
  }

  .no-nfts-title,
  .transaction-info {
    width: 80%;
    text-align: center;
    font-size: 2vw;
    line-height: 4vw;
    margin: 2vw auto;
    color: rgba(51, 226, 230, 0.8);
  }

  .no-nfts-title a {
    color: rgba(51, 226, 230, 0.9);
  }

  .nfts-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 1vw 2vw;
  }

  .nft {
    position: relative;
    box-sizing: border-box;
    width: 17vw;
    background-color: rgba(22, 30, 95, 0.75);
    margin: 1vw;
    border: 0.05vw solid rgba(51, 226, 230, 0.75);
    border-radius: 1.5vw;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 0 0.1vw #010020);
    transition: all 0.15s ease-in-out;
    padding-bottom: 0.5vw;
  }

  .nft:hover,
  .nft:active {
    transform: scale(1.025);
  }

  .nft-image {
    object-fit: cover;
    height: 16vw;
    width: 95%;
    margin: 2.5%;
    border: 0.05vw solid #33e2e6;
    border-radius: 1vw;
  }

  .nft-name {
    font-size: 2vw;
    line-height: 3vw;
  }

  .nft-class {
    font-size: 1.5vw;
    line-height: 2.5vw;
    opacity: 0.75;
  }

  .nft-vote {
    font-size: 1.2vw;
    line-height: 2.5vw;
    opacity: 0.5;
  }

  .nft-vote strong {
    color: white;
  }

  .loading:after {
    content: "";
    animation: dots 2s linear infinite;
  }

  @media screen and (max-width: 600px) {
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
      width: 100vw;
      height: 80%;
      top: -80%;
      right: auto;
      left: 0;
      padding: 0;
      background-image: none;
    }

    .season-title {
      font-size: 1.5em;
      line-height: 3em;
      padding: 0;
    }

    .season {
      width: 80vw;
      font-size: 1.2em;
      line-height: 1.5em;
      margin: 0;
      margin-bottom: 1em;
    }

    .episode {
      width: 86vw;
      padding: 0.25em;
      padding-bottom: 0.5em;
      margin-top: 0;
      margin-bottom: 1em;
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
    }

    .wallet-legend {
      font-size: inherit;
    }

    .wallet {
      font-size: inherit;
      padding: 2vw 3vw;
    }

    .wallet-connect,
    .switch-network {
      font-size: inherit;
      width: 38vw;
      height: 8vw;
    }

    .nfts-legend {
      width: 90vw;
    }

    .nfts-total,
    .nfts-selected {
      font-size: inherit;
    }

    .no-nfts-title,
    .transaction-info {
      font-size: 1em;
      line-height: 1.6em;
      margin-block: 2em;
    }

    .nft {
      width: 46vw;
      padding-bottom: 0.5em;
      border-radius: 1em;
    }

    .nft-image {
      height: 40vw;
      border-radius: 0.75em;
    }

    .nft-name {
      font-size: 1.1em;
      line-height: 1.75em;
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
