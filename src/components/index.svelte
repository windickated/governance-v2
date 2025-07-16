<script lang="ts">
  import ToastContainer from "@components/utils/ToastContainer.svelte";
  import Modal from "@components/utils/Modal.svelte";

  import Display from "@components/Display.svelte";
  import Storynode from "@components/Storynode.svelte";
  import Console from "@components/Console.svelte";
  import Sidebars from "@components/Sidebars.svelte";

  let width = $state<number>(0);
  let scroll = $state<number>(0);
</script>

<svelte:window bind:innerWidth={width} bind:scrollY={scroll} />

<main class="fade-in" style:transform="none">
  <Display />
  <Storynode />
  <Console />
  <Sidebars />
</main>

<Modal />

<ToastContainer />

<div id="background-image" style:top={`max(-${scroll / 100}vh, -100vh)`}></div>

<style lang="scss">
  @use "/src/styles/mixins" as *;

  #background-image {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 200vh;
    background-image: url("/spaceshipBG.avif");
    background-attachment: scroll;
    background-repeat: no-repeat;
    background-position: top;
    background-size: cover;
    z-index: -100;
    transition:
      opacity 0.6s linear,
      filter 0.9s ease-in-out;

    // Fallback if no support
    opacity: 1;
    filter: none;

    @include respond-up(small-desktop) {
      background-attachment: fixed;
      background-position: center;
    }

    @starting-style {
      opacity: 0;
      filter: brightness(125%) contrast(150%);
    }
  }
</style>
