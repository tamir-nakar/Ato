import React from 'react';

export const containerStyle: React.CSSProperties = {
    height: 64,
    width: 400,
    backgroundColor: '#4096ff',
  };

  export const HeaderStyle: React.CSSProperties = {
    backgroundColor: '#e1f1fd',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',  // Centers horizontally
    alignItems: 'center',  // Centers vertically
    height:60,
    gap: 10
  };
  export const ContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',  
    backgroundColor: '#c8d9ed',
    gap: 5,
    paddingBottom:25,
    justifyContent: 'center',  // Centers horizontally
    alignItems: 'center',  // Centers vertically

  };
    export const FooterStyle: React.CSSProperties = {
      backgroundColor: '#c8d9ed',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',  // Centers horizontally
      alignItems: 'center',  // Centers vertically
      height: 5,  // Reduced height
    };