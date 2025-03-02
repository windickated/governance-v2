<script lang="ts">
  import Display from "../components/Display.svelte";
  import Storynode from "../components/Storynode.svelte";
  import Console from "../components/Console.svelte";
  import Sidebars from "../components/Sidebars.svelte";
  import PopUpMessage from "./PopUpMessage.svelte";

  let showMessage: boolean;
  let messageNote: string;
  let X: number;
  let Y: number;

  const handlePopUpMessage = (event: PointerEvent, note: string) => {
    showMessage = true;
    messageNote = note;
    X = event.clientX;
    Y = event.clientY;
    setTimeout(() => {
      showMessage = false;
    }, 650);
  };
</script>

<main>
  <Display {handlePopUpMessage} />
  <Storynode {handlePopUpMessage} />
  <Console {handlePopUpMessage} />
  <Sidebars {handlePopUpMessage} />

  <PopUpMessage {showMessage} {messageNote} {X} {Y} />
</main>

<style>
  main {
    opacity: 0;
    animation: 1s show 0.25s ease-out forwards;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
