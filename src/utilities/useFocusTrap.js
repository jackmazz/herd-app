import { useEffect, useRef } from "react";

export const useFocusTrap = (isOpen, onClose) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key !== "Tab") return;

            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        const previouslyFocusedElement = document.activeElement;
        document.addEventListener("keydown", handleKeyDown);

        // Focus the first element when the modal opens
        setTimeout(() => {
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements?.length > 0) {
                focusableElements[0].focus();
            }
        }, 100);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocusedElement?.focus();
        };
    }, [isOpen, onClose]);

    return modalRef;
};