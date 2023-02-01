import React, { useState, useEffect, useRef } from "react";
import { ChakraProvider } from '@chakra-ui/react'
import { Oval } from "react-loader-spinner";


function App() {
  const [languages, setLanguages] = useState([]);
  const [versionList, setVersionList] = useState([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [version, setVersion] = useState('');
  const [namespace, setNamespace] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showKeys,setShowKeys] = useState(false)

  const url = 'https://api.locize.app'

  // Push strings to TMS/CMS

  const pushStrings = () => {
    // Get strings
    return window.parent.postMessage({ pluginMessage: { type: "push" } }, "*");
  };

  // Pull strings from CMS/TMS

  const pullStrings = async (locale: string) => {
   try {
    setError('')
    setLoading(true)
    setSuccess('')
    const res = await fetch(
      `${url}/${projectId}/${version}/${locale}/${namespace}`,
      {
        method: "GET",
      }
    );

    const strings = await res.json();
    setLoading(false)

    return window.parent.postMessage(
      { pluginMessage: { type: "pull", payload: JSON.stringify(strings) } },
      "*"
    );
   } catch (error) {
    setError(error.message)
    setLoading(false)
   }
  };

  // Display keys from nodes

  const displayKeys = async  (locale:string) => {
    setShowKeys(true)
    const res = await fetch(
      `${url}/${projectId}/${version}/${locale}/${namespace}`,
      {
        method: "GET",
      }
    );

    const strings = await res.json();

    return window.parent.postMessage(
      { pluginMessage: { type: "displayKeys", payload: JSON.stringify(strings) } },
      "*"
    );
  };

  // Display keys from nodes

  const displayText = async  () => {
    setShowKeys(false)


    return window.parent.postMessage(
      { pluginMessage: { type: "displayText" } },
      "*"
    );
  };

  // Pass the screenshot message to the plugin
  // Plugin will export frame(s) as PNG

  function screenshot() {
    window.parent.postMessage(
      { pluginMessage: { type: "screenshot", selected: false } },
      "*"
    );
  }

  const fetchLangs = async (projectId:string) => {
    const res = await fetch(
      `https://api.locize.app/languages/${projectId}`,
      {
        method: "GET",
      }
    );

    const langs = await res.json();

    // Convert object to an array of languages
    // Merge the 'code' prop from the object's key

    const availableLangs = Object.keys(langs).map((key) => {
      // Set default selected language
      // If it is the reference language
      if (langs[key].isReferenceLanguage) setSelectedLang(key);
      setVersionList(Object.keys(langs[key].translated))

      return Object.assign(langs[key], { code: key });
    });

    setLanguages(availableLangs);
    // setVersionList(Object.keys(languages[0]?.translated))


  };

  // General request function

  const request = async (url: string, method: string, body: BodyInit) => {
    const res = await fetch(url, {
      method: method,
      body: method === "POST" ? body : null,
      mode: method === "POST" ? "cors" : null,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const data = await res.json();

    if (res.status === 200) return data;
    else return `${res.status} - ${res.statusText}`;
  };
  useEffect(() => {
    // Fetch available languages
    fetchLangs(projectId);
  }, [projectId]);

  // Generate URL

  const generateUrl = (url:string,projectId:string,version:string,namespace:string) => {
    
    const endpoint = `${url}/missing/${projectId}/${version}/${selectedLang}/${namespace}`;
    
    
    return endpoint
    
  }

  const onMessage = async (msg: any) => {
    const type = msg.data.pluginMessage?.type;
    
    

    switch (type) {
      // TODO: use ref language
      case "Add strings":
       
        
        
        const endpoint = generateUrl(url, projectId, version, namespace);

        const body = msg.data.pluginMessage.payload;
        if(!saved){
          setError('Save your details!')
        }

        // Add missing translation strings

        if(projectId && version && namespace && saved) {
          setError('')
          setSuccess('')
          setLoading(true)
           request(endpoint, "POST", JSON.stringify(body))
          .then((res) => {
            console.log('Strings pushed to TMS');
            setSuccess('Strings pushed to TMS');
            
          })
          .catch((e) => {
            console.log(e.message);
            setError(e.message)
          })
          .finally(() => {
            setLoading(false)

          })
        }
        

        break;

      default:
        break;
    }
  };

  useEffect(() => {
    
      window.addEventListener("message", (msg) => onMessage(msg));
    return () => window.removeEventListener("message", (msg) => onMessage(msg));
    
  }, [saved]);

  // Listen on the projectId input field

  return (

    <div className="container">
      <div className="header">
        <img src={require("./logo.png")} />
      </div>
      <p className="error-text">{ error && error }</p>
      <p className="success-text">{ success && success }</p>
      <form className="preview-connection-info">
        <input
          type="text"
          placeholder="Project ID"
          onChange={(e) => setProjectId(e.target.value)}
          value={projectId}
        />
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <input
          type="text"
          placeholder="Namespace"
          value={namespace}
          onChange={(e) => setNamespace(e.target.value)}
        />
        <select
          onChange={(e) => setVersion(e.target.value)}
          style={{ width: "100%" }}
          id="locale"
        >
          <option value="" disabled selected>
            Version
          </option>

          {versionList &&
            versionList.map((each, i) => {
              return (
                <option key={i} value={each}>
                  {each}
                </option>
              );
            })}
        </select>
        {selectedLang && 
          <select
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{ width: "100%" }}
            id="locale"
          >
            {languages &&
              languages.map((language, i) => {
                return (
                  <option key={i} value={language?.code}>
                    {language?.name}{" "}
                    {language.isReferenceLanguage && "(Source Language)"}
                  </option>
                );
              })}
          </select>
        }
      </form>
        <div style={{ display: "flex", flexDirection: "column" }}>
       <div style={{ display: "flex",alignItems: "center", justifyContent:"center"}}>
       <Oval
  height={30}
  width={30}
  color="#f79229"
  wrapperStyle={{marginRight: '1em'}}
  wrapperClass=""
  visible={loading}
  ariaLabel='oval-loading'
  secondaryColor="#fff"
  strokeWidth={2}
  strokeWidthSecondary={2}

/>
{loading && <h5>Loading...</h5>}
       </div>
        <button 
          onClick={() => setSaved(true)}
          className={`solid-btn`}
          id="save"
        >
         {saved ? 'Saved' : 'Save'}

        </button>
        </div>
      <div style={{ display: "flex" }}>
    
        <button
          onClick={() => pullStrings(selectedLang)}
          className={`outline-btn`}
          id="pull"
        >
          Pull
        </button>
        <button disabled={!projectId && true} onClick={pushStrings} className={`outline-btn`} id="push">
          Push
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* <button onClick={screenshot} id="screenshot"  className={`outline-btn`}>
          Screenshots
        </button> */}
        <button onClick={() =>{ showKeys ? displayKeys(selectedLang) : displayText()}} id="extract" className={`outline-btn`}>
          { setShowKeys ? 'Display Keys' : 'Show text'}
        </button>
        <div></div>
      </div>
      {/* <div id="key-space" style="width: 100%;"></div> */}
    </div>

  );
}

export default App;
