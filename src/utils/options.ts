import { selectedOption } from "../stores/storyNode";

let _option: number | null;
selectedOption.subscribe((nr) => _option = nr);

const handleOptions = {
  focus: (div: HTMLDivElement, img: HTMLImageElement) => {
    div.style.textShadow = "0 0 3px #33E2E6";
    div.style.listStyleType = "disc";
    div.style.color = "#33E2E6";
    if (!div.dataset.class) img.src = "/option-selector-hover.png";
  },
  blur: (div: HTMLDivElement, img: HTMLImageElement) => {
    div.style.textShadow = "none";
    div.style.listStyleType = "circle";
    div.style.color = "inherit";
    if (!div.dataset.class) img.src = "/option-selector.png";
  },
  reset: (state: number | null) => {
    selectedOption.set(state);
    Array.from(document.querySelectorAll(".option")).forEach((div: Node) => {
      const option = div as HTMLDivElement;
      const img = option.children[0] as HTMLImageElement;
      if (_option !== Number(option.id)) handleOptions.blur(option, img);
    });
  }
}

export default handleOptions;