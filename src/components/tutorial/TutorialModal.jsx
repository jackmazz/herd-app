import React, { useState, useEffect, useRef } from 'react';
import '../../styles/Tutorial.css';

const TutorialModal = ({ steps, onComplete, onClose }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 for Welcome screen
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const [targetExists, setTargetExists] = useState(false);
    const modalRef = useRef(null);
    const nextBtnRef = useRef(null);
    const [modalStyle, setModalStyle] = useState({});

    // Accessibility: Focus Trapping and Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Close on Escape
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            // Focus Trap on Tab
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Initial focus: focus the modal container so screen readers start at the top
        if (modalRef.current) {
            modalRef.current.focus();
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStepIndex, onClose]);


    useEffect(() => {
        const updatePosition = () => {
            if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
                const step = steps[currentStepIndex];
                // Find all matching elements and pick the one that is currently visible
                const elements = document.querySelectorAll(step.target);
                const element = Array.from(elements).find(el => {
                    const rect = el.getBoundingClientRect();
                    // In a carousel, we want to ensure it has some dimensions
                    // and is actually part of the layout.
                    return rect.width > 0 && rect.height > 0;
                }) || elements[0];

                if (element) {
                    const rect = element.getBoundingClientRect();

                    // If the element is within a carousel/scroll container and not fully visible,
                    // we should still allow the tutorial to proceed if it exists in the DOM.
                    setTargetExists(true);

                    // Using fixed positioning coordinates
                    setCoords({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    });

                    const modalHeight = modalRef.current ? modalRef.current.offsetHeight : 150;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const showAbove = spaceBelow < modalHeight + 40;

                    if (step.position === 'right') {
                        setModalStyle({
                            top: rect.top,
                            left: rect.right + 20
                        });
                    } else {
                        setModalStyle({
                            top: showAbove ? rect.top - modalHeight - 20 : rect.bottom + 20,
                            left: Math.max(10, Math.min(window.innerWidth - 320, rect.left))
                        });
                    }
                } else {
                    setTargetExists(false);
                }
            }
        };

        // Initial position and scroll/resize listeners
        updatePosition();

        // Observe DOM changes to catch elements that appear after a click (like tab switches)
        const observer = new MutationObserver(() => {
            updatePosition();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        // Scroll to the element ONLY when the step changes and noScroll is NOT true
        const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
        const stepElement = currentStep ? document.querySelector(currentStep.target) : null;

        if (currentStep && !currentStep.noScroll) {
            // Use a short timeout to ensure the DOM has updated (especially after tab switches/carousel renders)
            setTimeout(() => {
                const stepElement = document.querySelector(currentStep.target);
                if (stepElement) {
                    stepElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }, 100);
        }

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [currentStepIndex, steps]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            const nextStep = steps[nextIndex];

            // Update index immediately so the content changes
            setCurrentStepIndex(nextIndex);

            // If the step we just entered has a clickTarget, trigger it after
            // a frame to let the new target potentially render
            if (nextStep && nextStep.clickTarget) {
                requestAnimationFrame(() => {
                    const element = document.querySelector(nextStep.clickTarget);
                    if (element) {
                        element.click();
                    }
                });
            }
        } else {
            onComplete();
        }
    };

    if (currentStepIndex === -1) {
        return (
            <div className="tutorial-overlay" style={{ pointerEvents: 'auto' }}>
                <div
                    className="tutorial-modal welcome"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tutorial-welcome-title"
                    tabIndex="-1"
                    ref={modalRef}
                >
                    <div className="tutorial-header">
                        <h2 id="tutorial-welcome-title">Welcome to Herd</h2>
                    </div>
                    <p>This tutorial will guide you through the main features of our site.</p>
                    <div className="tutorial-footer">
                        <button className="tutorial-button" onClick={() => setCurrentStepIndex(0)}>Continue</button>
                    </div>
                </div>
            </div>
        );
    }

    const currentStep = steps[currentStepIndex];

    return (
        <>
            <div className="tutorial-overlay" style={{ pointerEvents: 'auto', background: 'transparent' }} />
            <div className="tutorial-highlight" style={{
                top: coords.top - 5,
                left: coords.left - 5,
                width: coords.width + 10,
                height: coords.height + 10
            }} aria-hidden="true" />
            <div
                ref={modalRef}
                className="tutorial-modal"
                style={modalStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tutorial-step-title"
                tabIndex="-1"
            >
                <div className="tutorial-header">
                    <strong id="tutorial-step-title">Tutorial</strong>
                    <button className="tutorial-close-btn" onClick={onClose} aria-label="Close tutorial">×</button>
                </div>
                <p>{currentStep.content}</p>
                <div className="tutorial-footer">
                    <button
                        ref={nextBtnRef}
                        className={`tutorial-button ${!targetExists ? 'disabled' : ''}`}
                        onClick={handleNext}
                        disabled={!targetExists}
                    >
                        {currentStepIndex === steps.length - 1 ? 'Finish' : 'Continue'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default TutorialModal;