<script lang="ts">
  let {
    onclick = () => {},
    rotate = false,
    disabled = false,
  }: {
    onclick: () => void;
    rotate?: boolean;
    disabled?: boolean;
  } = $props();
</script>

<button
  class="void-btn flex"
  class:rotate
  {onclick}
  {disabled}
  aria-label="Switch"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-100 -100 200 200"
    fill="white"
  >
    <polygon
      points="-75 0 -10 -65 -10 65"
      stroke-width="10"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <rect x="-30" y="-25" width="100" height="50" rx="5" />
  </svg>
</button>

<style lang="scss">
  @use "/src/styles/mixins" as *;

  button {
    fill: $cyan;
    stroke: $cyan;
    width: 1.5rem;

    &:hover:not(&:disabled),
    &:active:not(&:disabled),
    &:focus:not(&:disabled) {
      @include bright;
    }

    &.rotate {
      transform: rotate(180deg);
    }

    &:disabled {
      fill: $dark-blue;
      stroke: $dark-blue;
    }
  }
</style>
