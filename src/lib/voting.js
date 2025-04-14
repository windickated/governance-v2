import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { season, checkingResults, abortVotingCheck } from "../stores/storyNode";

const v1 = '0x1E2f59De3C0D51b596e0E9c80FEAa35A2cFBEe50';
const v2 = '0x8dC749360eA4f408C438C4FC7A272EE1f1250A89'; // prod
// const v2 = '0xe7bAD8bA4C622f6cC77c63B5C1e88f1BbBD722f6'; // test
let CONTRACT_ADDRESS = v1;

const TOTAL_SUPPLY = 1000;
const BATCH_SIZE = 100;

const abi = [
  {
    name: 'getVoteOptionId',
    inputs: [{ type: 'uint256' }, { type: 'uint256' }],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    name: 'storyNodes',
    inputs: [{ type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'endTimestamp', type: 'uint40' },
          { name: 'optionCount', type: 'uint8' },
          { name: 'optionRestrictions', type: 'uint8[]' }
        ],
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const client = createPublicClient({
  chain: base,
  transport: http("https://base-mainnet.g.alchemy.com/v2/awGeW_wSOyFZCQbSHJhl0sIOxs2ww4Ep")
});

async function fetchVotesWithRetry(storyNode, tokenIds) {
  const calls = tokenIds.map(tokenId => ({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'getVoteOptionId',
    args: [storyNode, tokenId]
  }));

  let retries = 3;
  while (retries > 0) {
    try {
      const results = await client.multicall({ contracts: calls });
      return results.map((result, index) => ({
        tokenId: tokenIds[index],
        votingOption: result.status === 'success' ? Number(result.result) : null,
        success: result.status === 'success'
      }));
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function main(storyNode = 0) {
  let seasonNr = 1;
  season.subscribe((number) => seasonNr = number);

  if (seasonNr === 1 && CONTRACT_ADDRESS !== v1) {
    CONTRACT_ADDRESS = v1;
  } else if (seasonNr !==1 && CONTRACT_ADDRESS !== v2) {
    CONTRACT_ADDRESS = v2;
  }

  // Generate array of token IDs
  const tokenIds = Array.from({ length: TOTAL_SUPPLY }, (_, i) => i + 1);
  const batches = [];
  
  for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
    const batch = tokenIds.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  const allResults = [];
  const failedTokenIds = [];
  abortVotingCheck.set(false);
  let checkingStatus = 0;
  checkingResults.set(checkingStatus);

  // Process batches
  for (let i = 0; i < batches.length; i++) {
    // check for abort
    let abort = false;
    abortVotingCheck.subscribe((value) => abort = value);
    if (abort) {
      console.log('Abort fetching results.');
      checkingResults.set(-1);
      return;
    }

    checkingResults.set(checkingStatus += 9);
    console.log(`Processing NFTs batch ${i + 1}/${batches.length}`);
    const results = await fetchVotesWithRetry(storyNode, batches[i]);
    
    results.forEach(result => {
      if (result.success && result.votingOption !== 0) {
        allResults.push({
          tokenId: result.tokenId,
          votingOption: result.votingOption
        });
      } else if (!result.success) {
        failedTokenIds.push(result.tokenId);
      }
    });
  }

  // Retry failed tokens individually
  if (failedTokenIds.length > 0) {
    console.log(`Retrying ${failedTokenIds.length} failed tokens`);
    for (const tokenId of failedTokenIds) {
          // check for abort
          let abort = false;
          abortVotingCheck.subscribe((value) => abort = value);
          if (abort) {
            console.log('Abort fetching results.');
            checkingResults.set(-1);
            return;
          }

      checkingResults.set(checkingStatus += (10 / failedTokenIds.length));
      try {
        const result = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getVoteOptionId',
          args: [storyNode, tokenId]
        });
        
        if (result !== 0n) {
          allResults.push({
            tokenId,
            votingOption: Number(result)
          });
        }
      } catch (error) {
        console.error(`Failed to fetch NFT #${tokenId}:`, error.message);
      }
    }
  }

  const allVotes = [];
  allResults.map((result) => {
    if (result.votingOption) {
      if (result.tokenId <= 10) {
        for (let i = 0; i < 10; i++) {
         allVotes.push(result.votingOption);
        }
      } else {
        allVotes.push(result.votingOption);
      }
    }
  });

  return allVotes;
}

export default main;