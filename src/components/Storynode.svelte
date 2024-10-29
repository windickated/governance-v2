<script lang="ts">
  import { onMount } from "svelte";
  import DischordianSaga from "../data/DischordianSaga";

  let width: number;
  let mobileTextVisibility: boolean = false;
  let optionsContainer: HTMLDivElement;
  let votingEnded: boolean;

  class StoryNode {
    title: string;
    duration: string;
    video: string;
    text: string[];
    options: {
      class: string;
      option: string;
    }[];
    constructor(story: any) {
      this.title = story.storyTitle;
      this.duration = getStoryDate(story);
      this.video = `https://www.youtube.com/embed/${story.videoLink}`;
      this.text = story.storyText;
      this.options = story.storyOptions;
    }
  }

  const season = 1;
  const episode = 11;
  const testNode = DischordianSaga[season - 1][episode - 1];

  const storyNode = new StoryNode(testNode);

  onMount(() => {
    resizeOptions();
  });

  function getStoryDate(story: any): string {
    let dateStart: Date = new Date(story.storyDuration[0]);
    let dateEnd: Date = new Date(story.storyDuration[1]);

    let dayStart: string = ("0" + dateStart.getDate()).slice(-2);
    let dayEnd: string = ("0" + dateEnd.getDate()).slice(-2);
    let monthStart: string = ("0" + (dateStart.getMonth() + 1)).slice(-2);
    let monthEnd: string = ("0" + (dateEnd.getMonth() + 1)).slice(-2);
    let yearStart: number = dateStart.getFullYear();
    let yearEnd: number = dateEnd.getFullYear();

    let fullDateStart: string = `${dayStart}.${monthStart}.${yearStart}`;
    let fullDateEnd: string = `${dayEnd}.${monthEnd}.${yearEnd}`;

    let fullDate: string = "Duration: " + fullDateStart + " - " + fullDateEnd;

    let dateNow: Date = new Date();
    votingEnded = dateNow > dateEnd ? true : false;

    return fullDate;
  }

  function resizeOptions() {
    const optionsCounter: number = storyNode.options.length;
    if (width >= 600) {
      if (optionsCounter >= 5) {
        optionsContainer.style.fontSize = `${10 / optionsCounter}vw`;
      } else {
        optionsContainer.style.fontSize = "2.5vw";
      }
    } else {
      optionsContainer.style.fontSize = "1.1em";
    }
  }
</script>

<svelte:window bind:outerWidth={width} />

<section class="story-node-wraper">
  <iframe
    src={storyNode.video}
    class="video visible"
    title="YouTube"
    allowfullscreen
  ></iframe>

  <div class="legend">
    {#if storyNode}
      <h1 class="header">{storyNode.title}</h1>
      <h1 class="season-episode-number">
        The Dischordian Saga: Season {season} - Episode {episode}
      </h1>
      <h2 class="duration">{storyNode.duration}</h2>
    {:else}
      <h1 class="empty-header">Select any episode from the tab</h1>
    {/if}
  </div>

  {#if storyNode}
    <div class="text">
      {#if width <= 600}
        <button
          class="story-text-visibility"
          on:click={() => {
            mobileTextVisibility = !mobileTextVisibility;
          }}
          style={mobileTextVisibility
            ? "border-bottom: 0.1vw solid rgba(51, 226, 230, 0.5)"
            : ""}
        >
          <p>
            {(mobileTextVisibility ? "Hide" : "Show") + " story text"}
          </p>
          <img
            style={mobileTextVisibility ? "transform: rotate(180deg)" : ""}
            src="/dropdown.png"
            alt={mobileTextVisibility ? "Hide" : "Show"}
          />
        </button>
      {/if}
      {#if mobileTextVisibility}
        {#each storyNode.text as paragraph}
          <p class="text-paragraph">{paragraph}</p>
        {/each}
      {/if}
    </div>

    <div class="options" bind:this={optionsContainer}>
      {#each storyNode.options as option, index}
        <div
          class="option"
          id={(index + 1).toString()}
          data-class={option.class}
        >
          <img
            class="option-selector"
            src={option.class ? `/${option.class}.png` : "/option-selector.png"}
            alt="selector"
          />
          <p>{option.option}</p>
        </div>
      {/each}
    </div>

    <span class="voting-ended {votingEnded ? '' : 'voting-active'}">
      {votingEnded ? "Voting ended" : "Voting active"}
    </span>
  {/if}
</section>

<style>
  .story-node-wraper {
    width: 90vw;
    margin-inline: 5vw;
  }

  .video {
    position: absolute;
    height: 47.25vw;
    width: 84.5vw;
    top: 10.25vw;
    left: 7.75vw;
    display: none;
  }

  .legend {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(1, 0, 32, 0.6);
    -webkit-backdrop-filter: blur(1vw);
    backdrop-filter: blur(1vw);
    margin-top: 2vw;
    margin-bottom: -4vw;
    padding: 1.5vw;
    border: 0.1vw solid rgba(51, 226, 230, 0.5);
    border-radius: 2.5vw;
  }

  .empty-header {
    font-size: 3.5vw;
    text-align: center;
    padding: 1vw 0;
    color: #33e2e6;
    opacity: 0.5;
  }

  .header,
  .season-episode-number {
    font-size: 3vw;
    text-align: center;
    -webkit-text-stroke: 0.03vw #33e2e6;
    filter: drop-shadow(0 0 0.1vw #33e2e6);
    line-height: 5vw;
  }

  .season-episode-number {
    font-size: 2.5vw;
    margin-bottom: 2vw;
    opacity: 0.75;
  }

  .duration {
    font-size: 2vw;
    text-align: center;
    -webkit-text-stroke: 0.03vw #33e2e6;
    filter: drop-shadow(0 0 0.1vw #33e2e6);
    color: #bebebe;
  }

  .text {
    position: absolute;
    top: 10.4vw;
    width: 80vw;
    left: 8vw;
    overflow-y: scroll;
    height: 43vw;
    font-size: 2vw;
    line-height: 3vw;
    margin-bottom: auto;
    padding: 2vw;
    background-color: none;
    backdrop-filter: none;
    border: none;
    border-radius: auto;
    color: #bebebe;
    display: none;
  }

  .story-text-visibility {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 12.5vw;
    padding: 0 4vw;
    font-size: 1.1em;
    color: rgba(51, 226, 230, 0.5);
    -webkit-text-stroke: 0.25vw rgba(51, 226, 230, 0.25);
    background-color: rgba(1, 0, 32, 0.25);
    outline: none;
    border: none;
  }

  .story-text-visibility > img {
    width: 5%;
    opacity: 0.5;
  }

  .text-paragraph {
    padding-bottom: 2vw;
  }

  .visible {
    display: block;
  }

  .text::-webkit-scrollbar {
    width: 0.3vw;
    border: none;
  }

  .text::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .text::-webkit-scrollbar-thumb {
    background-color: rgba(51, 226, 230, 0.5);
    border-radius: 0.5vw;
  }

  .options {
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-around;
    position: absolute;
    top: 59vw;
    width: 59vw;
    height: 23.25vw;
    white-space: nowrap;
    margin: 2vw;
    margin-left: 2.75vw;
    margin-bottom: auto;
    padding: 1vw 0 1vw 3vw;
    font-size: 1.1em;
    line-height: 2em;
    overflow-y: hidden;
    background-color: none;
    backdrop-filter: none;
    border: none;
    border-radius: none;
  }

  .options::-webkit-scrollbar {
    height: 0.5vw;
  }

  .options::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0);
  }

  .options::-webkit-scrollbar-thumb {
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0),
      rgba(51, 226, 230, 0.5),
      rgba(0, 0, 0, 0)
    );
    border-radius: 0.5vw;
  }

  .option {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 1vw;
    color: inherit;
    -webkit-text-stroke: 0.01vw #33e2e6;
    background-color: rgba(0, 0, 0, 0);
    border: none;
    cursor: pointer;
  }

  .option-selector {
    height: 3vw;
    width: auto;
    background-image: url("/option-selector.png");
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    opacity: 0.9;
  }

  .option:hover,
  .option:active {
    color: #33e2e6;
    text-shadow: 0 0 3px #33e2e6;
    list-style-type: disc;
  }

  .voting-ended {
    display: block;
    margin-inline: auto;
    margin-top: 8vw;
    margin-bottom: -4vw;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    font-size: 3vw;
    filter: drop-shadow(0 0 1vw 5vw #33e2e6);
    -webkit-text-stroke: 0.2vw rgba(255, 0, 0, 0.1);
  }

  .voting-active {
    color: rgba(51, 226, 230, 0.8);
    -webkit-text-stroke: 0.2vw rgba(0, 255, 0, 0.1);
  }

  .class-validation {
    opacity: 0;
    position: fixed;
    text-align: center;
    width: 90vw;
    top: 40%;
    left: 5vw;
    font-size: 2.5vw;
    line-height: 5vw;
    color: rgba(255, 55, 55, 0.8);
    filter: drop-shadow(0 0 0.5vw rgb(0, 0, 0));
    pointer-events: none;
    transition: cubic-bezier(0.075, 0.82, 0.165, 1) 0.5s;
  }

  .class-validation strong {
    color: rgba(255, 55, 55, 0.9);
  }

  @media screen and (max-width: 600px) {
    .video {
      top: 25.5vw;
      display: block;
    }

    .legend {
      margin-bottom: 0.5em;
      padding: 1em 0.75em;
    }

    .empty-header {
      font-size: 1.2em;
    }

    .header,
    .season-episode-number {
      font-size: 1.2em;
      line-height: 1.6em;
      margin-bottom: 0.5em;
    }

    .season-episode-number {
      font-size: 1em;
    }

    .duration {
      font-size: 1em;
      opacity: 0.75;
    }

    .text {
      position: static;
      top: auto;
      width: auto;
      left: auto;
      overflow-y: auto;
      height: auto;
      font-size: 1em;
      line-height: 1.75em;
      margin-bottom: 2vw;
      background-color: rgba(22, 30, 95, 0.75);
      -webkit-backdrop-filter: blur(2vw);
      backdrop-filter: blur(2vw);
      border: 0.1vw solid rgba(51, 226, 230, 0.5);
      border-radius: 2.5vw;
      padding: 0;
      display: block;
    }

    .text-paragraph {
      padding: 1.5vw 4vw 1.5vw 4vw;
    }

    .options {
      position: static;
      top: auto;
      width: 91vw;
      height: auto;
      font-size: 1.1em;
      white-space: wrap;
      margin-left: -2vw;
      margin-bottom: 4vw;
      padding-top: 2vw;
      background-color: rgba(1, 0, 32, 0.6);
      -webkit-backdrop-filter: blur(1vw);
      backdrop-filter: blur(1vw);
      border: 0.1vw solid rgba(51, 226, 230, 0.5);
      border-radius: 2.5vw;
      padding-top: 2vw;
      padding-bottom: 2vw;
    }

    .option {
      gap: 0.75em;
      margin-bottom: 0.5em;
    }

    .option:last-child {
      margin-bottom: 0;
    }

    .option-selector {
      height: 1.5em;
    }

    .voting-ended {
      font-size: 1.2em;
      margin-top: 0;
      margin-bottom: 0;
    }

    .class-validation {
      font-size: 1.5em;
      line-height: 1.5em;
    }
  }
</style>
