<script lang="ts">
  import { onMount } from "svelte";

  export let X: number;
  export let Y: number;
  export let showMessage: boolean = false;
  export let messageNote: string = "";

  let windowWidth: number;
  let windowHeight: number;

  let message: HTMLSpanElement;

  onMount(() => {
    if (!X) X = windowWidth / 2;
    if (!Y) Y = windowHeight / 2;
  });

  $: if (messageNote) message.innerHTML = messageNote;

  $: messageWidth = message ? message.offsetWidth : 0;
  $: messageHeight = message ? message.offsetHeight : 0;

  $: leftPosition = X - messageWidth / 2;
  $: topPosition = Y - messageHeight / 2;

  $: if (leftPosition < 0) leftPosition = 0;
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight} />

<span
  bind:this={message}
  style="opacity: {showMessage
    ? '1'
    : '0'}; left: {leftPosition}px; top: {topPosition}px;"
></span>

<style>
  span {
    z-index: 100;
    text-align: center;
    position: fixed;
    font-size: 2vw;
    line-height: 2.5vw;
    padding: 1vw 2vw;
    border: 0.1vw solid rgba(255, 55, 55, 0.25);
    border-radius: 2.5vw;
    color: rgb(255, 55, 55);
    text-shadow: 0 0 1vw #010020;
    pointer-events: none;
    transition: opacity ease-in-out 0.3s;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(0.5vw);
  }

  @media screen and (max-width: 600px) {
    span {
      font-size: 1.25em;
      line-height: 1.5em;
      padding: 0.5em 1em;
      border-width: 0.1em;
      border-radius: 1em;
      text-shadow: 0 0 1em #010020;
      backdrop-filter: blur(0.5em);
    }
  }
</style>
