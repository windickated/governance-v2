<script lang="ts">
  import Display from "../components/Display.svelte";
  import Storynode from "../components/Storynode.svelte";
  import Console from "../components/Console.svelte";
  import Sidebars from "../components/Sidebars.svelte";
  import PopUpMessage from "./PopUpMessage.svelte";

  import { onMount } from "svelte";

  import { metamask_init } from "../lib/ethers";
  import { storyNodes, get_nodes } from "../stores/storyNode";

  onMount(async () => {
    if (!(await metamask_init())) return;

    const legend = document.querySelector(".empty-header");
    const pulseKeyframes = new KeyframeEffect(
      legend,
      [{ opacity: "0" }, { opacity: "1" }, { opacity: "0" }],
      {
        duration: 3000,
        easing: "linear",
        iterations: Infinity,
      }
    );
    const pulseAnimation = new Animation(pulseKeyframes);
    pulseAnimation.play();

    try {
      legend!.innerHTML = "Loading episodes...";
      $storyNodes = await get_nodes();
      pulseAnimation.cancel();
      legend!.innerHTML = "Select any episode from the tab";
    } catch (error) {
      alert(
        "Please sign in your wallet and make sure you're on Base network to load Story Nodes."
      );
      console.log(error);
    }
  });

  let showMessage: boolean;
  let messageNote: string;
  let X: number;
  let Y: number;

  const handlePopUpMessage = (event: PointerEvent, note: string) => {
    showMessage = true;
    messageNote = note;
    X = event.clientX;
    Y = event.clientY;
    setTimeout(() => {
      showMessage = false;
    }, 650);
  };
</script>

{#await metamask_init()}
  <div class="blur loading">
    <h1>Loading Web3 data...</h1>
  </div>
{:then provider_exists}
  {#if provider_exists}
    <div class="blur loading" id="welcome">
      <h1>Welcome to the Galactic Governance Hub!</h1>
    </div>
    <main>
      <Display {handlePopUpMessage} />
      <Storynode {handlePopUpMessage} />
      <Console {handlePopUpMessage} />
      <Sidebars {handlePopUpMessage} />

      <PopUpMessage {showMessage} {messageNote} {X} {Y} />
    </main>
  {:else}
    <div class="blur error">
      <h1>There is no Web3 Wallet detected!</h1>
      <h2>Only Web3 users are allowed to enter the Galactic Governance Hub.</h2>
    </div>
  {/if}
{:catch}
  <div class="blur error">
    <h1>Error loading Web3 Wallet...</h1>
    <h2>Please refresh the page or try again later.</h2>
  </div>
{/await}

<style>
  div {
    max-width: 80vw;
    max-height: 20vh;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin-top: auto;
    margin-bottom: auto;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 2vw;
    padding: 3vw 4vw;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 2.5vw;
    background-color: rgba(1, 0, 32, 0.5);
  }

  h1 {
    text-align: center;
    font-size: 2.5vw;
    line-height: 3vw;
  }

  h2 {
    text-align: center;
    font-size: 2vw;
    line-height: 3vw;
    color: #dedede;
  }

  .error {
    color: rgb(255, 60, 64);
    text-shadow: 0 0 0.1vw rgba(255, 60, 64, 0.5);
    border-color: rgba(255, 60, 64, 0.5);
    filter: drop-shadow(0 0 0.1vw rgba(255, 60, 64, 0.1));
  }

  .loading {
    color: rgb(0, 185, 55);
    text-shadow: 0 0 0.1vw rgba(0, 185, 55, 0.5);
    border-color: rgba(0, 185, 55, 0.5);
    filter: drop-shadow(0 0 0.1vw rgba(0, 185, 55, 0.1));
  }

  main {
    opacity: 0;
    animation: 1s show 0.5s ease-out forwards;
  }

  #welcome {
    animation: 0.75s hide 0.25s ease-in-out forwards;
  }

  @media only screen and (max-width: 600px) {
    div {
      max-height: 40vh;
      padding: 1.5em;
      gap: 1.5em;
      border-radius: 0.5em;
    }

    h1 {
      font-size: 1.5em;
      line-height: 1.75em;
    }

    h2 {
      font-size: 1.25em;
      line-height: 1.75em;
    }
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes hide {
    to {
      transform: scale(3);
      opacity: 0;
    }
  }
</style>
