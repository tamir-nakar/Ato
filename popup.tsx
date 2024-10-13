import { Layout, Flex, Button, Divider, Radio, Collapse, Input } from "antd";
const { Panel } = Collapse;
const { Header, Content, Footer } = Layout;
import { containerStyle, ContentStyle, FooterStyle, HeaderStyle } from './popup.style'
import { useEffect, useState } from "react"
import { Assistant } from "./assistant"
import { organizeByCategory, organizeByLastAccess, organizeByPrediction, toggleGroups, ungroupAllTabs } from "./index"
import './global.css';


function IndexPopup() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('api_key') || '';
  })
  const [tabCollapse, setTabCollapse] = useState(true)
  const [mode, setMode] = useState('manual')
  const [collapse, setCollapse] = useState(true)

  const options = [
    { label: 'on the fly (auto)', value: 'auto' },
    { label: 'On demand (manual)', value: 'manual' },
  ];


  useEffect(() => {

    localStorage.setItem('api_key', apiKey);
      Assistant.getInstance().initModel(apiKey)
  }, [apiKey]);

  const collapseItems = [
    {
      key: '1',
      label: 'Settings...',
      children: (
        <>
          Please insert your <a href='https://aistudio.google.com/app/apikey' target='_blank'>Gen-AI API key</a> to start:
          <Input placeholder="API KEY" onChange={(e) => setApiKey(e.target.value)} value={apiKey} style={{ marginTop: '10px', width: '100%' }} />
        </>
      )
    }
  ];

  return (
    <Flex gap="middle" wrap style={containerStyle}>

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
          <Button type='primary' disabled={mode === 'auto'} onClick={()=>organizeByCategory()}> Category 📚</Button>
          <Button type='primary' disabled={mode === 'auto'} onClick={()=>organizeByLastAccess()}> Last access 🕓</Button>
          <Button type='primary' disabled={mode === 'auto'} onClick={()=>organizeByPrediction()}> Prediction 🧠</Button>
        <Divider style={{color: '#555555'}}>Tab Groups Actions:</Divider>

          <Button type='default' onClick={()=>ungroupAllTabs()}>Ungroup All 🗑️</Button>
          <Button type='default' onClick={()=>{toggleGroups(tabCollapse); setTabCollapse(!tabCollapse)}}>Toggle Groups 🔄</Button>
          {/* <input onChange={(e) => setInput(e.target.value)} value={input} /> */}
        </Content>
               <Collapse items={collapseItems} />

      </Layout>
      </Flex>
  )
}

export default IndexPopup
