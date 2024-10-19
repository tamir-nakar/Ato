import { Button, Collapse, Divider, Flex, Input, Layout, Radio, Tour, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { Assistant } from "./assistant";
import { organizeByCategory, organizeByLastAccess, organizeByPrediction, toggleGroups, ungroupAllTabs } from "./index";
import { containerStyle, ContentStyle, HeaderStyle } from './popup.style';
import './global.css';
import type { TourProps } from 'antd';
const { Panel } = Collapse;
const { Header, Content } = Layout;
import tour1 from "data-base64:~assets/tour1.jpeg"
import tour2 from "data-base64:~assets/tour2.jpeg"
import tour3 from "data-base64:~assets/tour3.jpeg"

enum Emethod {
  CATEGORY = 'category',
  LAST_ACCESS = 'access',
  PREDICTION = 'prediction'
}

function IndexPopup() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('api_key') || '';
  })
  const [tabCollapse, setTabCollapse] = useState(true)
  const [mode, setMode] = useState('manual')
  const [collapse, setCollapse] = useState(true)
  const [tourOpen, setTourOpen] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const settingsRef = useRef(null);
  const linkRef = useRef(null);
  const apiKeyRef = useRef(null);
  const options = [
    { label: 'on the fly (auto)', value: 'auto' },
    { label: 'On demand (manual)', value: 'manual' },
  ];

  const errorMessage = () => {
    messageApi.open({
      type: 'error',
      content: "Oops! It seems we've encountered an issue. The AI might need a break, or your API key could be invalid. Please double-check and try again.",
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

    localStorage.setItem('api_key', apiKey);
      Assistant.getInstance().initModel(apiKey)
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
    let isError = null;
    debugger
    if (checkApiKeyExist()) {
      switch (method) {
        case Emethod.CATEGORY:
          isError = await organizeByCategory()
          break;
        case Emethod.LAST_ACCESS:
          isError = await organizeByLastAccess()
          break
        case Emethod.PREDICTION:
          isError = await organizeByPrediction()
          break
      }
      if(isError){
        errorMessage()
      }
    }
  }

  const checkApiKeyExist = ()=>{
    if(!Assistant.getInstance().isKey()){
      setTourOpen(true)
      return false
    }
    return true
  }
  return (
    <Flex gap="middle" wrap style={containerStyle}>
 {contextHolder}
      <Layout>
        <Header style={HeaderStyle}>
          <h2 style={{color: '#444444'}}>Ato - Ai Tab Organizer</h2>
        </Header>
        <Content style={ContentStyle}>
        <Divider style={{color: '#555555'}}>Mode</Divider>
        <Radio.Group
      block
      options={options}
      defaultValue="manual"
      optionType="button"
      buttonStyle="solid"
      style={{width: 350}}
      onChange={(e)=> setMode(e.target.value)}

    />
        <Divider style={{color: '#555555'}}>Organize By:</Divider>
          <Button type='primary' disabled={mode === 'auto'} onClick={()=>{handleAiCalls(Emethod.CATEGORY)}}> Category 📚</Button>
          <Button type='primary' disabled={mode === 'auto'} onClick={()=>{handleAiCalls(Emethod.LAST_ACCESS)}}> Last access 🕓</Button>
          <Button type='primary' disabled={mode === 'auto'} onClick={()=>{handleAiCalls(Emethod.PREDICTION)}}> Prediction 🧠</Button>
        <Divider style={{color: '#555555'}}>Tab Groups Actions:</Divider>

          <Button type='default' onClick={()=>ungroupAllTabs()}>Ungroup All 🗑️</Button>
          <Button type='default' onClick={()=>{toggleGroups(tabCollapse); setTabCollapse(!tabCollapse)}}>Toggle Groups 🔄</Button>
          {/* <input onChange={(e) => setInput(e.target.value)} value={input} /> */}
        </Content>
               <Collapse ref={settingsRef} items={collapseItems} />
               <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={tourSteps} />
              
      </Layout>
      </Flex>
  )
}

export default IndexPopup