import { ethers } from "ethers";
import { provider } from "./ethers";

import { season } from "../stores/storyNode";

const v1 = "0x1E2f59De3C0D51b596e0E9c80FEAa35A2cFBEe50";
const v2 = "0xAA6b453442eeEA74Ee951670d255A9cd89e5e317";

let CONTRACT_ADDRESS: string = v1;
const abi = [
    "function batchVote(uint256 storyNodeId, uint256[] memory tokenIds, uint8[] memory optionIds) external",
    "function getStoryNodesCount() external view returns (uint96)",
    "function getVoteOptionId(uint256 storyNodeId, uint256 tokenId) external view returns (uint8)",
    "function singleVote(uint256 storyNodeId, uint256 tokenId, uint8 optionId) external",
    "function storyNodes(uint256) external view returns (uint128 endTimestamp, uint128 optionCount)",
    "function storyNodeMetadata(uint256) external view returns (string memory)"
]

export const contract = async (): Promise<any> => {
    let seasonNr: number = 1;
    season.subscribe((number) => seasonNr = number);
    
    if (seasonNr === 1 && CONTRACT_ADDRESS !== v1) {
        CONTRACT_ADDRESS = v1;
    } else if (seasonNr !==1 && CONTRACT_ADDRESS !== v2) {
        CONTRACT_ADDRESS = v2;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    return contract.connect(await provider.getSigner());
}
