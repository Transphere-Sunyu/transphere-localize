/// <reference path="../node_modules/@figma/plugin-typings/index.d.ts" />

figma.showUI(__html__, { visible: true, height: 550 });

// Skip over invisible textNodes and their descendants inside instances
// for faster performance.
figma.skipInvisibleInstanceChildren = true;

// Get Text Nodes
const getTextNodes = () => {
  return figma.currentPage.findAllWithCriteria({
    types: ["TEXT"],
  });
};
// Extract Strings
const extractStrings = (textNodes: any) => {
  const keyObj: Object = {};

  textNodes.map((each: { name: string; parent: any; characters: any }) => {
    const parent = generateKey(each?.parent.name);
    const keyName = generateKey(each.name);
    const value = each.characters;
    const key = parent + "_" + keyName;
    const keyValueObj: object = { [key]: value };

    Object.assign(keyObj, keyValueObj);
  });

  return keyObj;
};
const loadFonts = async () => {
  figma.notify("Loading Fonts");

  const textStyles = figma.getLocalTextStyles();
  const availableFonts = await figma.listAvailableFontsAsync();

  
  for (const textStyle of textStyles) {
    const fontIsAvailable = availableFonts.find(
      (font) => font.fontName.family === textStyle.fontName.family && font.fontName.style === textStyle.fontName.style
    );
    

    if (fontIsAvailable) {
      await figma.loadFontAsync(textStyle.fontName)
    }
  }

  const node = getTextNodes();

  return node;
};


// Generate Translation Keys

const generateKey = (keyName: string) => {
  // Replace blank space with '_'
  // Transform keyName to lowercase
  const key = keyName
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll(".", "_")
    .replaceAll(":", "_")
    .replaceAll("/", "_");

  return key;
};

figma.ui.onmessage = async (msg) => {
  const textNodes = figma.currentPage.findAllWithCriteria({
    types: ["TEXT"],
  });

  // const text = figma.createText()
  // Make sure the new text node is visible where we're currently looking
  // text.x = figma.viewport.center.x
  // text.y = figma.viewport.center.y

  // text.characters = msg
  switch (msg.type) {
    // Pull translation strings
    case "pull":
      loadFonts()
        .then((node) => {
          figma.notify("Fonts loaded");

          const strings = JSON.parse(msg.payload);

          node.map((each) => {
            const parent = generateKey(each?.parent.name);
            const k = generateKey(each.name);
            const key = parent + "_" + k;

            console.log(key);

            const translation = strings[key];

            if (translation && !undefined) {
              // each.deleteCharacters(0,3)
              each.characters = translation;
            }
          });
        })
        .catch((err) => console.log(err.message));
      break;

    // Export Screenshots
    case "screenshot":
      if (!msg.selected) {
        figma.currentPage
          .exportAsync({
            format: "PNG",
            suffix: "png",
          })
          .then((screen) => {
            figma.notify("Screenshot generated");
          })
          .catch((e) => {
            console.log(e.message);
            
          });
      }

    // Extract Translation Keys
    case "displayKeys":
      await loadFonts()
        .then((node) => {
          figma.notify("Fonts loaded");

          const strings = JSON.parse(msg.payload);

          let textObj = {}

          // console.log(node[112]);
          node.map((each, i) => {
            const k = each.name;
            const parent = generateKey(each.parent.name);
            const key = generateKey(k);
            const keyName = parent + "_" + key;

            // const translation = strings[k]


            if (keyName && !undefined && !each.hasMissingFont) {
              // each.deleteCharacters(0,3)
              Object.assign(textObj,{
                key : keyName,
                text : each.characters,

              })
              each.characters = keyName;
            }
            console.log(textObj);
            
          });
        })
        .catch((err) =>{
          let msg = err.message
          let fontName = msg.match(/"([^"]+)"/)[1];
          figma.notify(`Add "${fontName}" to your text styles`,{error: true})
          console.log(err.message)
        });

      break;

    // Push strings to TMS/CMS
    case "push":
      // Generate keys from Node names

      const strings = extractStrings(textNodes);
      console.log(strings);

      // Post Strings
      figma.ui.postMessage({ type: "Add strings", payload: strings });

      break;
    default:
      console.log("Null action");

      break;
  }
};
