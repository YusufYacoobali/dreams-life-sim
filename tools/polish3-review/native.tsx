import React from 'react';
import * as Native from 'review-native-web';
export * from 'review-native-web';
const fontScale=new URLSearchParams(location.search).get('large')==='1'?1.4:1;
function scaledStyle(props:any){
 if(fontScale===1||props.allowFontScaling===false)return props.style;
 const style=Native.StyleSheet.flatten(props.style)||{};
 return [props.style,{fontSize:(style.fontSize||14)*fontScale,...(style.lineHeight?{lineHeight:style.lineHeight*fontScale}:{})}];
}
export const Text=React.forwardRef((props:any,ref:any)=><Native.Text {...props} ref={ref} style={scaledStyle(props)}/>);
export const TextInput=React.forwardRef((props:any,ref:any)=><Native.TextInput {...props} ref={ref} style={scaledStyle(props)}/>);
export function useWindowDimensions(){return{...Native.useWindowDimensions(),fontScale};}
