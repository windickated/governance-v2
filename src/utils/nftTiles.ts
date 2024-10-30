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
    Array.from(document.querySelectorAll(".nft")).forEach((div: any) => {
      handleNftTiles.blur(div);
    });
  }
}

export default handleNftTiles;