export type ExcludeTabData = {
    [K in keyof TabData]: boolean;
  };

  export interface TabData {
    u: string // URL
    t: string // Title
    la: number // Last accessed epoch time in seconds
    a: number[] // Access frequency array
  }  
export interface TabDataMap  { [tabId: string]: TabData }
  
export interface Message {
  content?: object
  isError?: boolean
}

export type TimeRange = {
  label: string;
  min: number;
  max: number;
};

export type GroupingInstructions = {
  [label: string]: TabId[]
}

type TabId = string
