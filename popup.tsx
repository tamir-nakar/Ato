import { Button, Collapse, Divider, Flex, Input, Layout, message, Radio, Switch, Tour } from "antd";
import { useEffect, useRef, useState } from "react";
import { sendToBackground } from "@plasmohq/messaging";
import { organizeByCategory, organizeByLastAccess, organizeByPrediction, toggleGroups, ungroupAllTabs } from "./index";
import { containerStyle, ContentStyle, HeaderStyle } from './popup.style';
import './global.css';
import type { TourProps } from 'antd';
import tour1 from "data-base64:~assets/tour1.jpeg";
import tour2 from "data-base64:~assets/tour2.jpeg";
import tour3 from "data-base64:~assets/tour3.jpeg";
import type { Message } from "~types";
import { Footer } from "~node_modules/antd/es/layout/layout";
import { FooterStyle } from "./popup.style";


const { Header, Content } = Layout;

enum Emethod {
  CATEGORY = 'category',
  LAST_ACCESS = 'access',
  PREDICTION = 'prediction'
}

function IndexPopup() {
  const [apiKey, setApiKey] = useState('');
  const [method, setMethod] = useState(Emethod.CATEGORY);
  const [autoMode, setAutoMode] = useState<boolean>(false);
  const [tabCollapse, setTabCollapse] = useState(true)
  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const [collapse, setCollapse] = useState(true)
  const [messageApi, contextHolder] = message.useMessage();
  const settingsRef = useRef(null);
  const linkRef = useRef(null);
  const apiKeyRef = useRef(null);

  const options = [
    { label: 'on the fly (auto)', value: true },
    { label: 'On demand (manual)', value: false },
  ];
  const groupMethodOptions = [
    { label: 'Category 📚', value: Emethod.CATEGORY },
    { label: 'Last access 🕓', value: Emethod.LAST_ACCESS },
    { label: 'Prediction 🧠', value: Emethod.PREDICTION },
  ];

  const generalErrorMessage = () => {
    messageApi.open({
      type: 'error',
      content: "Oops! It seems we've encountered an issue. The AI might need a break, or your API key could be invalid. Please double-check and try again.",
      duration: 5,
    });
  };

  const errorMessageKeyInvalid = () => {
    messageApi.open({
      type: 'error',
      content: "Oops! Your API key seems invalid 🤔. Please re-check it or provide a new one",
      duration: 5,
    });
  };
  const tourSteps: TourProps['steps'] = [
    {
      title: 'API_KEY is missing',
      description: "This extension must have an GenAi app-key to work. Do not worry, it's easy! first open settings below 👇🏻",
      target: () => settingsRef.current,
      // onNext: () => 
    },
    {
      title: 'Click on link',
      description: 'Click on the "generate api key" link',
      target: () => linkRef.current,
    },
    {
      title: 'Get Gen-AI key',
      description: 'Click on the "Get an API key" button and then on the "Create API key" Button on the opened site',
            cover: (

                <img
                  alt="tour2.png"
                  src={tour2}
                />
      ),
    },
    {
      title: 'Copy The generated key',
      description: 'Copy and paste down below your AI-Generated key. It will be auto-saved. Congrats! you are ready to go! 🎉',
            cover: (
        <img
          alt="tour3.png"
          src={tour3}
        />
      ),
      target: () => apiKeyRef.current,

    },
  ];

  useEffect(() => {
    // Load auto_mode from chrome.storage.local when the component mounts
    chrome.storage.local.get(['auto_mode'], (result) => {
      setAutoMode(result.auto_mode ?? false); // Default to false if not found
    });

    // Load API key from chrome.storage.local when the component mounts
    chrome.storage.local.get(['api_key'], (result) => {
      setApiKey(result.api_key || ''); // Default to an empty string if not found
    });

    // Load method from chrome.storage.local when the component mounts
    chrome.storage.local.get(['method'], (result) => {
      setMethod(result.method || 'category'); // Default to an empty string if not found
    });
  }, []);
  
  useEffect(() => {
    // Store auto_mode in chrome.storage.local whenever it changes
    chrome.storage.local.set({ auto_mode: autoMode });
  }, [autoMode]);

  useEffect(() => {
    // Store auto_mode in chrome.storage.local whenever it changes
    chrome.storage.local.set({ method });
  }, [method]);

  useEffect(() => {
    // Store API key in chrome.storage.local whenever it changes
    chrome.storage.local.set({ api_key: apiKey });
    //Assistant.getInstance().initModel(apiKey);
    sendToBackground({
      name: "initAssistant",
      body: {api_key: apiKey}
    })

  }, [apiKey]);
  const collapseItems = [
    {
      key: "1",
      label: "Settings...",
      children: (
        <>
          Please insert your{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" ref={linkRef}>
            Gen-AI API key
          </a>{" "}
          to start:
          <div ref={apiKeyRef}>
          <Input
            placeholder="API KEY"
            onChange={(e) => setApiKey(e.target.value)}
            value={apiKey}
            style={{ marginTop: "10px", width: "100%" }}
            
          />
          </div>
        </>
      )
    }
  ]

  const handleAiCalls = async (method: Emethod) => {
    let isError = null
    if (await checkApiKeyExist()) {
      switch (method) {
        case Emethod.CATEGORY:
          isError = await organizeByCategory()
          break
        case Emethod.LAST_ACCESS:
          isError = await organizeByLastAccess()
          break
        case Emethod.PREDICTION:
          isError = await organizeByPrediction()
          break
      }
      if (isError) {
        generalErrorMessage()
      }
    }
  }

  const checkApiKeyExist = async () => {
    const response: Message = await sendToBackground({
      name: "checkAssistant"
    })


    if (!apiKey) {
      setTourOpen(true)
      return false
    } else if (!response.content["isInit"]) {
      errorMessageKeyInvalid()
      return false
    } else {
      return true
    }
  }
  return (
    <Flex gap="middle" wrap style={containerStyle}>
 {contextHolder}
      <Layout >

        <Header style={HeaderStyle}>
        <h1 style={{ color: '#444444', display: 'block' }}>ATO</h1>
        <h2 style={{ color: '#444444', display: 'block' }}>- AI Tab Organizer</h2>
        </Header>
        <Content style={ContentStyle}>

        <Divider style={{color: '#555555'}}>Organize By:</Divider>


        <Radio.Group
      block
      options={groupMethodOptions}
      defaultValue={Emethod.CATEGORY}
      value={method}
      optionType="button"
      buttonStyle="solid"
      style={{width: 390}}
      onChange={(e)=> {setMethod(e.target.value)}}

    />
        <Divider style={{color: '#555555'}}>Organize</Divider>

        <Flex vertical={true} gap={'small'}>
        <Button type="primary" size="large" onClick={()=>{handleAiCalls(method)}}>Organize Now!</Button>
        <Switch checkedChildren="Auto Organize" unCheckedChildren="Auto Organize" onClick={()=> setAutoMode(!autoMode)} value={autoMode} />

        </Flex>

        <Divider style={{color: '#555555'}}>Tab Groups Actions:</Divider>

          <Button type='default' onClick={()=>ungroupAllTabs()}>Ungroup All 🗑️</Button>
          <Button type='default' onClick={()=>{toggleGroups(tabCollapse); setTabCollapse(!tabCollapse)}}>Toggle Groups 🔄</Button>
          {/* <input onChange={(e) => setInput(e.target.value)} value={input} /> */}
        </Content>
               <Collapse ref={settingsRef} items={collapseItems} />
               <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={tourSteps} />
        <Footer style={FooterStyle}>
          <p>Made with love by theCart  <a href="https://buymeacoffee.com/thecart" target="_blank">buy me a coffee ☕️ </a></p>
        </Footer>
      </Layout>
      </Flex>
  )
}

export default IndexPopup