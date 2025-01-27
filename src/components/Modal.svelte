<script lang="ts">
  import { showModal } from "../stores/modal.ts";
  import {
    NFT,
    potentials,
    getNftNumbers,
    getPotentials,
    walletAddress,
    nftApprovals,
    selectedNFTs,
    checkingDelegations,
    fetchingDelegations,
  } from "../stores/NFTs.ts";
  import {
    checkAddress,
    approveNFTs,
    claimNFTs,
    checkDelegatedWallets,
  } from "../lib/potentials.js";

  let dialog: HTMLDialogElement;
  let userAddress: string = "";
  let checkApproval: boolean = false;

  $: validation =
    userAddress.length == 42 &&
    checkAddress(userAddress) &&
    userAddress !== $walletAddress;

  $: if (dialog && $showModal) {
    dialog.showModal();
  } else if (!$showModal) closeDialog();

  const closeDialog = () => {
    $showModal = false;
    dialog?.close();
  };

  $: if (userAddress && validation) checkDelegation();
  $: if (approval && userAddress.length < 42) approval = null;

  let approval: boolean | null = null;
  const checkDelegation = async () => {
    approval = false;
    const approved = await claimNFTs(userAddress, $walletAddress);
    approval = approved ? true : null;
  };

  $: if ($nftApprovals && $nftApprovals.length > 0) getDelegatedNFTs();

  const getDelegatedNFTs = async () => {
    $fetchingDelegations = true;
    const userNftNumbers = await getNftNumbers($walletAddress);
    let userNFTs = await getPotentials(userNftNumbers);
    for (let i = 0; i < $nftApprovals.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const NFTs = await getPotentials(
          $nftApprovals[i].nfts!,
          $nftApprovals[i].owner
        );
        if (NFTs && NFTs.length > 0) {
          userNFTs = userNFTs!.concat(NFTs);
          $potentials = userNFTs;
        }
      } catch (error) {
        console.log(
          "Failed to fetch delegated NFTs from " +
            $nftApprovals[i].owner +
            ": " +
            error
        );
      }
    }
    if (userNFTs) $potentials = userNFTs;
    localStorage.setItem($walletAddress, JSON.stringify($nftApprovals));
    $fetchingDelegations = false;
  };

  const removeDelegations = async () => {
    const potentialNumbers: number[] = await getNftNumbers($walletAddress);
    const potentialNFTs: NFT[] | null = await getPotentials(potentialNumbers);
    if (potentialNFTs) potentials.set(potentialNFTs);
    nftApprovals.set([]);
    selectedNFTs.set([]);
    localStorage.removeItem($walletAddress);
  };

  const getDelegationsCount = () => {
    let count: number = 0;
    for (let i = 0; i < $nftApprovals.length; i++) {
      count += $nftApprovals[i].nfts!.length;
    }
    return count;
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
  class="blur"
  bind:this={dialog}
  on:close={closeDialog}
  on:click|self={closeDialog}
>
  <!-- svelte-ignore a11y-no-static-element-interactions a11y_no_noninteractive_element_to_interactive_role -->
  <div on:click|stopPropagation>
    <section class="delegate-container">
      <h2>
        Paste the address of your choice to delegate the voting power of your
        Potentials or import delegated Potentials from another wallet.
      </h2>

      <div
        class="address-container"
        style={checkApproval
          ? "background-color: rgba(56, 117, 250, 0.1); color: rgba(56, 117, 250, 0.75); box-shadow: 0 0 0.5vw rgba(56, 117, 250, 0.75);"
          : ""}
      >
        <input
          type="text"
          placeholder="Enter Web3 Address"
          maxlength="42"
          bind:value={userAddress}
          style={checkApproval
            ? "background-color: rgba(56, 117, 250, 0.1); color: rgb(56, 117, 250); border: 0.1vw solid rgba(56, 117, 250, 0.5);"
            : ""}
        />
        {#if !userAddress}{:else if !userAddress.startsWith("0x")}
          <p class="validation">Address should start with "0x..."</p>
        {:else if userAddress.length < 42}
          <p class="validation">Address is too short</p>
        {:else if userAddress == $walletAddress}
          <p class="validation">You can't use your connected address.</p>
        {:else if !validation}
          <p class="validation">Please provide a valid address!</p>
        {/if}

        {#if checkApproval}
          {#if approval == false}
            <p class="validation gray">Checking approval for NFTs...</p>
          {:else if validation && approval == null && userAddress !== $walletAddress}
            <p class="validation">There is no approval for this address.</p>
          {:else if $nftApprovals
            .map((approval) => approval.owner)
            .includes(userAddress)}
            <p class="validation">
              You have already imported NFTs from this address.
            </p>
          {/if}
          <div>
            <p
              on:click={() => (checkApproval = false)}
              style="color: rgba(56, 117, 250, 0.75);"
            >
              Delegate
            </p>
            <span>|</span>
            <button
              disabled={!validation ||
                !approval ||
                userAddress == $walletAddress ||
                $nftApprovals
                  .map((approval) => approval.owner)
                  .includes(userAddress) ||
                $checkingDelegations !== null}
              on:click={async () => {
                $nftApprovals[$nftApprovals.length] = {
                  owner: userAddress,
                  approved: true,
                };
              }}>IMPORT POTENTIALS</button
            >
          </div>
        {:else}
          {#if approval == false}
            <p class="validation gray">Checking approval for NFTs...</p>
          {:else if approval == true}
            <p class="validation green">
              This address can vote with your Potentials!
            </p>
          {/if}
          <div>
            <button
              disabled={!validation ||
                approval ||
                userAddress == $walletAddress}
              on:click={() => {
                approveNFTs(userAddress);
              }}>DELEGATE</button
            >
            <span>|</span>
            <p on:click={() => (checkApproval = true)}>Import Potentials</p>
          </div>
        {/if}
      </div>
      <h2>
        You can always
        <a href="https://revoke.cash/"> revoke your approvals</a>.
      </h2>

      <div class="delegations">
        <h2 class="delegations-count">
          {#if $nftApprovals && $nftApprovals.length > 0}
            Your Delegations:
            <strong>{getDelegationsCount()}</strong>
            NFT{getDelegationsCount() == 1 ? "" : "s"}
          {:else}
            Your Delegations
          {/if}
        </h2>
        {#if $nftApprovals && $nftApprovals.length > 0}
          <ul>
            {#each $nftApprovals as { owner, nfts }, index}
              <li class="wallet">
                <p>{index + 1}</p>
                <span
                  >{owner.slice(0, 6) + "..." + owner.slice(owner.length - 4)}
                  {#if nfts}
                    |
                    {nfts.length} NFT{nfts.length == 1 ? "" : "s"}
                  {/if}</span
                >
                <p
                  class="remove-wallet"
                  role="button"
                  tabindex="0"
                  on:click={() => {
                    $nftApprovals = $nftApprovals.filter(
                      (approval) => approval.owner !== owner
                    );
                    if (!$nftApprovals || $nftApprovals.length < 1) {
                      localStorage.removeItem($walletAddress);
                      removeDelegations();
                    }
                  }}
                >
                  ❌
                </p>
              </li>
            {/each}
          </ul>
        {/if}
        {#if $checkingDelegations}
          <p class="validation gray">{$checkingDelegations}</p>
        {/if}
        <div class="delegation-buttons">
          <button
            on:click={removeDelegations}
            disabled={!$nftApprovals || $nftApprovals.length == 0}>CLEAR</button
          >
          <button
            on:click={checkDelegatedWallets}
            disabled={$checkingDelegations !== null}
          >
            {#if $checkingDelegations}
              <img class="searching" src="/searching.png" alt="Loading" />
              Loading...
            {:else}
              FETCH
            {/if}
          </button>
        </div>
      </div>
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
    width: 70vw;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 2vw;
    padding-block: 1vw;
  }

  h2 {
    width: 60vw;
    text-align: center;
    font-size: 1.5vw;
    line-height: 2.5vw;
  }

  h2 a {
    text-decoration: none;
    color: white;
  }

  h2 a:hover,
  h2 a:active {
    text-decoration: underline;
  }

  .delegations-count {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 0.5vw;
  }

  .address-container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 1.5vw;
    padding: 1.5vw;
    background-color: rgba(51, 226, 230, 0.1);
    box-shadow: 0 0 0.5vw rgba(51, 226, 230, 0.5);
    border-radius: 1.5vw;
    color: rgba(51, 226, 230, 0.5);
    transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
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

  .address-container > div {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 1.5vw;
  }

  .address-container > div > p {
    color: rgba(51, 226, 230, 0.5);
    text-shadow: 0 0 0.1vw #010020;
    cursor: pointer;
    transition: all 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .address-container > div > p:hover,
  .address-container > div > p:active {
    color: rgb(51, 226, 230);
    text-decoration: underline;
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

  .delegations {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 1.5vw;
    padding: 1.5vw;
    background-color: rgba(51, 226, 230, 0.1);
    box-shadow: 0 0 0.5vw rgba(51, 226, 230, 0.5);
    border-radius: 1.5vw;
  }

  .delegations h2 {
    width: 44vw;
  }

  .delegation-buttons {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    gap: 1.5vw;
  }

  .delegations ul {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 1vw;
  }

  .delegations strong {
    color: white;
  }

  .wallet {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    gap: 1vw;
    padding: 0.5vw 1vw;
    font-size: 2vw;
    background-color: rgb(36, 65, 189);
    box-shadow: inset 0 0 0.5vw rgba(51, 226, 230, 0.25);
    border-radius: 1vw;
    cursor: default;
    color: #010020;
  }

  .wallet span {
    text-align: center;
    padding: 1vw 2vw;
    font-size: 1.5vw;
    color: rgba(255, 255, 255, 0.6);
    background-color: rgba(1, 0, 32, 0.5);
    box-shadow: inset 0 0 0.5vw rgba(1, 0, 32, 0.5);
    border-radius: 1vw;
  }

  .remove-wallet {
    cursor: pointer;
  }

  .remove-wallet:hover,
  .remove-wallet:active {
    text-shadow: 0 0 0.5vw rgba(1, 0, 32, 0.5);
    transform: scale(1.05);
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
      font-size: 1.15em;
      line-height: 1.5em;
    }

    .delegations-count {
      gap: 0.5em;
    }

    .address-container {
      gap: 1.5em;
      padding: 1em;
      border-radius: 1em;
    }

    input {
      width: 80vw;
      max-width: 75vw;
      font-size: 1.25em;
      line-height: 1.5em;
      white-space: wrap;
    }

    .address-container > div {
      flex-direction: column;
      gap: 1em;
    }

    .address-container > div > span {
      display: none;
    }

    .validation {
      font-size: 1em;
      line-height: 1.5em;
    }

    .delegations {
      gap: 1.5em;
      padding: 1em;
      border-radius: 1em;
    }

    .delegations h2 {
      width: 80vw;
    }

    .delegation-buttons {
      gap: 1em;
    }

    .delegations ul {
      gap: 1em;
    }

    .wallet {
      gap: 0.5em;
      padding: 0.25em 0.5em;
      font-size: 1em;
      line-height: 1.5em;
      width: auto;
      border-radius: 0.5em;
    }

    .wallet span {
      padding: 0.5em 1em;
      font-size: 1em;
      line-height: 1.5em;
      border-radius: 0.5em;
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
