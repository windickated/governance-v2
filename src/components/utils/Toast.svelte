<!-- LEGACY SVELTE 3/4 SYNTAX -->
<script lang="ts">
  import { onMount } from 'svelte';

  export let message: string = '';
  export let type: 'info' | 'error' = 'info';
  export let duration: number = 10000;
  export let onClose = () => {};

  let fading: number;
  let hide: boolean = false;

  const closeToast = () => {
    fading = Math.random();
    setTimeout(() => {
      if (onClose) onClose();
      hide = true;
    }, 600);
  };

  onMount(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, duration - 600);

    return () => {
      clearTimeout(timer);
    };
  });
</script>

<button
  class="void-btn flex-row pad round blur"
  class:info={type === 'info'}
  class:error={type !== 'info'}
  class:fading-left={fading < 0.5}
  class:fading-right={fading >= 0.5}
  class:hide
  on:click={closeToast}
>
  <p>{@html message}</p>
</button>

<style lang="scss">
  @use '/src/styles/mixins' as *;

  button {
    pointer-events: auto;
    max-width: 100%;
    width: fit-content;
    margin-inline: auto;

    transition: all 0.6s ease-out;
    opacity: 1;

    @include white-txt(1);
    @include box-shadow;

    &.info {
      @include green(0.75);
    }

    &.error {
      @include red(0.75);
    }

    &.fading-left {
      opacity: 0;
      transform: translate(-200%, 50%) scaleY(0.5) skew(15deg, -15deg);
    }

    &.fading-right {
      opacity: 0;
      transform: translate(200%, 50%) scaleY(0.5) skew(-15deg, 15deg);
    }

    &.hide {
      display: none;
    }

    @starting-style {
      opacity: 0;
      transform: translateY(-300%) scale(0.75);
    }

    &:hover,
    &:active,
    &:focus {
      @include box-shadow(deep);

      &.info {
        @include green;
      }

      &.error {
        @include red;
      }
    }
  }
</style>
