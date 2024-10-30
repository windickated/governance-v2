import { readable } from "svelte/store";
import { NFT, potentials, selectedNFTs, inactiveNFTs } from "../stores/NFTs";

let _potentials: NFT[];
let _selectedNFTs: NFT[];
let _inactiveNFTs: NFT[];

potentials.subscribe((arr) => _potentials = arr);
selectedNFTs.subscribe((arr) => _selectedNFTs = arr);
inactiveNFTs.subscribe((arr) => _inactiveNFTs = arr);

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
  deactivate: (tile: HTMLDivElement) => {
    tile.style.opacity = '0.5';
  },
  reset: () => {
    _potentials.map((potential) => {
      if (potential.selected) {
        potential.selected = false;
        potential.active = false;
        _inactiveNFTs.push(potential);
      }
    })
    selectedNFTs.set([]);
    inactiveNFTs.set(_inactiveNFTs);
    const inactiveIDs = _inactiveNFTs.map((nft) => nft.id);
    Array.from(document.querySelectorAll(".nft")).forEach((div: any) => {
      if (inactiveIDs.includes(div.id)) {
        handleNftTiles.blur(div);
        handleNftTiles.deactivate(div);
      }
    });
  }
}

export default handleNftTiles;