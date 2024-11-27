import { NFT, potentials, selectedNFTs } from "../stores/NFTs";
import { episode } from "../stores/storyNode";
import { contract } from "../lib/contract";

let _potentials: NFT[];
let _episode: number;

potentials.subscribe((arr) => _potentials = arr);
episode.subscribe((number) => _episode = number);

const handleNftTiles = {
  focus: (tile: HTMLDivElement) => {
    tile.style.backgroundColor = "#2441BD";
    tile.style.filter = "drop-shadow(0 0 0.5vw rgba(51, 226, 230, 1))";
    tile.style.color = "#33E2E6";
  },
  blur: (tile: HTMLDivElement) => {
    tile.style.backgroundColor = "rgba(22, 30, 95, 0.75)";
    tile.style.filter = "drop-shadow(0 0 0.1vw #010020)";
    tile.style.color = "inherit";
  },
  reset: () => {
    _potentials.map(async (potential) => {
      if (potential.selected) {
        potential.selected = false;
      }
    })
    selectedNFTs.set([]);
    potentials.set(_potentials);
  }
}

export default handleNftTiles;