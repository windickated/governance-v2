import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

import { ethers } from "ethers";
import { provider } from "./ethers";
import { season } from "../stores/storyNode";

const v1 = "0x1E2f59De3C0D51b596e0E9c80FEAa35A2cFBEe50";
// const v2 = "0x8dC749360eA4f408C438C4FC7A272EE1f1250A89";
const v2 = "0xe7bAD8bA4C622f6cC77c63B5C1e88f1BbBD722f6";

let CONTRACT_ADDRESS: string = v1;
const abi_v1 = [
    "function batchVote(uint256 storyNodeId, uint256[] memory tokenIds, uint8[] memory optionIds) external",
    "function getStoryNodesCount() external view returns (uint96)",
    "function getVoteOptionId(uint256 storyNodeId, uint256 tokenId) external view returns (uint8)",
    "function singleVote(uint256 storyNodeId, uint256 tokenId, uint8 optionId) external",
    "function storyNodes(uint256) external view returns (uint128 endTimestamp, uint128 optionCount)",
    "function storyNodeMetadata(uint256) external view returns (string memory)"
]
const abi_v2 = [
    "function batchVote(uint256 storyNodeId, uint256[] memory tokenIds, uint8[] memory optionIds) external",
    "function createStoryNode(uint8 optionCount, uint8[] memory optionRestrictions, string memory metadata) external returns (uint256)",
    "function getStoryNodesCount() external view returns (uint256)",
    "function getVoteOptionId(uint256 storyNodeId, uint256 tokenId) external view returns (uint8)",
    "function initialize(address initialOwner) external",
    "function i_potentials() external view returns (address)",
    "function owner() external view returns (address)",
    "function pendingOwner() external view returns (address)",
    "function singleVote(uint256 storyNodeId, uint256 tokenId, uint8 optionId) external",
    "function storyNodes(uint256) external view returns (tuple(uint40 endTimestamp, uint8 optionCount, uint8[] optionRestrictions))",
    "function storyNodeMetadata(uint256) external view returns (string)",
    "function VOTE_DURATION() external view returns (uint48)",
    "function acceptOwnership() external",
    "function renounceOwnership() external",
    "function transferOwnership(address newOwner) external"
];

let abi = abi_v1;

export const contract = async (): Promise<any> => {
    let seasonNr: number = 1;
    season.subscribe((number) => seasonNr = number);
    
    if (seasonNr === 1 && CONTRACT_ADDRESS !== v1) {
        CONTRACT_ADDRESS = v1;
        abi = abi_v1;
    } else if (seasonNr !==1 && CONTRACT_ADDRESS !== v2) {
        CONTRACT_ADDRESS = v2;
        abi = abi_v2;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    return contract.connect(await provider.getSigner());
}

// POTENTIALS

const potentials_contract = "0x111e0861baa9d479cff55d542e5a9e4205012bbe";
const potentials_abi = [
    {
        name: 'setApprovalForAll',
        inputs: [{type: 'address'}, {type: 'bool'}],
        type: 'function'
    },
    {
        name: 'ownerOf',
        inputs: [{type: 'uint256'}],
        outputs: [{type: 'address'}],
        stateMutability: 'view',
        type: 'function'
    },
    {
        name: 'isApprovedForAll',
        inputs: [{type: 'address'}, {type: 'address'}],
        outputs: [{type: 'bool'}],
        stateMutability: 'view',
        type: 'function'
    },
    // "function setApprovalForAll(address operator, bool approved) external",
    // "function ownerOf (uint256 tokenId) external view returns (address owner_)",
    // "function isApprovedForAll(address owner, address operator) external view returns (bool isApproved)"
]

const client = createPublicClient({
    chain: base,
    transport: http()
});

const potentialsContract = async (): Promise<any> => {
    const contract = new ethers.Contract(potentials_contract, potentials_abi, provider);
    return contract.connect(await provider.getSigner());
}

export const checkAddress = (address: string) => {
    return ethers.isAddress(address);
}

export const approveNFTs = async (address: string) => {
    return await (await potentialsContract()).setApprovalForAll(address, true);
}

const fetchNftOwnersWithRetry = async (tokenIds: any) => {
    const calls = tokenIds.map((tokenId: any) => {
        return {
            address: potentials_contract,
            abi: potentials_abi,
            functionName: 'ownerOf',
            args: [tokenId]
        }
    })
    let retries = 3;
    while (retries > 0) {
        try {
            const results = await client.multicall({contracts: calls})
            return results.map((result, index) => {
                return {
                    tokenId: tokenIds[index],
                    owner: result.result,
                    success: result.status === 'success'
                }
            })
        } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

export const checkNftBatches = async () => {
    const TOTAL_SUPPLY = 1000;
    const BATCH_SIZE = 100;

    const tokenIds = Array.from({ length: TOTAL_SUPPLY }, (_, i) => i + 1);
    const batches = [];
    
    const allResults = [];
    const failedTokenIds: any = [];
    
    for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
      const batch = tokenIds.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }

    // Process batches
    console.log('Checking Potentials ownership...')
    for (let i = 0; i < batches.length; i++) {
        console.log(`Processing batch ${i + 1}/${batches.length}`);
        const results = await fetchNftOwnersWithRetry(batches[i]);
        
        results?.forEach(result => {
        if (result.success) {
            allResults.push({
                tokenId: result.tokenId,
                owner: result.owner
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
            try {
                const result = await client.readContract({
                address: potentials_contract,
                abi: potentials_abi,
                functionName: 'ownerOf',
                args: [tokenId]
                });
                
                if (result !== 0n) {
                allResults.push({
                    tokenId,
                    owner: result
                });
                }
            } catch (error) {
                console.error(`Failed to fetch token ${tokenId}:`, error);
            }
        }
    }

    return allResults;
}

// export const checkNftsApproval = ()

export const claimNFTs = async (ownerAddress: string, operatorAddress: string) => {
    const validateApprove = await (await potentialsContract()).isApprovedForAll(ownerAddress, operatorAddress);
    return validateApprove;
}