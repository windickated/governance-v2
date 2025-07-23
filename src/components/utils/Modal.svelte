<!-- LEGACY SVELTE 3/4 SYNTAX -->
<script lang="ts">
  import { showModal } from '@stores/modal.ts';
  import {
    NFT,
    potentials,
    getNftNumbers,
    getPotentials,
    nftApprovals,
    selectedNFTs,
    checkingDelegations,
    fetchingDelegations,
  } from '@stores/NFTs.ts';
  import { walletAddress } from '@stores/auth.ts';
  import {
    checkAddress,
    approveNFTs,
    claimNFTs,
    checkDelegatedWallets,
  } from '@lib/potentials.js';

  import LoadingSVG from '@components/icons/Loading.svelte';
  import CloseSVG from '@components/icons/Close.svelte';

  let dialog: HTMLDialogElement;
  let userAddress: string = '';
  let checkApproval: boolean = false;

  $: validation =
    userAddress.length == 42 &&
    checkAddress(userAddress) &&
    userAddress !== $walletAddress;

  $: if (dialog && $showModal) {
    dialog.classList.remove('dialog-fade-out');
    dialog.showModal();
  } else if (dialog) closeDialog();

  const closeDialog = () => {
    dialog.classList.add('dialog-fade-out'); // animation before close
    $showModal = false;
    setTimeout(() => dialog?.close(), 300);
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
          $nftApprovals[i].owner,
        );
        if (NFTs && NFTs.length > 0) {
          userNFTs = userNFTs!.concat(NFTs);
          $potentials = userNFTs;
        }
      } catch (error) {
        console.log(
          'Failed to fetch delegated NFTs from ' +
            $nftApprovals[i].owner +
            ': ' +
            error,
        );
      }
    }
    if (userNFTs) $potentials = userNFTs;
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
    if (!$nftApprovals || $nftApprovals.length < 1) return 0;
    let count: number = 0;
    for (let i = 0; i < $nftApprovals.length; i++) {
      count += $nftApprovals[i].nfts!.length;
    }
    return count;
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events
a11y-no-noninteractive-element-interactions
a11y_no_static_element_interactions -->
<dialog
  class="blur"
  bind:this={dialog}
  on:close={closeDialog}
  on:click|self={closeDialog}
  aria-label="Modal"
>
  <div on:click|stopPropagation>
    <section class="flex">
      <h5>
        Paste the address of your choice to delegate the voting power of your
        Potentials or import delegated Potentials from another wallet.
      </h5>

      <div class="container">
        <input
          type="text"
          placeholder="Enter Web3 Address"
          maxlength="42"
          bind:value={userAddress}
        />
        {#if !userAddress}{:else if !userAddress.startsWith('0x')}
          <p class="validation">Address should start with "0x..."</p>
        {:else if userAddress.length < 42}
          <p class="validation">Address is too short</p>
        {:else if userAddress == $walletAddress}
          <p class="validation">You can't use your connected address</p>
        {:else if !validation}
          <p class="validation">Please provide a valid address!</p>
        {/if}

        {#if checkApproval}
          {#if approval == false}
            <p class="validation gray">Checking approval for NFTs...</p>
          {:else if validation && approval == null && userAddress !== $walletAddress}
            <p class="validation">There is no approval for this address</p>
          {:else if $nftApprovals
            .map((approval) => approval.owner)
            .includes(userAddress)}
            <p class="validation">
              You have already imported NFTs from this address.
            </p>
          {/if}

          <span class="flex-row flex-wrap">
            <button
              class="switcher void-btn"
              on:click={() => (checkApproval = false)}
            >
              Delegate Potentials
            </button>
            <span class="pc-only dark-txt">|</span>
            <button
              class="green-btn"
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
              }}
            >
              Import Potentials
            </button>
          </span>
        {:else}
          {#if approval == false}
            <p class="validation transparent-white-txt">Checking approval for NFTs...</p>
          {:else if approval == true}
            <p class="validation green-txt">
              This address can vote with your Potentials!
            </p>
          {/if}

          <span class="flex-row flex-wrap">
            <button
              class="green-btn"
              disabled={!validation ||
                approval ||
                userAddress == $walletAddress}
              on:click={() => {
                approveNFTs(userAddress);
              }}
            >
              Delegate Potentials
            </button>
            <span class="pc-only dark-txt">|</span>
            <button
              class="switcher void-btn"
              on:click={() => (checkApproval = true)}
            >
              Import Potentials
            </button>
          </span>
        {/if}
      </div>
      <h5>
        You can always
        <a href="https://revoke.cash/"> revoke your approvals</a>.
      </h5>

      <div class="container">
        <h4>
          Your Delegations:
          <strong>{getDelegationsCount()}</strong>
          NFT{getDelegationsCount() == 1 ? '' : 's'}
        </h4>
        {#if $nftApprovals && $nftApprovals.length > 0}
          <ul class="flex">
            {#each $nftApprovals as { owner, nfts }, index}
              <li class="wallet small-orange-tile">
                <h4>{index + 1}</h4>
                <p>
                  {owner.slice(0, 6) + '...' + owner.slice(owner.length - 4)}
                  {#if nfts}
                    |
                    {nfts.length} NFT{nfts.length == 1 ? '' : 's'}
                  {/if}
                </p>
                <CloseSVG
                  onclick={() => {
                    $nftApprovals = $nftApprovals.filter(
                      (approval) => approval.owner !== owner,
                    );
                    if (!$nftApprovals || $nftApprovals.length < 1) {
                      localStorage.removeItem($walletAddress);
                      removeDelegations();
                    }
                  }}
                  voidBtn={true}
                  dark={true}
                />
              </li>
            {/each}
          </ul>
        {/if}
        {#if $checkingDelegations}
          <p class="validation gray">{$checkingDelegations}</p>
        {/if}
        <span class="flex-row">
          {#if $checkingDelegations}
            <LoadingSVG />
            <h5>Loading...</h5>
          {:else}
            <button
              class="red-btn"
              on:click={removeDelegations}
              disabled={!$nftApprovals || $nftApprovals.length == 0}
            >
              CLEAR
            </button>
            <button
              class="green-btn"
              on:click={checkDelegatedWallets}
            >
              FETCH
            </button>
          {/if}
        </span>
      </div>
    </section>
    <CloseSVG onclick={closeDialog} hider={true} />
  </div>
</dialog>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  dialog {
    width: 90%;

    & > div {
      padding: 1.5rem;
      padding-top: 3rem;

      @include respond-up(small-desktop) {
        padding: 1.5rem 3rem;
      }

      a {
        text-decoration: underline;
        @include white-txt;

        &:hover,
        &:active,
        &:focus {
          text-decoration: none;
        }
      }

      .container {
        width: 100%;
        max-width: 50rem;
        animation: none;
        box-shadow: none;
        background-color: $royal-purple;
        border: 1px solid $bright-purple;

        input {
          width: 100%;
          @include dark-blue;
          @include orange-border;
          @include purple(1, text, bright);
        }

        .switcher {
          text-transform: uppercase;
          @include orange(1, text);

          &:hover,
          &:active,
          &:focus {
            text-decoration: underline;
            @include bright;
          }
        }

        .wallet {
          h4 {
            @include dark-red(1, text);
          }
        }
      }

    }
  }
</style>
