<script lang="ts">
  import { showModal } from "../stores/modal.ts";
  import { walletAddress } from "../stores/NFTs.ts";
  import { checkAddress, approveNFTs, claimNFTs } from "../lib/potentials.js";

  let dialog: HTMLDialogElement;
  let userAddress: string = "";

  $: validation = userAddress.length == 42 && checkAddress(userAddress);

  $: if (dialog && $showModal) {
    dialog.showModal();
  } else if (!$showModal) closeDialog();

  const closeDialog = () => {
    $showModal = false;
    dialog?.close();
  };

  $: if (userAddress && validation) checkDelegation();

  let approval: boolean | null = null;
  const checkDelegation = async () => {
    approval = false;
    const approved = await claimNFTs(userAddress, $walletAddress);
    approval = approved ? true : null;
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
    <section class="delegate-container">
      <h2>
        Paste the address of your choice to delegate the voting power of your
        Potentials
      </h2>
      <h3>
        You can always revoke this approval via 3rd party services like
        <a href="https://revoke.cash/"> revoke.cash </a>
      </h3>
      <input
        type="text"
        placeholder="Enter Web3 Address"
        maxlength="42"
        bind:value={userAddress}
      />
      {#if !userAddress}{:else if !userAddress.startsWith("0x")}
        <p class="validation">Address should start with "0x..."</p>
      {:else if userAddress.length < 42}
        <p class="validation">Address is too short</p>
      {:else if !validation}
        <p class="validation">Please provide a valid address!</p>
      {/if}

      {#if approval == false}
        <p class="validation gray">Checking approval for NFTs...</p>
      {:else if approval == true}
        <p class="validation green">
          Successfuly delegated NFTs to this address!
        </p>
      {:else if validation}
        <p class="validation gray">
          Sign the transaction to delegate your NFTs to this address.
        </p>
      {/if}

      <button
        disabled={!validation}
        on:click={() => {
          approveNFTs(userAddress);
        }}>DELEGATE</button
      >
    </section>
    <button class="close-button" on:click={closeDialog}>
      <img src="/close.png" alt="Close" />
    </button>
  </div>
</dialog>

<style>
  dialog {
    max-width: 80vw;
    max-height: 90vh;
    border: none;
    color: inherit;
    background-color: rgba(1, 0, 32, 0.75);
    box-shadow: inset 0 0 0.5vw rgba(51, 226, 230, 0.5);
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
      rgba(51, 226, 230, 0.3),
      rgba(0, 0, 0, 0)
    );
    border-radius: 0.5vw;
    cursor: pointer;
  }

  dialog::-webkit-scrollbar-thumb:hover,
  dialog::-webkit-scrollbar-thumb:active {
    background: rgba(51, 226, 230, 0.5);
  }

  .close-button {
    position: absolute;
    top: 1vw;
    right: 1vw;
    padding: 0.5vw;
  }

  .close-button img {
    width: 3vw;
    padding: 0.25vw;
    opacity: 0.9;
    height: auto;
    cursor: pointer;
  }

  .delegate-container {
    width: 65vw;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 2vw;
    padding-block: 1vw;
  }

  h2 {
    width: 50vw;
    text-align: center;
    font-size: 2vw;
    line-height: 3vw;
  }

  h3 {
    width: 50vw;
    text-align: center;
    font-size: 1vw;
    line-height: 2vw;
    color: rgba(255, 255, 255, 0.5);
  }

  h3 a {
    text-decoration: none;
    color: rgba(255, 255, 255, 0.6);
  }

  h3 a:hover,
  h3 a:active {
    text-decoration: underline;
  }

  input {
    width: 40vw;
    font-size: 1.5vw;
    line-height: 1.5vw;
    padding: 1.5vw 2vw;
    color: rgba(51, 226, 230, 0.75);
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 1vw;
    background-color: rgba(51, 226, 230, 0.1);
    outline: none;
    text-align: center;
    cursor: text;
  }

  .validation {
    text-align: center;
    font-size: 1.25vw;
    line-height: 1.5vw;
    color: rgba(255, 50, 50, 0.75);
  }

  .gray {
    color: rgba(150, 150, 150, 0.75);
  }

  .green {
    color: rgba(0, 185, 55, 0.75);
  }

  @media only screen and (max-width: 600px) {
    dialog {
      max-width: 95vw;
    }

    .close-button {
      margin: 1em;
      padding: 0.35em;
    }

    .delegate-container {
      width: 95vw;
      gap: 1em;
      padding-block: 0.5em;
    }

    .close-button img {
      width: 1.25em;
    }

    h2 {
      width: 70vw;
      font-size: 1.25em;
      line-height: 1.5em;
    }

    h3 {
      width: 70vw;
      font-size: 1em;
      line-height: 1.5em;
    }

    input {
      width: 80vw;
      max-width: 75vw;
      font-size: 1.25em;
      line-height: 1.5em;
      white-space: wrap;
    }

    .validation {
      font-size: 1em;
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
