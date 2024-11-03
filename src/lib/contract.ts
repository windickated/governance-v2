import { ethers } from "ethers";
import { provider } from "./ethers";


const CONTRACT_ADDRESS = "0x1E2f59De3C0D51b596e0E9c80FEAa35A2cFBEe50"
const abi = [
    "function batchVote(uint256 storyNodeId, uint256[] memory tokenIds, uint8[] memory optionIds) external",
    "function getStoryNodesCount() external view returns (uint96)",
    "function getVoteOptionId(uint256 storyNodeId, uint256 tokenId) external view returns (uint8)",
    "function singleVote(uint256 storyNodeId, uint256 tokenId, uint8 optionId) external",
    "function storyNodes(uint256) external view returns (uint128 endTimestamp, uint128 optionCount)",
    "function storyNodeMetadata(uint256) external view returns (string memory)"
]

export const contract = async (): Promise<any> => {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    return contract.connect(await provider.getSigner());
}
