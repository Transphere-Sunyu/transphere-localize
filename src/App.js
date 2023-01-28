var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from "react";
function App() {
    const API_KEY = "858d06d5-a876-4c3c-9580-98fb7c395cf7";
    const [languages, setLanguages] = useState([]);
    const [versionList, setVersionList] = useState([]);
    const [selectedLang, setSelectedLang] = useState('');
    const [projectId, setProjectId] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [version, setVersion] = useState('');
    const [namespace, setNamespace] = useState('');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const url = 'https://api.locize.app';
    // Push strings to TMS/CMS
    const pushStrings = () => {
        // Get strings
        return window.parent.postMessage({ pluginMessage: { type: "push" } }, "*");
    };
    // Pull strings from CMS/TMS
    const pullStrings = (locale) => __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`${url}/${projectId}/${version}/${locale}/${namespace}`, {
            method: "GET",
        });
        const strings = yield res.json();
        return window.parent.postMessage({ pluginMessage: { type: "pull", payload: JSON.stringify(strings) } }, "*");
    });
    // Display keys from nodes
    const displayKeys = (locale) => __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`${url}/${projectId}/${version}/${locale}/${namespace}`, {
            method: "GET",
        });
        const strings = yield res.json();
        return window.parent.postMessage({ pluginMessage: { type: "displayKeys", payload: JSON.stringify(strings) } }, "*");
    });
    // Pass the screenshot message to the plugin
    // Plugin will export frame(s) as PNG
    function screenshot() {
        window.parent.postMessage({ pluginMessage: { type: "screenshot", selected: false } }, "*");
    }
    const fetchLangs = (projectId) => __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`https://api.locize.app/languages/${projectId}`, {
            method: "GET",
        });
        const langs = yield res.json();
        // Convert object to an array of languages
        // Merge the 'code' prop from the object's key
        const availableLangs = Object.keys(langs).map((key) => {
            // Set default selected language
            // If it is the reference language
            if (langs[key].isReferenceLanguage)
                setSelectedLang(key);
            setVersionList(Object.keys(langs[key].translated));
            return Object.assign(langs[key], { code: key });
        });
        setLanguages(availableLangs);
        // setVersionList(Object.keys(languages[0]?.translated))
    });
    // General request function
    const request = (url, method, body) => __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(url, {
            method: method,
            body: method === "POST" ? body : null,
            mode: method === "POST" ? "cors" : null,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
        });
        const data = yield res.json();
        if (res.status === 200)
            return data;
        else
            return `${res.status} - ${res.statusText}`;
    });
    useEffect(() => {
        // Fetch available languages
        fetchLangs(projectId);
    }, [projectId]);
    // Generate URL
    const generateUrl = (url, projectId, version, namespace) => {
        const endpoint = `${url}/missing/${projectId}/${version}/${selectedLang}/${namespace}`;
        return endpoint;
    };
    const onMessage = (msg) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const type = (_a = msg.data.pluginMessage) === null || _a === void 0 ? void 0 : _a.type;
        switch (type) {
            // TODO: use ref language
            case "Add strings":
                const endpoint = generateUrl(url, projectId, version, namespace);
                const body = msg.data.pluginMessage.payload;
                // Add missing translation strings
                if (projectId && version && namespace) {
                    request(endpoint, "POST", JSON.stringify(body))
                        .then((res) => {
                        console.log('Strings pushed to TMS');
                    })
                        .catch((e) => {
                        console.log(e.message);
                    });
                }
                break;
            default:
                break;
        }
    });
    useEffect(() => {
        window.addEventListener("message", (msg) => onMessage(msg));
        return () => window.removeEventListener("message", (msg) => onMessage(msg));
    }, [saved]);
    // Listen on the projectId input field
    return (React.createElement("div", { className: "container" },
        React.createElement("div", { className: "header" },
            React.createElement("img", { src: require("./logo.png") })),
        React.createElement("form", { className: "preview-connection-info" },
            React.createElement("input", { type: "text", placeholder: "Project ID", onChange: (e) => setProjectId(e.target.value), value: projectId }),
            React.createElement("input", { type: "text", placeholder: "API Key", value: apiKey, onChange: (e) => setApiKey(e.target.value) }),
            React.createElement("input", { type: "text", placeholder: "Namespace", value: namespace, onChange: (e) => setNamespace(e.target.value) }),
            React.createElement("select", { onChange: (e) => setVersion(e.target.value), style: { width: "100%" }, id: "locale" },
                React.createElement("option", { value: "", disabled: true, selected: true }, "Version"),
                versionList &&
                    versionList.map((each, i) => {
                        return (React.createElement("option", { key: i, value: each }, each));
                    })),
            selectedLang &&
                React.createElement("select", { onChange: (e) => setSelectedLang(e.target.value), style: { width: "100%" }, id: "locale" }, languages &&
                    languages.map((language, i) => {
                        return (React.createElement("option", { key: i, value: language === null || language === void 0 ? void 0 : language.code }, language === null || language === void 0 ? void 0 :
                            language.name,
                            " ",
                            language.isReferenceLanguage && "(Source Language)"));
                    }))),
        React.createElement("div", { style: { display: "flex", flexDirection: "column" } },
            React.createElement("button", { onClick: () => setSaved(true), className: `solid-btn`, id: "save" }, saved ? 'Saved' : 'Save')),
        React.createElement("div", { style: { display: "flex" } },
            React.createElement("button", { onClick: () => pullStrings(selectedLang), className: `outline-btn`, id: "pull" }, "Pull"),
            React.createElement("button", { disabled: !projectId && true, onClick: pushStrings, className: `outline-btn`, id: "push" }, "Push")),
        React.createElement("div", { style: { display: "flex", flexDirection: "column" } },
            React.createElement("button", { onClick: screenshot, id: "screenshot", className: `outline-btn` }, "Screenshots"),
            React.createElement("button", { onClick: () => displayKeys(selectedLang), id: "extract", className: `outline-btn` }, "Display Keys"),
            React.createElement("div", null))));
}
export default App;
