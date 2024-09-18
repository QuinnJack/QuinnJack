import { ready, loaded } from './lifecycle.js';

ready(() => {
  const initialPointer1x = getComputedStyle(document.documentElement).getPropertyValue('--cursor-pointer-1x');
  const initialPointer2x = getComputedStyle(document.documentElement).getPropertyValue('--cursor-pointer-2x');

  const bodyElement = document.querySelector('body');
  const navElement = document.querySelector('nav');
  const introElement = document.querySelector('section.intro');
  const aboutElement = introElement.querySelector('.about');
  const projectsElement = document.querySelector('section.projects');
  const projectElements = projectsElement.querySelectorAll('a');
  const footerElement = document.querySelector('footer');

  const stepsHover = [];
  const stepsNonHover = [];
  const hoverModeWidthThreshold = 951;

  let hoverModeActive = true;
  let currentStepIndex = 0;
  let currentCursorPosition = [0, 0];
  let currentlyHoveringProject = false;
  let animationRequestId;
  let backgroundColor = '';
  let foregroundColor = '';

  loaded(() => {
    if (window.scrollY !== 0) {
      stopIntroFadeIn();
    }

    collectScrollSteps();

    window.addEventListener('resize', () => {
      hoverModeActive = window.innerWidth >= hoverModeWidthThreshold ? true : false;
      calculateScrollOffsets();
    });

    window.dispatchEvent(new CustomEvent('resize'));

    window.addEventListener('scroll', () => {
      stopIntroFadeIn();
      handleScroll();
    });

    handleScroll();

    projectsElement.classList.remove('loading');
    footerElement.classList.remove('loading');

    window.addEventListener('mousemove', (event) => {
      currentCursorPosition = [event.clientX, event.clientY];
    });

    projectElements.forEach((projectElement) => {
      projectElement.addEventListener('mouseenter', () => {
        handleHover(projectElement, true);
      });

      projectElement.addEventListener('mouseleave', () => {
        handleHover(projectElement, false);
      });
    });
  });

  function stopIntroFadeIn() {
    navElement.classList.add('no-fade-in');
    aboutElement.classList.add('no-fade-in');
  }

  function collectScrollSteps() {
    const firstStep = {
      offset: 0,
      backgroundColor: bodyElement.getAttribute('data-background-color'),
      foregroundColor: bodyElement.getAttribute('data-foreground-color')
    };

    stepsHover.push(firstStep);
    stepsNonHover.push(firstStep);

    stepsHover.push({
      backgroundColor: projectsElement.getAttribute('data-background-color'),
      foregroundColor: projectsElement.getAttribute('data-foreground-color')
    });

    projectElements.forEach((projectElement) => {
      stepsNonHover.push({
        backgroundColor: projectElement.getAttribute('data-background-color'),
        foregroundColor: projectElement.getAttribute('data-foreground-color')
      });
    });
  }

  function calculateScrollOffsets() {
    stepsHover[1].offset = 
      projectElements[0].getBoundingClientRect().top
      + window.scrollY
      - window.innerHeight / 2
      + projectElements[0].clientHeight / 2;
    stepsHover[1].offsetEnd = 
      projectElements[projectElements.length - 1].getBoundingClientRect().top
      + window.scrollY
      - window.innerHeight / 2
      + projectElements[projectElements.length - 1].clientHeight / 2;

    projectElements.forEach((projectElement, index) => {
      stepsNonHover[index + 1].offset = 
        projectElement.getBoundingClientRect().top
        + window.scrollY
        - window.innerHeight / 2
        + projectElement.clientHeight / 2;
    });

    window.dispatchEvent(new CustomEvent('scroll'));
  }

  function handleScroll() {
    checkIfProjectUnhoveredByScroll();

    const steps = hoverModeActive ? stepsHover : stepsNonHover;
    currentStepIndex = steps.findLastIndex(step => step.offset <= Math.max(window.scrollY, 0));
    const currentStep = steps[currentStepIndex];
    const nextStep = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : false;

    let progress;

    if (nextStep) {
      progress =
        1
        - (nextStep.offset - Math.max(window.scrollY, 0))
        / (nextStep.offset - (currentStep.offsetEnd ?? currentStep.offset));

      if (currentStepIndex === 0) {
        progress = Math.min(progress * (4 / 3), 1);
      } else if (currentStepIndex >= steps.length - 2) {
        progress = Math.max(progress - 0.25, 0) * (4 / 3);
      } else {
        progress = Math.min(Math.max(progress - 0.25, 0) * 2, 1);
      }

      backgroundColor = mixColors(currentStep.backgroundColor, nextStep.backgroundColor, progress);
      foregroundColor = mixColors(currentStep.foregroundColor, nextStep.foregroundColor, progress);
    } else {
      progress = 1;
      backgroundColor = currentStep.backgroundColor;
      foregroundColor = currentStep.foregroundColor;
    }

    if (!currentlyHoveringProject) {
      applyColors(backgroundColor, foregroundColor);
    }

    if (currentStepIndex === 0) {
      const navOpacity = Math.max(progress - 0.5, 0) * 2;
      navElement.style.opacity = navOpacity;
      navElement.style.visibility = navOpacity > 0 ? 'visible' : 'hidden';
      const introOpacity = Math.max(1 - progress * 2, 0);
      introElement.style.opacity = introOpacity;
      introElement.style.visibility = introOpacity > 0 ? 'visible' : 'hidden';
      introElement.style.transform = 'scale(' + (0.98 + 0.02 * Math.max(1 - progress * 2, 0)) + ')';
    } else {
      navElement.style.opacity = 1;
      navElement.style.visibility = 'visible';
      introElement.style.opacity = 0;
      introElement.style.visibility = 'hidden';
    }

    document.documentElement.style.setProperty("--blur-radius", 15.99 + 0.02 * Math.random() + 'px');
  }

  function checkIfProjectUnhoveredByScroll() {
    if (!hoverModeActive || currentStepIndex > 0) return;

    if (animationRequestId && !currentlyHoveringProject) {
      cancelAnimationFrame(animationRequestId);
    }

    const mouseAboveProject = ![...projectElements].every((projectElement) => {
      const projectCoords = projectElement.getBoundingClientRect();
      const isHovering = (
        currentCursorPosition[0] >= projectCoords.left
        && currentCursorPosition[0] <= projectCoords.right
        && currentCursorPosition[1] >= projectCoords.top
        && currentCursorPosition[1] <= projectCoords.bottom
      );
      return isHovering ? false : true;
    });

    if (!mouseAboveProject) {
      currentlyHoveringProject = false;
      applyColors(backgroundColor, foregroundColor);

      document.documentElement.style.setProperty('--cursor-pointer-1x', initialPointer1x);
      document.documentElement.style.setProperty('--cursor-pointer-2x', initialPointer2x);
    }
  }

  function handleHover(projectElement, mouseEntering) {
    if (!hoverModeActive) return;

    if (mouseEntering) {
      transitionColors(projectElement.getAttribute('data-background-color'), projectElement.getAttribute('data-foreground-color'), true);

      document.documentElement.style.setProperty('--cursor-pointer-1x', projectElement.getAttribute('data-pointer-1x'));
      document.documentElement.style.setProperty('--cursor-pointer-2x', projectElement.getAttribute('data-pointer-2x'));
    } else if (currentlyHoveringProject) {
      transitionColors(backgroundColor, foregroundColor, false);

      document.documentElement.style.setProperty('--cursor-pointer-1x', initialPointer1x);
      document.documentElement.style.setProperty('--cursor-pointer-2x', initialPointer2x);
    }

    currentlyHoveringProject = mouseEntering;
  }

  function transitionColors(backgroundColor, foregroundColor, mouseEntering) {
    if (animationRequestId) {
      cancelAnimationFrame(animationRequestId);
    }

    const duration = mouseEntering ? 100 : 300;
    const startTime = Date.now();
    const endTime = startTime + duration;

    const startBackgroundColor = getComputedStyle(bodyElement).getPropertyValue("--background-color");
    const startForegroundColor = getComputedStyle(bodyElement).getPropertyValue("--foreground-color");

    function cycle() {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = Math.min(easeInOutSine(progress), 1);

      const currentBackgroundColor = mixColors(startBackgroundColor, backgroundColor, easedProgress);
      const currentForegroundColor = mixColors(startForegroundColor, foregroundColor, easedProgress);

      applyColors(currentBackgroundColor, currentForegroundColor);

      if (easedProgress < 1 || currentTime < endTime) {
        animationRequestId = requestAnimationFrame(cycle);
      }
    }

    animationRequestId = requestAnimationFrame(cycle);
  }

  function applyColors(backgroundColor, foregroundColor) {
    document.documentElement.style.setProperty('--background-color', backgroundColor);
    document.documentElement.style.setProperty('--foreground-color', foregroundColor);

    backgroundColor = backgroundColor === '255,255,255' ? '254,254,254' : backgroundColor;
    document.head.querySelector('meta[name="theme-color"]').setAttribute('content', `rgb(${backgroundColor})`);
  }

  function mixColors(startColor, endColor, balance) {
    startColor = startColor.split(',');
    endColor = endColor.split(',');

    const b2 = balance;
    const b1 = 1 - b2;
    const rgb = [
      Math.round(startColor[0] * b1 + endColor[0] * b2),
      Math.round(startColor[1] * b1 + endColor[1] * b2),
      Math.round(startColor[2] * b1 + endColor[2] * b2)
    ];

    return rgb.join(',');
  }

  function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }
});