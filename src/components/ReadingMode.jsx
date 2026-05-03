import { useEffect, useState } from "react";
import "styles/ReadingMode.css";
import palette from "../assets/palette.png";
import linespacing from "../assets/linespacing.png";
import { useTranslation } from "react-i18next";
const SKIP_DOM_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);

/** Tags whose siblings should be separated like innerText between blocks. */
const BLOCK_LIKE_TAGS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DIV", "DD", "DL", "DT",
  "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6",
  "HEADER", "HR", "LI", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "TD", "TH",
  "TR", "UL", "TBODY", "THEAD", "TFOOT",
]);

function isBlockLikeElement(node) {
  return node.nodeType === Node.ELEMENT_NODE && BLOCK_LIKE_TAGS.has(node.tagName);
}

/** Match innerText-style gaps between block siblings only (avoids extra gaps around inputs). */
function shouldInsertNewlineBetween(prev, next) {
  if (next.nodeType === Node.ELEMENT_NODE && next.tagName === "BR") return false;
  if (prev.nodeType === Node.ELEMENT_NODE && prev.tagName === "BR") return false;
  const prevBreak = prev.nodeType === Node.ELEMENT_NODE && isBlockLikeElement(prev);
  const nextBreak = next.nodeType === Node.ELEMENT_NODE && isBlockLikeElement(next);
  return prevBreak || nextBreak;
}

function appendSiblingBreak(chunks) {
  const last = chunks[chunks.length - 1];
  if (last == null || /\n\s*$/.test(last)) return;
  chunks.push("\n");
}

function getEditableValue(field) {
  if (field instanceof HTMLInputElement) {
    if (["button", "submit", "reset", "file", "hidden"].includes(field.type)) {
      return "";
    }
    return field.value?.trim() || "";
  }
  if (field instanceof HTMLTextAreaElement) {
    return field.value?.trim() || "";
  }
  if (field instanceof HTMLSelectElement) {
    return field.selectedOptions?.[0]?.text?.trim() || "";
  }
  return "";
}

/** Build reader text in document order so live values sit where controls are in the tree. */
function collectReadingTextInDomOrder(root) {
  const chunks = [];

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      chunks.push(node.nodeValue ?? "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node;
    if (SKIP_DOM_TAGS.has(el.tagName)) return;
    if (el.tagName === "BR") {
      chunks.push("\n");
      return;
    }
    if (el.matches("input, textarea, select")) {
      chunks.push(getEditableValue(el));
      return;
    }
    if (!el.querySelector?.("input, textarea, select")) {
      chunks.push(el.innerText ?? "");
      return;
    }
    const children = el.childNodes;
    for (let i = 0; i < children.length; i++) {
      if (i > 0 && shouldInsertNewlineBetween(children[i - 1], children[i])) {
        appendSiblingBreak(chunks);
      }
      walk(children[i]);
    }
  };

  walk(root);
  return chunks.join("").replace(/\r\n/g, "\n").trim();
}

function ReadingMode({ selectedText, screenWidth }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [isPaletteClicked, setIsPaletteClicked] = useState(false);
  const [isLineSpacingClicked, setIsLineSpacingClicked] = useState(false);
  const [textSize, setTextSize] = useState(16);
  const [applyPalette, setPalette] = useState("");
  const [applyLinespacing, setLineSpacing] = useState("");
  useEffect(() => {
    const source = document.querySelector(".page-content");
    const syncReaderText = () => {
      if (!source) {
        setText("");
        return;
      }

      // innerText keeps visible text only and preserves natural line breaks.
      const extractedText = source.innerText?.trim() || "";

      // Include live form values (input/textarea/select) that innerText skips.
      const formValues = Array.from(
        source.querySelectorAll("input, textarea, select")
      )
        .map((field) => getEditableValue(field))
        .filter(Boolean);
        // .join("\n");

      // const splitOnPost = extractedText.split("\n+ Post\n");
      // console.log(window.location.pathname);
      const path = window.location.pathname;
      

      if (path.includes("/community")) {
        // Always DOM-order here so spacing does not jump when innerText → walk on first input.
        setText(collectReadingTextInDomOrder(source));
      } else if (formValues.length > 0) {
        if (path.includes("/create-community")) {
          let name = "";
          let visibility = "";
          let color = "";
          for (let i = 0; i < formValues.length; i++) {
            if (formValues[i].includes("#")) {
              color = formValues[i];
            } else if (formValues[i].includes("Public") || formValues[i].includes("Private")) {
              visibility = formValues[i];
            } else {
              name = formValues[i];
            }
          }

          // console.log(window.location.pathname);

          const splitOne = extractedText.substring(0, extractedText.indexOf("Community Name")+14);
          const splitTwo = extractedText.substring(extractedText.indexOf("Community Name")+15, extractedText.indexOf("Visibility")+10);
          const splitThree = extractedText.substring(extractedText.indexOf("Visibility")+11, extractedText.indexOf("Banner Color")+12);
          const splitFour = extractedText.substring(extractedText.indexOf("Banner Color")+13, extractedText.length);

          const combinedText = [splitOne, name, splitTwo, visibility, splitThree, color, splitFour].filter(Boolean).join("\n");
          setText(combinedText);
        } else if (path.includes("/profile")) {
          if (extractedText.includes("\n×\nEdit Bio\n")) {
            const splitOne = extractedText.substring(0, extractedText.indexOf("\n×\nEdit Bio\n")+11);
            const splitTwo = extractedText.substring(extractedText.indexOf("\n×\nEdit Bio\n")+12, extractedText.length);
            const combinedText = [splitOne, formValues, splitTwo].filter(Boolean).join("\n");
            setText(combinedText);
          } else {
            const combinedText = [formValues, extractedText].filter(Boolean).join("\n");
            setText(combinedText);
          }
        } else if (path.includes("/settings")) {
          // if (formValues.length == 4) {
          //   const splitOne = extractedText.substring(0, extractedText.indexOf("\nDisplay Name\n")+13);
          //   const splitTwo = extractedText.substring(extractedText.indexOf("\nDisplay Name\n")+14, extractedText.indexOf("\nBiography\n")+10);
          //   const splitThree = extractedText.substring(extractedText.indexOf("\nBiography\n")+11, extractedText.indexOf("\nUsername\n")+9);
          //   const splitFour = extractedText.substring(extractedText.indexOf("\nUsername\n")+10, extractedText.indexOf("\nEmail\n")+6);
          //   const splitFive = extractedText.substring(extractedText.indexOf("\nEmail\n")+7, extractedText.length);
          //   const combinedText = [splitOne, formValues[0], splitTwo, formValues[1], splitThree, formValues[2], splitFour, formValues[3], splitFive].filter(Boolean).join("\n");
          //   setText(combinedText);
          // } else {
          //   console.log("we here now");
          //   let email = "";
          //   if (formValues[formValues.length-1].includes("@")) {
          //     email = formValues[formValues.length-1];
          //     formValues.splice(formValues.length-1, 1);
          //   }

          //   const splitOne = extractedText.substring(0, extractedText.indexOf("\nEmail\n")+6);
          //   const splitTwo = extractedText.substring(extractedText.indexOf("\nEmail\n")+7, extractedText.length);

          //   const combinedText = [formValues, splitOne, email, splitTwo].filter(Boolean).join("\n");
          //   setText(combinedText);
          // }
          const combinedText = [formValues, extractedText].filter(Boolean).join("\n");
          setText(combinedText);
        } else {
          const combinedText = [formValues, extractedText].filter(Boolean).join("\n");
          setText(combinedText);
        }
      } else {
        setText(extractedText);
      }
    };

    syncReaderText();

    if (!source) {
      return undefined;
    }

    const observer = new MutationObserver(syncReaderText);
    observer.observe(source, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    source.addEventListener("input", syncReaderText, true);
    source.addEventListener("change", syncReaderText, true);

    return () => {
      observer.disconnect();
      source.removeEventListener("input", syncReaderText, true);
      source.removeEventListener("change", syncReaderText, true);
    };
  }, []);

  // useEffect(() => {
  //   if (selectedText && selectedText.length > 0 && isPaletteClicked) {
  //     setPartOne(text.substring(0, text.indexOf(selectedText)));
  //     setPartTwo(text.substring(text.indexOf(selectedText)+selectedText.length(), text.length));
  //   }
  // }, []);

  function reset() {
    setIsPaletteClicked(false);
    setIsLineSpacingClicked(false);
    setTextSize(16);
    setPalette("");
    setLineSpacing("");
    selectedText = "";
  }

  function adjustTextSize(num) {
    if (num == 1) {
      if (textSize > 8) {
        setTextSize(textSize-2);
      }
    } else if (textSize < 50) {
      setTextSize(textSize+2)
    }
  }

  function close() {
    const userId = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("user-token");
    // console.log(userId)
    fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, { method: "GET" })
      .then((res) => res.json())
      .then((user) => {
        fetch(process.env.REACT_APP_API_PATH + "/users/" + user.id, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes: {
              ...user.attributes,
              readingMode: false,
            }
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            window.location.reload();
            reset();
          })
          .catch((err) => console.error("Request failed:", err));
      });
  }

  return (
    <>
      <div className={(screenWidth>700) ? "readingModeWrapper" : "smallReadingModeWrapper"}>
        <div className="readingModeModifiers">
          <button className="sizeButton" onClick={() => adjustTextSize(0)}>+</button>
          <button className="sizeButton" onClick={() => adjustTextSize(1)}>-</button>
          {isPaletteClicked
            ? <button className="clicked paletteButton" onClick={() => {setIsPaletteClicked(false); setPalette("")}}>
                <img className="paletteIcon" src={palette} alt="reader mode high contrast button" />
              </button>
            : <button className="paletteButton" onClick={() => {setIsPaletteClicked(true); setPalette("applyPalette");}}>
                <img className="paletteIcon" src={palette} alt="reader mode high contrast button" />
              </button>
          }

          {isLineSpacingClicked
            ? <button className="clicked linespacingButton" onClick={() => {setIsLineSpacingClicked(false); setLineSpacing("")}}>
                <img className="linespacingIcon" src={linespacing} alt="reader mode increase line and letter spacing button" />
              </button>
            : <button className="linespacingButton" onClick={() => {setIsLineSpacingClicked(true); setLineSpacing("applyLineSpacing")}}>
                <img className="linespacingIcon" src={linespacing} alt="reader mode increase line and letter spacing button" />
              </button>
          }
          <button className="resetButton" onClick={() => reset()}>
            {t("settings.readingMode.reset")}
          </button>
          
          {/* <button className="sizeButton" onClick={() => setFontSize(fontSize + 1)}>+</button>
          <button className="sizeButton" onClick={() => setFontSize(fontSize - 1)}>-</button> */}
        </div>
        <button className="closeButton" onClick={() => close()}>x</button>
      </div>
      {(selectedText && isPaletteClicked)
      ? <p className={`${(screenWidth>700) ? "text-only" : "small-text-only"} ${applyPalette} ${applyLinespacing}`} style={{ fontSize: `${textSize}px` }}>{selectedText}</p>
      : <div className={`${(screenWidth>700) ? "text-only" : "small-text-only"} ${applyLinespacing}`} style={{ fontSize: `${textSize}px` }}>{text}</div>}
      
    </>
  );
}
export default ReadingMode;


// git commit -m "Moved post modals above posts for display in reader mode; reader mode detects user input"