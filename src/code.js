/// <reference path="../node_modules/@figma/plugin-typings/index.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { visible: true, height: 370 });
// Skip over invisible textNodes and their descendants inside instances
// for faster performance.
figma.skipInvisibleInstanceChildren = true;
// Get Text Nodes
const getTextNodes = () => {
    return figma.currentPage.findAllWithCriteria({
        types: ['TEXT']
    });
};
// Extract Strings
const extractStrings = (textNodes) => {
    const keyObj = {};
    textNodes.map((each) => {
        const parent = each === null || each === void 0 ? void 0 : each.parent;
        const keyName = generateKey(each.name);
        const value = each.characters;
        const key = parent + '_' + keyName;
        const keyValueObj = { [key]: value };
        Object.assign(keyObj, keyValueObj);
    });
    return keyObj;
};
const loadFonts = () => __awaiter(this, void 0, void 0, function* () {
    figma.notify('Loading Fonts');
    const node = getTextNodes();
    // await figma.loadFontAsync({ family: "Inter", style: "Bold" })
    // await figma.loadFontAsync({ family: "Inter", style: "Regular" })
    yield figma.loadFontAsync({ family: "Sora", style: "SemiBold" });
    yield figma.loadFontAsync({ family: "Sora", style: "Regular" });
    yield figma.loadFontAsync({ family: "Sora", style: "Bold" });
    return node;
});
// Generate Translation Keys
const generateKey = (keyName) => {
    // Replace blank space with '_'
    // Transform keyName to lowercase
    const key = keyName.toLowerCase().replaceAll(' ', '_').replaceAll('.', '_').replaceAll(':', '_');
    return key;
};
figma.ui.onmessage = (msg) => __awaiter(this, void 0, void 0, function* () {
    const textNodes = figma.currentPage.findAllWithCriteria({
        types: ['TEXT']
    });
    // const text = figma.createText()
    // Make sure the new text node is visible where we're currently looking
    // text.x = figma.viewport.center.x
    // text.y = figma.viewport.center.y
    // text.characters = msg
    switch (msg.type) {
        // Pull translation strings
        case 'pull':
            loadFonts()
                .then((node) => {
                figma.notify('Fonts loaded');
                const strings = JSON.parse(msg.payload);
                node.map(each => {
                    const k = each.name;
                    const translation = strings[k];
                    if (translation && !undefined) {
                        // each.deleteCharacters(0,3)
                        each.characters = translation;
                    }
                });
            })
                .catch(err => console.log(err.message));
            break;
        // Export Screenshots
        case 'screenshot':
            if (!msg.selected) {
                figma.currentPage.exportAsync({
                    format: 'PNG',
                    suffix: 'png'
                })
                    .then((screen) => {
                    figma.notify('Screenshot generated');
                })
                    .catch(e => {
                    console.log(e.message);
                });
            }
        // Extract Translation Keys
        case 'displayKeys':
            loadFonts()
                .then((node) => {
                figma.notify('Fonts loaded');
                const strings = JSON.parse(msg.payload);
                // console.log(node[112]);
                node.map((each, i) => {
                    const k = each.name;
                    const parent = generateKey(each.parent.name);
                    const key = generateKey(k);
                    const keyName = parent + '_' + key;
                    // const translation = strings[k]
                    if (keyName && !undefined && !each.hasMissingFont) {
                        // each.deleteCharacters(0,3)
                        each.characters = keyName;
                    }
                });
            })
                .catch(err => console.log(err.message));
            break;
        // Push strings to TMS/CMS
        case 'push':
            // Generate keys from Node names
            const strings = extractStrings(textNodes);
            console.log(strings);
            // Post Strings
            figma.ui.postMessage({ type: 'Add strings', payload: strings });
            break;
        default:
            console.log('Null action');
            break;
    }
});
