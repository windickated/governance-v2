import { ethers, JsonRpcProvider } from 'ethers';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { get } from 'svelte/store';

import {
  nftApprovals,
  checkingDelegations,
  getNftNumbers,
} from '../stores/NFTs';
import { walletAddress, userProvider } from '../stores/auth';
import { SetCache, TTL_MONTH } from '@constants/cache';

const CONTRACT_ADDRESS = '0x111e0861baa9d479cff55d542e5a9e4205012bbe';
const abi = [
  {
    name: 'setApprovalForAll',
    inputs: [{ type: 'address' }, { type: 'bool' }],
    type: 'function',
  },
  {
    name: 'ownerOf',
    inputs: [{ type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'isApprovedForAll',
    inputs: [{ type: 'address' }, { type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const client = createPublicClient({
  chain: base,
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.PUBLIC_ALCHEMY_API_KEY}`,
  ),
});

const potentialsContract = async (providerType = 'alchemy') => {
  let provider;

  if (providerType === 'user') provider = get(userProvider);
  else
    provider = new JsonRpcProvider(
      `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.PUBLIC_ALCHEMY_API_KEY}`,
    );

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  return providerType === 'user'
    ? contract.connect(await provider.getSigner())
    : contract.connect(provider);
};

export const checkAddress = (address) => {
  return ethers.isAddress(address);
};

export const approveNFTs = async (address) => {
  return await (
    await potentialsContract('user')
  ).setApprovalForAll(address, true);
};

const fetchNftOwnersWithRetry = async (tokenIds) => {
  const calls = tokenIds.map((tokenId) => {
    return {
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'ownerOf',
      args: [tokenId],
    };
  });
  let retries = 3;
  while (retries > 0) {
    try {
      const results = await client.multicall({ contracts: calls });
      return results.map((result, index) => {
        return {
          tokenId: tokenIds[index],
          owner: result.result,
          success: result.status === 'success',
        };
      });
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const checkNftBatches = async () => {
  const TOTAL_SUPPLY = 1000;
  const BATCH_SIZE = 100;

  const tokenIds = Array.from({ length: TOTAL_SUPPLY }, (_, i) => i + 1);
  const batches = [];

  const allResults = [];
  const failedTokenIds = [];

  for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
    const batch = tokenIds.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  // Process batches
  for (let i = 0; i < batches.length; i++) {
    const results = await fetchNftOwnersWithRetry(batches[i]);
    await new Promise((resolve) => setTimeout(resolve, 300));

    results?.forEach((result) => {
      if (result.success) {
        allResults.push({
          tokenId: result.tokenId,
          owner: result.owner,
        });
      } else if (!result.success) {
        failedTokenIds.push(result.tokenId);
      }
    });
  }

  // Retry failed tokens individually
  if (failedTokenIds.length > 0) {
    for (const tokenId of failedTokenIds) {
      try {
        const result = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'ownerOf',
          args: [tokenId],
        });

        if (result !== 0n) {
          allResults.push({
            tokenId,
            owner: result,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch NFT #${tokenId}:`, error);
      }
    }
  }

  return allResults;
};

export const claimNFTs = async (ownerAddress, operatorAddress) => {
  const validateApprove = await (
    await potentialsContract()
  ).isApprovedForAll(ownerAddress, operatorAddress);
  return validateApprove;
};

const fetchDelegatedWalletsWithRetry = async (walletsList, operator) => {
  const calls = walletsList.map((owner) => {
    return {
      address: CONTRACT_ADDRESS,
      abi: abi,
      functionName: 'isApprovedForAll',
      args: [owner, operator],
    };
  });
  let retries = 3;
  while (retries > 0) {
    try {
      const results = await client.multicall({ contracts: calls });
      return results.map((result, index) => {
        return {
          owner: walletsList[index],
          approved: result.result,
          success: result.status === 'success',
        };
      });
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const getDelegatedAdresses = async (walletsList, operator) => {
  const TOTAL_SUPPLY = walletsList.length;
  const BATCH_SIZE = TOTAL_SUPPLY / 10;
  const batches = [];

  const allResults = [];
  const failedTokenIds = [];

  for (let i = 0; i < walletsList.length; i += BATCH_SIZE) {
    const batch = walletsList.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  // Process batches
  for (let i = 0; i < batches.length; i++) {
    const results = await fetchDelegatedWalletsWithRetry(batches[i], operator);

    results?.forEach((result) => {
      if (result.success) {
        allResults.push({
          owner: result.owner,
          approved: result.approved,
        });
      } else if (!result.success) {
        failedTokenIds.push(result.owner);
      }
    });
  }

  // Retry failed tokens individually
  if (failedTokenIds.length > 0) {
    let failsCount = 0;
    const nextWalletCount = () => failsCount++;
    checkingDelegations.set(
      `Checking ${failedTokenIds.length} wallets one more time...`,
    );
    for (const owner of failedTokenIds) {
      checkingDelegations.set(
        `Checking ${nextWalletCount()}/${failedTokenIds.length} wallets one more time...`,
      );
      try {
        const result = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: abi,
          functionName: 'isApprovedForAll',
          args: [owner, operator],
        });

        if (result !== 0n) {
          allResults.push({
            owner,
            approved: result,
          });
        }
      } catch (error) {
        console.error(`Failed to fetch wallet ${owner}:`, error);
      }
    }
  }

  return allResults;
};

export const checkDelegatedWallets = async () => {
  const address = get(walletAddress);

  let nftNumbers = await getNftNumbers(address);

  checkingDelegations.set('Checking Potentials ownership...');
  const allNFTs = await checkNftBatches();
  const filteredNFTs =
    nftNumbers.length > 0
      ? allNFTs.filter((nft) => !nftNumbers.includes(nft.tokenId))
      : allNFTs;
  const ownersList = filteredNFTs.map((nft) => nft.owner);
  const filteredOwners = Array.from(new Set(ownersList)); // unique NFT owners
  checkingDelegations.set('Searching for delegated Potentials...');
  const delegatedWallets = (
    await getDelegatedAdresses(filteredOwners, address)
  ).filter((address) => address.approved);
  for (let i = 0; i < delegatedWallets.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    checkingDelegations.set(
      `Fetching delegations ${i}/${delegatedWallets.length}...`,
    );
    delegatedWallets[i].nfts = await getNftNumbers(delegatedWallets[i].owner);
  }
  SetCache(address, delegatedWallets, TTL_MONTH);
  nftApprovals.set(delegatedWallets);
  checkingDelegations.set(null);
};
