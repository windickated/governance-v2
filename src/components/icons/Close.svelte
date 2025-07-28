<script lang="ts">
  let {
    onclick = () => {},
    voidBtn = false,
    dark = false,
    hider = false,
  }: {
    onclick: any;
    voidBtn?: boolean;
    dark?: boolean;
    hider?: boolean;
  } = $props();
</script>

<button
  class="flex"
  class:void-btn={voidBtn}
  class:dark
  class:hider
  class:blur={hider}
  {onclick}
  aria-label="Close"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-100 -100 200 200"
    stroke-width="30"
    stroke-linecap="round"
    style:width={voidBtn ? '1.75rem' : ''}
  >
    <path d="M -65 -65 L 65 65 M -65 65 L 65 -65" fill="none" />
  </svg>
</button>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  button {
    pointer-events: auto !important;
    stroke: $red;

    &:active,
    &:hover,
    &:focus {
      stroke: $dark-red;

      svg {
        @include scale(1.2);
        @include bright;
      }
    }

    &.dark {
      stroke: $dark-red;

      &:active,
      &:hover,
      &:focus {
        stroke: $red;
      }
    }

    &.hider {
      position: absolute;
      z-index: 10;
      right: 0;
      top: 0;
      border-radius: 0 1rem 0 1rem;
      border-color: transparent !important;
    }
  }
</style>
