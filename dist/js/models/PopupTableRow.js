import{CONTRAST_RED,CONTRAST_GREEN,setElementText,setElementDisplay,changeElementVisibility,APPLICATION_CONNECTED}from"../util.js";import Application from"./Application.js";import ConnectedDomain from"./ConnectedDomain.js";const HOST_SPAN_CLASS="app-host-span",CONNECT_BUTTON_TEXT="Connect",CONNECT_SUCCESS_MESSAGE="Successfully connected. Please reload the page.",CONNECT_FAILURE_MESSAGE="Error connecting. Try refreshing the page.",DISCONNECT_FAILURE_MESSAGE="Error Disconnecting",DISCONNECT_BUTTON_TEXT="Disconnect",CONTRAST_BUTTON_CLASS="btn btn-primary btn-xs btn-contrast-plugin btn-connect",CONTRAST_BUTTON_DISCONNECT_CLASS="btn btn-primary btn-xs btn-contrast-plugin btn-disconnect";export default function TableRow(t,e,n){this.application=t,this.url=e,this.table=n,this.host="",this.row=document.createElement("tr"),this.nameTD=document.createElement("td"),this.buttonTD=document.createElement("td")}TableRow.prototype.setHost=function(t){this.host=t},TableRow.prototype.appendChildren=function(){this.table.appendChild(this.row),this.row.appendChild(this.nameTD),this.row.appendChild(this.buttonTD)},TableRow.prototype.createConnectButton=function(){const t=this.buttonTD,e=document.createElement("button");e.setAttribute("class",`${CONTRAST_BUTTON_CLASS} domainBtn`),t.appendChild(e),setElementText(e,"Connect"),setElementText(this.nameTD,this.application.name.titleize()),e.addEventListener("click",()=>{new ConnectedDomain(this.host,this.application).connectDomain().then(t=>this._showMessage(t,!0)).catch(t=>this._handleConnectError(t))})},TableRow.prototype.renderDisconnect=function(t,e){const n=document.createElement("button"),o=new ConnectedDomain(this.host,e),i=document.createElement("span");i.innerText=Application.subDomainColonForUnderscore(this.host),i.setAttribute("class","app-host-span"),this.nameTD.appendChild(i),setElementText(n,"Disconnect"),n.setAttribute("class",CONTRAST_BUTTON_DISCONNECT_CLASS),n.addEventListener("click",()=>{o.disconnectDomain(this).then(t=>{if(!t)throw new Error("Error Disconnecting Domain");this.removeDomainAndButton()}).catch(t=>this._handleConnectError(t))}),this.buttonTD.appendChild(n)},TableRow.prototype.removeDomainAndButton=function(){this.buttonTD.innerHTML="",this.nameTD.innerHTML=encodeURIComponent(this.application.name)},TableRow.prototype._showMessage=function(t,e){const n=document.getElementById("connected-domain-message"),o=document.getElementById("table-container");changeElementVisibility(n),t&&e?(this._successConnect(n),n.setAttribute("style",`color: ${CONTRAST_GREEN}`),setElementDisplay(o,"none")):!t&&e?(this._failConnect(n),n.setAttribute("style",`color: ${CONTRAST_GREEN}`),setElementDisplay(o,"none")):t||e?(changeElementVisibility(n),setElementDisplay(o,"none")):(this._failDisconnect(n),n.setAttribute("style",`color: ${CONTRAST_RED}`),setElementDisplay(o,"none"))},TableRow.prototype._handleConnectError=function(t){const e=document.getElementById("error-message-footer");setElementDisplay(e,"block"),setElementText(e,`${t.toString()}`),setTimeout(()=>setElementDisplay(e,"none"),1e4)},TableRow.prototype._successConnect=function(t){setElementText(t,CONNECT_SUCCESS_MESSAGE),t.setAttribute("style",`color: ${CONTRAST_GREEN}`),chrome.runtime.sendMessage({action:APPLICATION_CONNECTED,data:{domains:this._addHTTProtocol(this.host)}})},TableRow.prototype._failConnect=function(t){setElementText(t,CONNECT_FAILURE_MESSAGE),t.setAttribute("style",`color: ${CONTRAST_RED}`)},TableRow.prototype._failDisconnect=function(t){setElementText(t,"Error Disconnecting"),t.setAttribute("style",`color: ${CONTRAST_RED}`)},TableRow.prototype._addHTTProtocol=function(t){let e=t=Application.subDomainColonForUnderscore(t),n=t;return e.includes("http://")||(e="http://"+t+"/*"),n.includes("https://")||(n="https://"+t+"/*"),[e,n]};