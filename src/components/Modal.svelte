<script lang="ts">
  import { showModal } from "../stores/modal.ts";
  import handleNftTiles from "../utils/nftTiles.ts";

  export let selectedNftTile: HTMLDivElement;

  let dialog: HTMLDialogElement;

  $: if (dialog && $showModal) {
    dialog.showModal();
  } else if (!$showModal) closeDialog();

  const closeDialog = () => {
    $showModal = false;
    dialog?.close();
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
  class="blur"
  bind:this={dialog}
  on:close={closeDialog}
  on:click|self={closeDialog}
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div on:click|stopPropagation>
    <div class="confirm">
      <h1>Do you want to change this Potential's decision?</h1>
      <div>
        <button class="no-btn" on:click={closeDialog}>NO</button>
        <button
          class="yes-btn"
          on:click={() => {
            handleNftTiles.undoVote(selectedNftTile);
            closeDialog();
          }}>YES</button
        >
      </div>
    </div>
  </div>
</dialog>

<style>
  dialog {
    max-width: 80vw;
    max-height: 90vh;
    border: none;
    color: inherit;
    background-color: rgba(1, 0, 32, 0.75);
    border: 0.05vw solid rgba(51, 226, 230, 0.75);
    border-radius: 2vw;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  dialog[open] {
    animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  dialog[open]::backdrop {
    animation: fade 0.2s ease-out;
  }

  dialog::-webkit-scrollbar {
    width: 0.5vw;
  }

  dialog::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0);
  }

  dialog::-webkit-scrollbar-thumb {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0),
      rgba(51, 226, 230, 0.5),
      rgba(0, 0, 0, 0)
    );
    border-radius: 0.5vw;
  }

  button {
    gap: 1vw;
    padding: 1vw;
    text-shadow: 0 0 0.25vw rgba(1, 0, 32, 0.5);
  }

  h1 {
    text-align: center;
    font-size: 2vw;
    line-height: 3vw;
    padding-inline: 3vw;
  }

  .confirm {
    min-width: 40vw;
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-between;
    gap: 2vw;
    padding-block: 0.5vw;
  }

  .confirm > div {
    display: flex;
    justify-content: center;
    gap: 5vw;
  }

  .confirm button {
    padding: 0.5vw 2vw;
    color: #010020;
    text-shadow: 0 0 0.1vw #010020;
  }

  .no-btn {
    background-color: rgba(255, 60, 64, 0.8);
  }

  .no-btn:hover,
  .no-btn:active {
    color: inherit;
    text-shadow: inherit;
    background-color: rgb(255, 60, 64);
  }

  .yes-btn {
    background-color: rgba(0, 185, 55, 0.8);
  }

  .yes-btn:hover,
  .yes-btn:active {
    color: inherit;
    text-shadow: inherit;
    background-color: rgb(0, 185, 55);
  }

  @media only screen and (max-width: 600px) {
    dialog {
      max-width: 80vw;
    }

    h1 {
      font-size: 1.2em;
      line-height: 1.2em;
    }

    button {
      gap: 1em;
      padding: 1em 1.5em;
      font-size: 1.25em;
      line-height: 1.25em;
    }

    .confirm {
      gap: 1.5em;
      padding-block: 0.5em;
    }

    .confirm h1 {
      line-height: 1.5;
    }

    .confirm > div {
      display: flex;
      justify-content: center;
      gap: 2em;
    }

    .confirm button {
      padding: 0 1.5em;
      font-size: 1.5em;
      line-height: 1.5em;
    }
  }

  @keyframes zoom {
    from {
      transform: scale(1.5);
    }
    to {
      transform: scale(1);
    }
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
