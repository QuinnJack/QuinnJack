const intervalTime = 50;
const textAppearanceDelay = 2500;

export default async () => {
  // await document.fonts.ready does not work properly; therefore periodically
  // check if loading headline font succeeds, then initialize text animations
  const checkInterval = setInterval(async () => {
    document.fonts.load("italic 16px Vulf Mono").then((result) => {
      if (result.length !== 0) {
        initialize();
        clearInterval(checkInterval);
      }
    });
  }, intervalTime);
};

function initialize() {
  document.querySelectorAll("[data-animate]").forEach((element) => {
    // auto-trigger animation if data-blank attribute exists and page is scrolled to top
    if (element.hasAttribute("data-blank")) {
      element.removeAttribute("data-blank");

      if (window.scrollY === 0) {
        // do not start blank if text appearance delay has elapsed
        // (after which text is faded in through CSS animation)
        animateText(element, performance.now() < textAppearanceDelay);
      }
    }

    // retrigger animation upon hover
    if (!element.hasAttribute("data-once")) {
      element.addEventListener("mouseenter", () => {
        animateText(element);
      });
    }

    // retrigger animation upon scrolling back to top on touch-based devices
    if (
      element.hasAttribute(
        "data-trigger-top" && window.matchMedia("(pointer: coarse)").matches
      )
    ) {
      addEventListener("scroll", () => {
        if (window.scrollY === 0) {
          animateText(element);
        }
      });
    }
  });
}

function animateText(element, startBlank = false) {
  if (element.hasAttribute("data-running")) return;

  element.setAttribute("data-running", "");

  const textString = element.innerText;
  const textLength = textString.length;
  const textCharacters = textString.split("");
  const textBreaks = findBreaks(element);

  let initialCharacters;

  if (startBlank) {
    initialCharacters = [];

    for (let c = 0; c < textLength; c++) {
      // if line break occurs at index, insert a regular space character
      if (textBreaks.includes(c)) {
        initialCharacters.push(" ");
      } else {
        // insert a non-breaking space for other characters
        initialCharacters.push("\u00A0"); // "\u00A0" is the Unicode for &nbsp;
      }
    }
  } else {
    initialCharacters = textCharacters.slice(0);
  }

  element.innerText = initialCharacters.join("");

  // create shuffled sequence of character indices
  const unshuffledOrder = Array.from(Array(textLength).keys());
  const shuffledOrder = unshuffledOrder
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  const intermediateSteps = +element.getAttribute("data-intermediate");
  const duration = +element.getAttribute("data-duration");
  const startTime = Date.now();
  const endTime = startTime + duration;
  const totalSteps = textLength + intermediateSteps;
  const easingFunction = startBlank ? easeInQuadOutSine : easeOutSine;

  let currentStep = 0;

  function cycle() {
    const currentTime = Date.now();
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = Math.min(easingFunction(progress), 1);
    const nextStep = Math.floor(easedProgress * totalSteps);

    if (nextStep > currentStep) {
      currentStep = nextStep;

      const currentCharacters = initialCharacters;

      for (let s = 0; s < currentStep; s++) {
        const index = shuffledOrder[s];

        if (textBreaks.includes(index)) {
          // if line break occurs at index, insert a regular space character
          currentCharacters[index] = " ";
        } else if (currentStep - s <= intermediateSteps) {
          currentCharacters[index] = randomCharacter();
        } else {
          currentCharacters[index] = textCharacters[index];
        }
      }

      element.innerText = currentCharacters.join("");
    }

    if (easedProgress < 1 || currentTime < endTime) {
      requestAnimationFrame(cycle);
    } else {
      element.removeAttribute("data-running");
    }
  }

  requestAnimationFrame(cycle);
}

// find line breaks to preserve a regular space character before breaks, avoiding text reflow
function findBreaks(element) {
  element.innerHTML =
    "<span>" + element.innerText.split(" ").join("</span> <span>") + "</span>";

  const words = [...element.querySelectorAll("span")];
  const breaks = [];

  let currentOffset = words[0].offsetTop;
  let currentPosition = words[0].innerText.length;

  for (let w = 1; w < words.length; w++) {
    const newOffset = words[w].offsetTop;

    if (newOffset !== currentOffset) {
      breaks.push(currentPosition);
      currentOffset = newOffset;
    }

    currentPosition += words[w].innerText.length + 1;
  }

  return breaks;
}

function randomCharacter() {
  const characters = "abcdefghijklmnopqrstuvwxyz’";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}

function easeOutSine(x) {
  return Math.sin((x * Math.PI) / 2);
}

function easeInQuadOutSine(x) {
  return x < 0.5 ? 2 * x * x : -(Math.cos(Math.PI * x) - 1) / 2;
}
