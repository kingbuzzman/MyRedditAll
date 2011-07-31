function CustomContextMenu(Arguments)
{this.Version='2.1';var Base=Arguments.Base?Arguments.Base:document.documentElement;var Width=Arguments.Width?Arguments.Width:200;var FontColor=Arguments.FontColor?Arguments.FontColor:'black';var HoverFontColor=Arguments.HoverFontColor?Arguments.HoverFontColor:'white';var HoverBackgroundColor=Arguments.HoverBackgroundColor?Arguments.HoverBackgroundColor:'#2257D5';var HoverBorderColor=Arguments.HoverBorderColor?Arguments.HoverBorderColor:'orange';var ClickEventListener=Arguments.ClickEventListener?Arguments.ClickEventListener:function(){return false;};var ContextMenuDiv=document.createElement('div');var ContextMenuTable=document.createElement('table');var Index=0;var EventHandlers=new Array();ContextMenuDiv.id='ContextMenu';ContextMenuDiv.style.position='absolute';ContextMenuDiv.style.verticalAlign='top';ContextMenuDiv.style.textAlign='left';ContextMenuDiv.style.visibility='hidden';ContextMenuDiv.style.width=(Width+11)+'px';ContextMenuDiv.className="portlet ui-widget ui-widget-content ui-helper-clearfix ui-corner-all";ContextMenuTable.id='ContextMenuTable';ContextMenuTable.style.width=(Width+10)+'px';ContextMenuTable.border=0;ContextMenuTable.cellPadding=0;ContextMenuTable.cellSpacing=0;ContextMenuDiv.appendChild(ContextMenuTable);this.AddItem=function(imgSrc,itemText,isDisabled,commandName)
{var Tr=ContextMenuTable.insertRow(Index++);Tr.style.fontFamily='Verdana';Tr.style.fontSize='12pt';Tr.style.fontWeight='normal';Tr.style.color=isDisabled?'gray':FontColor;Tr.style.cursor='default';var TdLeft=Tr.insertCell(0);TdLeft.style.width=16+'px';TdLeft.style.height=16+'px';TdLeft.style.textAlign='center';TdLeft.style.verticalAlign='middle';TdLeft.style.padding="5px";TdLeft.style.backgroundColor='#222';var TdCenter=Tr.insertCell(1);TdCenter.style.width=10+'px';TdCenter.style.height=16+'px';TdCenter.innerHTML='&nbsp;';var TdRight=Tr.insertCell(2);TdRight.style.width=(Width-16)+'px';TdRight.style.height=16+'px';TdRight.style.textAlign='left';TdRight.style.verticalAlign='middle';TdRight.style.fontStyle=isDisabled?'italic':'normal';TdRight.className="cufonize";TdRight.innerHTML=itemText?itemText:'&nbsp;';if(imgSrc)
{var Img=new Image();Img.id='Img';Img.src=imgSrc;Img.style.width=16+'px';Img.style.height=16+'px';Img.disabled=isDisabled;TdLeft.appendChild(Img);}
else
TdLeft.innerHTML='&nbsp;';if(!isDisabled)
{WireUpEventHandler(Tr,'click',function(){ClickEventListener(Tr,{CommandName:commandName,Text:itemText,IsDisabled:isDisabled,ImageUrl:Img?Img.src:''})});WireUpEventHandler(Tr,'mouseover',function(){MouseOver(Tr,TdLeft,TdCenter,TdRight);});WireUpEventHandler(Tr,'mouseout',function(){MouseOut(Tr,TdLeft,TdCenter,TdRight);});}
else
{WireUpEventHandler(Tr,'click',function(){return false;});WireUpEventHandler(TdRight,'selectstart',function(){return false;});}}
this.AddSeparatorItem=function()
{var Tr=ContextMenuTable.insertRow(Index++);Tr.style.cursor='default';var TdLeft=Tr.insertCell(0);TdLeft.style.width=16+'px';TdLeft.style.height='1px';TdLeft.style.backgroundColor='#222';var TdCenter=Tr.insertCell(1);TdCenter.style.width=10+'px';TdCenter.style.height='1px';var TdRight=Tr.insertCell(2);TdRight.style.width=(Width-16)+'px';TdRight.style.height='1px';}
this.Display=function(e)
{e=e?e:window.event;var xLeft=e.clientX;if(xLeft+ContextMenuDiv.offsetWidth>Base.offsetWidth)
xLeft=Base.offsetWidth-ContextMenuDiv.offsetWidth;var yTop=e.clientY;if(yTop+ContextMenuDiv.offsetHeight>Base.clientHeight)
yTop=Base.clientHeight-ContextMenuDiv.offsetHeight;ContextMenuDiv.style.visibility='hidden';ContextMenuDiv.style.left=xLeft+'px';ContextMenuDiv.style.top=yTop+'px';ContextMenuDiv.style.visibility='visible';return false;}
this.Hide=function()
{ContextMenuDiv.style.visibility='hidden';}
this.Dispose=function()
{while(EventHandlers.length>0)
DetachEventHandler(EventHandlers.pop());document.body.removeChild(ContextMenuDiv);}
this.GetTotalItems=function()
{return ContextMenuTable.getElementsByTagName('tr').length;}
var MouseOver=function(Tr,TdLeft,TdCenter,TdRight)
{Tr.style.fontWeight='bold';Tr.style.color=HoverFontColor;Tr.style.backgroundColor=HoverBackgroundColor;TdLeft.style.borderTopColor=HoverBorderColor;TdLeft.style.borderBottomColor=HoverBorderColor;TdLeft.style.borderLeftColor=HoverBorderColor;TdLeft.style.backgroundColor=HoverBackgroundColor;TdCenter.style.borderTopColor=HoverBorderColor;TdCenter.style.borderBottomColor=HoverBorderColor;TdRight.style.borderTopColor=HoverBorderColor;TdRight.style.borderBottomColor=HoverBorderColor;TdRight.style.borderRightColor=HoverBorderColor;}
var MouseOut=function(Tr,TdLeft,TdCenter,TdRight)
{Tr.style.fontWeight='normal';Tr.style.color=FontColor;Tr.style.backgroundColor='transparent';}
var WireUpEventHandler=function(Target,Event,Listener)
{if(Target.addEventListener)
Target.addEventListener(Event,Listener,false);else if(Target.attachEvent)
Target.attachEvent('on'+Event,Listener);else
{Event='on'+Event;Target.Event=Listener;}
var EVENT={Target:Target,Event:Event,Listener:Listener}
EventHandlers.push(EVENT);}
var DetachEventHandler=function(EVENT)
{if(EVENT.Target.removeEventListener)
EVENT.Target.removeEventListener(EVENT.Event,EVENT.Listener,false);else if(EVENT.Target.detachEvent)
EVENT.Target.detachEvent('on'+EVENT.Event,EVENT.Listener);else
{EVENT.Event='on'+EVENT.Event;EVENT.Target.EVENT.Event=null;}}
document.body.appendChild(ContextMenuDiv);WireUpEventHandler(Base,'click',this.Hide);WireUpEventHandler(ContextMenuDiv,'contextmenu',function(){return false;});}