import{c as L,r as h,a as R,i as O,b as l,o as w,U as Ae,e as ye,d as Ee,n as H,M as le}from"./vendor-reown-appkit-ui-vz8T27tA.js";import{P as Ie,h as T,m as _,F as Ne,p as ie,H as de,C as m,J as Pe,f as P,n as D,s as C,B as Te,M as B,L as ke,K as Se,j as I,R as F}from"./vendor-reown-appkit-controllers-jkmAX4ms.js";import{C as E,a as Ce,P as y,b}from"./vendor-reown-appkit-common-CkBKLiFV.js";import{H as N}from"./vendor-reown-appkit-utils-DiyVUbeF.js";const d={INVALID_PAYMENT_CONFIG:"INVALID_PAYMENT_CONFIG",INVALID_RECIPIENT:"INVALID_RECIPIENT",INVALID_ASSET:"INVALID_ASSET",INVALID_AMOUNT:"INVALID_AMOUNT",UNKNOWN_ERROR:"UNKNOWN_ERROR",UNABLE_TO_INITIATE_PAYMENT:"UNABLE_TO_INITIATE_PAYMENT",INVALID_CHAIN_NAMESPACE:"INVALID_CHAIN_NAMESPACE",GENERIC_PAYMENT_ERROR:"GENERIC_PAYMENT_ERROR",UNABLE_TO_GET_EXCHANGES:"UNABLE_TO_GET_EXCHANGES",ASSET_NOT_SUPPORTED:"ASSET_NOT_SUPPORTED",UNABLE_TO_GET_PAY_URL:"UNABLE_TO_GET_PAY_URL",UNABLE_TO_GET_BUY_STATUS:"UNABLE_TO_GET_BUY_STATUS",UNABLE_TO_GET_TOKEN_BALANCES:"UNABLE_TO_GET_TOKEN_BALANCES",UNABLE_TO_GET_QUOTE:"UNABLE_TO_GET_QUOTE",UNABLE_TO_GET_QUOTE_STATUS:"UNABLE_TO_GET_QUOTE_STATUS",INVALID_RECIPIENT_ADDRESS_FOR_ASSET:"INVALID_RECIPIENT_ADDRESS_FOR_ASSET"},$={[d.INVALID_PAYMENT_CONFIG]:"Invalid payment configuration",[d.INVALID_RECIPIENT]:"Invalid recipient address",[d.INVALID_ASSET]:"Invalid asset specified",[d.INVALID_AMOUNT]:"Invalid payment amount",[d.INVALID_RECIPIENT_ADDRESS_FOR_ASSET]:"Invalid recipient address for the asset selected",[d.UNKNOWN_ERROR]:"Unknown payment error occurred",[d.UNABLE_TO_INITIATE_PAYMENT]:"Unable to initiate payment",[d.INVALID_CHAIN_NAMESPACE]:"Invalid chain namespace",[d.GENERIC_PAYMENT_ERROR]:"Unable to process payment",[d.UNABLE_TO_GET_EXCHANGES]:"Unable to get exchanges",[d.ASSET_NOT_SUPPORTED]:"Asset not supported by the selected exchange",[d.UNABLE_TO_GET_PAY_URL]:"Unable to get payment URL",[d.UNABLE_TO_GET_BUY_STATUS]:"Unable to get buy status",[d.UNABLE_TO_GET_TOKEN_BALANCES]:"Unable to get token balances",[d.UNABLE_TO_GET_QUOTE]:"Unable to get quote. Please choose a different token",[d.UNABLE_TO_GET_QUOTE_STATUS]:"Unable to get quote status"};class p extends Error{get message(){return $[this.code]}constructor(e,n){super($[e]),this.name="AppKitPayError",this.code=e,this.details=n,Error.captureStackTrace&&Error.captureStackTrace(this,p)}}const _e="https://rpc.walletconnect.org/v1/json-rpc",pe="reown_test";function ve(){const{chainNamespace:t}=y.parseCaipNetworkId(u.state.paymentAsset.network);if(!_.isAddress(u.state.recipient,t))throw new p(d.INVALID_RECIPIENT_ADDRESS_FOR_ASSET,`Provide valid recipient address for namespace "${t}"`)}async function $e(t,e,n){var c;if(e!==E.CHAIN.EVM)throw new p(d.INVALID_CHAIN_NAMESPACE);if(!n.fromAddress)throw new p(d.INVALID_PAYMENT_CONFIG,"fromAddress is required for native EVM payments.");const s=typeof n.amount=="string"?parseFloat(n.amount):n.amount;if(isNaN(s))throw new p(d.INVALID_PAYMENT_CONFIG);const i=((c=t.metadata)==null?void 0:c.decimals)??18,a=T.parseUnits(s.toString(),i);if(typeof a!="bigint")throw new p(d.GENERIC_PAYMENT_ERROR);return await T.sendTransaction({chainNamespace:e,to:n.recipient,address:n.fromAddress,value:a,data:"0x"})??void 0}async function Re(t,e){if(!e.fromAddress)throw new p(d.INVALID_PAYMENT_CONFIG,"fromAddress is required for ERC20 EVM payments.");const n=t.asset,s=e.recipient,i=Number(t.metadata.decimals),a=T.parseUnits(e.amount.toString(),i);if(a===void 0)throw new p(d.GENERIC_PAYMENT_ERROR);return await T.writeContract({fromAddress:e.fromAddress,tokenAddress:n,args:[s,a],method:"transfer",abi:Ce.getERC20Abi(n),chainNamespace:E.CHAIN.EVM})??void 0}async function Oe(t,e){if(t!==E.CHAIN.SOLANA)throw new p(d.INVALID_CHAIN_NAMESPACE);if(!e.fromAddress)throw new p(d.INVALID_PAYMENT_CONFIG,"fromAddress is required for Solana payments.");const n=typeof e.amount=="string"?parseFloat(e.amount):e.amount;if(isNaN(n)||n<=0)throw new p(d.INVALID_PAYMENT_CONFIG,"Invalid payment amount.");try{if(!Ie.getProvider(t))throw new p(d.GENERIC_PAYMENT_ERROR,"No Solana provider available.");const i=await T.sendTransaction({chainNamespace:E.CHAIN.SOLANA,to:e.recipient,value:n,tokenMint:e.tokenMint});if(!i)throw new p(d.GENERIC_PAYMENT_ERROR,"Transaction failed.");return i}catch(s){throw s instanceof p?s:new p(d.GENERIC_PAYMENT_ERROR,`Solana payment failed: ${s}`)}}async function Ue({sourceToken:t,toToken:e,amount:n,recipient:s}){const i=T.parseUnits(n,t.metadata.decimals),a=T.parseUnits(n,e.metadata.decimals);return Promise.resolve({type:te,origin:{amount:(i==null?void 0:i.toString())??"0",currency:t},destination:{amount:(a==null?void 0:a.toString())??"0",currency:e},fees:[{id:"service",label:"Service Fee",amount:"0",currency:e}],steps:[{requestId:te,type:"deposit",deposit:{amount:(i==null?void 0:i.toString())??"0",currency:t.asset,receiver:s}}],timeInSeconds:6})}function ee(t){if(!t)return null;const e=t.steps[0];return!e||e.type!==He?null:e}function X(t,e=0){if(!t)return[];const n=t.steps.filter(i=>i.type===Ke),s=n.filter((i,a)=>a+1>e);return n.length>0&&n.length<3?s:[]}const ae=new Ne({baseUrl:_.getApiUrl(),clientId:null});class Le extends Error{}function qe(){const t=ie.getSnapshot().projectId;return`${_e}?projectId=${t}`}function re(){const{projectId:t,sdkType:e,sdkVersion:n}=ie.state;return{projectId:t,st:e||"appkit",sv:n||"html-wagmi-4.2.2"}}async function oe(t,e){const n=qe(),{sdkType:s,sdkVersion:i,projectId:a}=ie.getSnapshot(),o={jsonrpc:"2.0",id:1,method:t,params:{...e||{},st:s,sv:i,projectId:a}},g=await(await fetch(n,{method:"POST",body:JSON.stringify(o),headers:{"Content-Type":"application/json"}})).json();if(g.error)throw new Le(g.error.message);return g}async function he(t){return(await oe("reown_getExchanges",t)).result}async function me(t){return(await oe("reown_getExchangePayUrl",t)).result}async function De(t){return(await oe("reown_getExchangeBuyStatus",t)).result}async function Fe(t){const e=b.bigNumber(t.amount).times(10**t.toToken.metadata.decimals).toString(),{chainId:n,chainNamespace:s}=y.parseCaipNetworkId(t.sourceToken.network),{chainId:i,chainNamespace:a}=y.parseCaipNetworkId(t.toToken.network),o=t.sourceToken.asset==="native"?de(s):t.sourceToken.asset,c=t.toToken.asset==="native"?de(a):t.toToken.asset;return await ae.post({path:"/appkit/v1/transfers/quote",body:{user:t.address,originChainId:n.toString(),originCurrency:o,destinationChainId:i.toString(),destinationCurrency:c,recipient:t.recipient,amount:e},params:re()})}async function Be(t){const e=N.isLowerCaseMatch(t.sourceToken.network,t.toToken.network),n=N.isLowerCaseMatch(t.sourceToken.asset,t.toToken.asset);return e&&n?Ue(t):Fe(t)}async function Me(t){return await ae.get({path:"/appkit/v1/transfers/status",params:{requestId:t.requestId,...re()}})}async function je(t){return await ae.get({path:`/appkit/v1/transfers/assets/exchanges/${t}`,params:re()})}const We=["eip155","solana"],Ge={eip155:{native:{assetNamespace:"slip44",assetReference:"60"},defaultTokenNamespace:"erc20"},solana:{native:{assetNamespace:"slip44",assetReference:"501"},defaultTokenNamespace:"token"}};function J(t,e){const{chainNamespace:n,chainId:s}=y.parseCaipNetworkId(t),i=Ge[n];if(!i)throw new Error(`Unsupported chain namespace for CAIP-19 formatting: ${n}`);let a=i.native.assetNamespace,o=i.native.assetReference;return e!=="native"&&(a=i.defaultTokenNamespace,o=e),`${`${n}:${s}`}/${a}:${o}`}function Qe(t){const{chainNamespace:e}=y.parseCaipNetworkId(t);return We.includes(e)}function Ve(t){const n=m.getAllRequestedCaipNetworks().find(i=>i.caipNetworkId===t.chainId);let s=t.address;if(!n)throw new Error(`Target network not found for balance chainId "${t.chainId}"`);if(N.isLowerCaseMatch(t.symbol,n.nativeCurrency.symbol))s="native";else if(_.isCaipAddress(s)){const{address:i}=y.parseCaipAddress(s);s=i}else if(!s)throw new Error(`Balance address not found for balance symbol "${t.symbol}"`);return{network:n.caipNetworkId,asset:s,metadata:{name:t.name,symbol:t.symbol,decimals:Number(t.quantity.decimals),logoURI:t.iconUrl},amount:t.quantity.numeric}}function Ye(t){return{chainId:t.network,address:`${t.network}:${t.asset}`,symbol:t.metadata.symbol,name:t.metadata.name,iconUrl:t.metadata.logoURI||"",price:0,quantity:{numeric:"0",decimals:t.metadata.decimals.toString()}}}function V(t){const e=b.bigNumber(t,{safe:!0});return e.lt(.001)?"<0.001":e.round(4).toString()}function ze(t){const n=m.getAllRequestedCaipNetworks().find(s=>s.caipNetworkId===t.network);return n?!!n.testnet:!1}const ge=0,Z="unknown",te="direct-transfer",He="deposit",Ke="transaction",r=Pe({paymentAsset:{network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},recipient:"0x0",amount:0,isConfigured:!1,error:null,isPaymentInProgress:!1,exchanges:[],isLoading:!1,openInNewTab:!0,redirectUrl:void 0,payWithExchange:void 0,currentPayment:void 0,analyticsSet:!1,paymentId:void 0,choice:"pay",tokenBalances:{[E.CHAIN.EVM]:[],[E.CHAIN.SOLANA]:[]},isFetchingTokenBalances:!1,selectedPaymentAsset:null,quote:void 0,quoteStatus:"waiting",quoteError:null,isFetchingQuote:!1,selectedExchange:void 0,exchangeUrlForQuote:void 0,requestId:void 0}),u={state:r,subscribe(t){return Se(r,()=>t(r))},subscribeKey(t,e){return ke(r,t,e)},async handleOpenPay(t){this.resetState(),this.setPaymentConfig(t),this.initializeAnalytics(),ve(),await this.prepareTokenLogo(),r.isConfigured=!0,D.sendEvent({type:"track",event:"PAY_MODAL_OPEN",properties:{exchanges:r.exchanges,configuration:{network:r.paymentAsset.network,asset:r.paymentAsset.asset,recipient:r.recipient,amount:r.amount}}}),await B.open({view:"Pay"})},resetState(){r.paymentAsset={network:"eip155:1",asset:"0x0",metadata:{name:"0x0",symbol:"0x0",decimals:0}},r.recipient="0x0",r.amount=0,r.isConfigured=!1,r.error=null,r.isPaymentInProgress=!1,r.isLoading=!1,r.currentPayment=void 0,r.selectedExchange=void 0,r.exchangeUrlForQuote=void 0,r.requestId=void 0},resetQuoteState(){r.quote=void 0,r.quoteStatus="waiting",r.quoteError=null,r.isFetchingQuote=!1,r.requestId=void 0},setPaymentConfig(t){if(!t.paymentAsset)throw new p(d.INVALID_PAYMENT_CONFIG);try{r.choice=t.choice??"pay",r.paymentAsset=t.paymentAsset,r.recipient=t.recipient,r.amount=t.amount,r.openInNewTab=t.openInNewTab??!0,r.redirectUrl=t.redirectUrl,r.payWithExchange=t.payWithExchange,r.error=null}catch(e){throw new p(d.INVALID_PAYMENT_CONFIG,e.message)}},setSelectedPaymentAsset(t){r.selectedPaymentAsset=t},setSelectedExchange(t){r.selectedExchange=t},setRequestId(t){r.requestId=t},setPaymentInProgress(t){r.isPaymentInProgress=t},getPaymentAsset(){return r.paymentAsset},getExchanges(){return r.exchanges},async fetchExchanges(){try{r.isLoading=!0;const t=await he({page:ge});r.exchanges=t.exchanges.slice(0,2)}catch{throw C.showError($.UNABLE_TO_GET_EXCHANGES),new p(d.UNABLE_TO_GET_EXCHANGES)}finally{r.isLoading=!1}},async getAvailableExchanges(t){var e;try{const n=t!=null&&t.asset&&(t!=null&&t.network)?J(t.network,t.asset):void 0;return await he({page:(t==null?void 0:t.page)??ge,asset:n,amount:(e=t==null?void 0:t.amount)==null?void 0:e.toString()})}catch{throw new p(d.UNABLE_TO_GET_EXCHANGES)}},async getPayUrl(t,e,n=!1){try{const s=Number(e.amount),i=await me({exchangeId:t,asset:J(e.network,e.asset),amount:s.toString(),recipient:`${e.network}:${e.recipient}`});return D.sendEvent({type:"track",event:"PAY_EXCHANGE_SELECTED",properties:{source:"pay",exchange:{id:t},configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:s},currentPayment:{type:"exchange",exchangeId:t},headless:n}}),n&&(this.initiatePayment(),D.sendEvent({type:"track",event:"PAY_INITIATED",properties:{source:"pay",paymentId:r.paymentId||Z,configuration:{network:e.network,asset:e.asset,recipient:e.recipient,amount:s},currentPayment:{type:"exchange",exchangeId:t}}})),i}catch(s){throw s instanceof Error&&s.message.includes("is not supported")?new p(d.ASSET_NOT_SUPPORTED):new Error(s.message)}},async generateExchangeUrlForQuote({exchangeId:t,paymentAsset:e,amount:n,recipient:s}){const i=await me({exchangeId:t,asset:J(e.network,e.asset),amount:n.toString(),recipient:s});r.exchangeSessionId=i.sessionId,r.exchangeUrlForQuote=i.url},async openPayUrl(t,e,n=!1){try{const s=await this.getPayUrl(t.exchangeId,e,n);if(!s)throw new p(d.UNABLE_TO_GET_PAY_URL);const a=t.openInNewTab??!0?"_blank":"_self";return _.openHref(s.url,a),s}catch(s){throw s instanceof p?r.error=s.message:r.error=$.GENERIC_PAYMENT_ERROR,new p(d.UNABLE_TO_GET_PAY_URL)}},async onTransfer({chainNamespace:t,fromAddress:e,toAddress:n,amount:s,paymentAsset:i}){if(r.currentPayment={type:"wallet",status:"IN_PROGRESS"},!r.isPaymentInProgress)try{this.initiatePayment();const o=m.getAllRequestedCaipNetworks().find(g=>g.caipNetworkId===i.network);if(!o)throw new Error("Target network not found");const c=m.state.activeCaipNetwork;switch(N.isLowerCaseMatch(c==null?void 0:c.caipNetworkId,o.caipNetworkId)||await m.switchActiveNetwork(o),t){case E.CHAIN.EVM:i.asset==="native"&&(r.currentPayment.result=await $e(i,t,{recipient:n,amount:s,fromAddress:e})),i.asset.startsWith("0x")&&(r.currentPayment.result=await Re(i,{recipient:n,amount:s,fromAddress:e})),r.currentPayment.status="SUCCESS";break;case E.CHAIN.SOLANA:r.currentPayment.result=await Oe(t,{recipient:n,amount:s,fromAddress:e,tokenMint:i.asset==="native"?void 0:i.asset}),r.currentPayment.status="SUCCESS";break;default:throw new p(d.INVALID_CHAIN_NAMESPACE)}}catch(a){throw a instanceof p?r.error=a.message:r.error=$.GENERIC_PAYMENT_ERROR,r.currentPayment.status="FAILED",C.showError(r.error),a}finally{r.isPaymentInProgress=!1}},async onSendTransaction(t){try{const{namespace:e,transactionStep:n}=t;u.initiatePayment();const i=m.getAllRequestedCaipNetworks().find(o=>{var c;return o.caipNetworkId===((c=r.paymentAsset)==null?void 0:c.network)});if(!i)throw new Error("Target network not found");const a=m.state.activeCaipNetwork;if(N.isLowerCaseMatch(a==null?void 0:a.caipNetworkId,i.caipNetworkId)||await m.switchActiveNetwork(i),e===E.CHAIN.EVM){const{from:o,to:c,data:g,value:v}=n.transaction;await T.sendTransaction({address:o,to:c,data:g,value:BigInt(v),chainNamespace:e})}else if(e===E.CHAIN.SOLANA){const{instructions:o}=n.transaction;await T.writeSolanaTransaction({instructions:o})}}catch(e){throw e instanceof p?r.error=e.message:r.error=$.GENERIC_PAYMENT_ERROR,C.showError(r.error),e}finally{r.isPaymentInProgress=!1}},getExchangeById(t){return r.exchanges.find(e=>e.id===t)},validatePayConfig(t){const{paymentAsset:e,recipient:n,amount:s}=t;if(!e)throw new p(d.INVALID_PAYMENT_CONFIG);if(!n)throw new p(d.INVALID_RECIPIENT);if(!e.asset)throw new p(d.INVALID_ASSET);if(s==null||s<=0)throw new p(d.INVALID_AMOUNT)},async handlePayWithExchange(t){try{r.currentPayment={type:"exchange",exchangeId:t};const{network:e,asset:n}=r.paymentAsset,s={network:e,asset:n,amount:r.amount,recipient:r.recipient},i=await this.getPayUrl(t,s);if(!i)throw new p(d.UNABLE_TO_INITIATE_PAYMENT);return r.currentPayment.sessionId=i.sessionId,r.currentPayment.status="IN_PROGRESS",r.currentPayment.exchangeId=t,this.initiatePayment(),{url:i.url,openInNewTab:r.openInNewTab}}catch(e){return e instanceof p?r.error=e.message:r.error=$.GENERIC_PAYMENT_ERROR,r.isPaymentInProgress=!1,C.showError(r.error),null}},async getBuyStatus(t,e){var n,s;try{const i=await De({sessionId:e,exchangeId:t});return(i.status==="SUCCESS"||i.status==="FAILED")&&D.sendEvent({type:"track",event:i.status==="SUCCESS"?"PAY_SUCCESS":"PAY_ERROR",properties:{message:i.status==="FAILED"?_.parseError(r.error):void 0,source:"pay",paymentId:r.paymentId||Z,configuration:{network:r.paymentAsset.network,asset:r.paymentAsset.asset,recipient:r.recipient,amount:r.amount},currentPayment:{type:"exchange",exchangeId:(n=r.currentPayment)==null?void 0:n.exchangeId,sessionId:(s=r.currentPayment)==null?void 0:s.sessionId,result:i.txHash}}}),i}catch{throw new p(d.UNABLE_TO_GET_BUY_STATUS)}},async fetchTokensFromEOA({caipAddress:t,caipNetwork:e,namespace:n}){if(!t)return[];const{address:s}=y.parseCaipAddress(t);let i=e;return n===E.CHAIN.EVM&&(i=void 0),await Te.getMyTokensWithBalance({address:s,caipNetwork:i})},async fetchTokensFromExchange(){if(!r.selectedExchange)return[];const t=await je(r.selectedExchange.id),e=Object.values(t.assets).flat();return await Promise.all(e.map(async s=>{const i=Ye(s),{chainNamespace:a}=y.parseCaipNetworkId(i.chainId);let o=i.address;if(_.isCaipAddress(o)){const{address:g}=y.parseCaipAddress(o);o=g}const c=await P.getImageByToken(o??"",a).catch(()=>{});return i.iconUrl=c??"",i}))},async fetchTokens({caipAddress:t,caipNetwork:e,namespace:n}){try{r.isFetchingTokenBalances=!0;const a=await(!!r.selectedExchange?this.fetchTokensFromExchange():this.fetchTokensFromEOA({caipAddress:t,caipNetwork:e,namespace:n}));r.tokenBalances={...r.tokenBalances,[n]:a}}catch(s){const i=s instanceof Error?s.message:"Unable to get token balances";C.showError(i)}finally{r.isFetchingTokenBalances=!1}},async fetchQuote({amount:t,address:e,sourceToken:n,toToken:s,recipient:i}){try{u.resetQuoteState(),r.isFetchingQuote=!0;const a=await Be({amount:t,address:r.selectedExchange?void 0:e,sourceToken:n,toToken:s,recipient:i});if(r.selectedExchange){const o=ee(a);if(o){const c=`${n.network}:${o.deposit.receiver}`,g=b.formatNumber(o.deposit.amount,{decimals:n.metadata.decimals??0,round:8});await u.generateExchangeUrlForQuote({exchangeId:r.selectedExchange.id,paymentAsset:n,amount:g.toString(),recipient:c})}}r.quote=a}catch(a){let o=$.UNABLE_TO_GET_QUOTE;if(a instanceof Error&&a.cause&&a.cause instanceof Response)try{const c=await a.cause.json();c.error&&typeof c.error=="string"&&(o=c.error)}catch{}throw r.quoteError=o,C.showError(o),new p(d.UNABLE_TO_GET_QUOTE)}finally{r.isFetchingQuote=!1}},async fetchQuoteStatus({requestId:t}){try{if(t===te){const n=r.selectedExchange,s=r.exchangeSessionId;if(n&&s){switch((await this.getBuyStatus(n.id,s)).status){case"IN_PROGRESS":r.quoteStatus="waiting";break;case"SUCCESS":r.quoteStatus="success",r.isPaymentInProgress=!1;break;case"FAILED":r.quoteStatus="failure",r.isPaymentInProgress=!1;break;case"UNKNOWN":r.quoteStatus="waiting";break;default:r.quoteStatus="waiting";break}return}r.quoteStatus="success";return}const{status:e}=await Me({requestId:t});r.quoteStatus=e}catch{throw r.quoteStatus="failure",new p(d.UNABLE_TO_GET_QUOTE_STATUS)}},initiatePayment(){r.isPaymentInProgress=!0,r.paymentId=crypto.randomUUID()},initializeAnalytics(){r.analyticsSet||(r.analyticsSet=!0,this.subscribeKey("isPaymentInProgress",t=>{var e;if((e=r.currentPayment)!=null&&e.status&&r.currentPayment.status!=="UNKNOWN"){const n={IN_PROGRESS:"PAY_INITIATED",SUCCESS:"PAY_SUCCESS",FAILED:"PAY_ERROR"}[r.currentPayment.status];D.sendEvent({type:"track",event:n,properties:{message:r.currentPayment.status==="FAILED"?_.parseError(r.error):void 0,source:"pay",paymentId:r.paymentId||Z,configuration:{network:r.paymentAsset.network,asset:r.paymentAsset.asset,recipient:r.recipient,amount:r.amount},currentPayment:{type:r.currentPayment.type,exchangeId:r.currentPayment.exchangeId,sessionId:r.currentPayment.sessionId,result:r.currentPayment.result}}})}}))},async prepareTokenLogo(){if(!r.paymentAsset.metadata.logoURI)try{const{chainNamespace:t}=y.parseCaipNetworkId(r.paymentAsset.network),e=await P.getImageByToken(r.paymentAsset.asset,t);r.paymentAsset.metadata.logoURI=e}catch{}}},Xe=L`
  wui-separator {
    margin: var(--apkt-spacing-3) calc(var(--apkt-spacing-3) * -1) var(--apkt-spacing-2)
      calc(var(--apkt-spacing-3) * -1);
    width: calc(100% + var(--apkt-spacing-3) * 2);
  }

  .token-display {
    padding: var(--apkt-spacing-3) var(--apkt-spacing-3);
    border-radius: var(--apkt-borderRadius-5);
    background-color: var(--apkt-tokens-theme-backgroundPrimary);
    margin-top: var(--apkt-spacing-3);
    margin-bottom: var(--apkt-spacing-3);
  }

  .token-display wui-text {
    text-transform: none;
  }

  wui-loading-spinner {
    padding: var(--apkt-spacing-2);
  }

  .left-image-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .token-image {
    border-radius: ${({borderRadius:t})=>t.round};
    width: 40px;
    height: 40px;
  }

  .chain-image {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: -3px;
    right: -5px;
    border-radius: ${({borderRadius:t})=>t.round};
    border: 2px solid ${({tokens:t})=>t.theme.backgroundPrimary};
  }

  .payment-methods-container {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:t})=>t[8]};
    border-top-left-radius: ${({borderRadius:t})=>t[8]};
  }
`;var U=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};let k=class extends O{constructor(){super(),this.unsubscribe=[],this.amount=u.state.amount,this.namespace=void 0,this.paymentAsset=u.state.paymentAsset,this.activeConnectorIds=I.state.activeConnectorIds,this.caipAddress=void 0,this.exchanges=u.state.exchanges,this.isLoading=u.state.isLoading,this.initializeNamespace(),this.unsubscribe.push(u.subscribeKey("amount",e=>this.amount=e)),this.unsubscribe.push(I.subscribeKey("activeConnectorIds",e=>this.activeConnectorIds=e)),this.unsubscribe.push(u.subscribeKey("exchanges",e=>this.exchanges=e)),this.unsubscribe.push(u.subscribeKey("isLoading",e=>this.isLoading=e)),u.fetchExchanges(),u.setSelectedExchange(void 0)}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column">
        ${this.paymentDetailsTemplate()} ${this.paymentMethodsTemplate()}
      </wui-flex>
    `}paymentMethodsTemplate(){return l`
      <wui-flex flexDirection="column" padding="3" gap="2" class="payment-methods-container">
        ${this.payWithWalletTemplate()} ${this.templateSeparator()}
        ${this.templateExchangeOptions()}
      </wui-flex>
    `}initializeNamespace(){var n;const e=m.state.activeChain;this.namespace=e,this.caipAddress=(n=m.getAccountData(e))==null?void 0:n.caipAddress,this.unsubscribe.push(m.subscribeChainProp("accountState",s=>{this.caipAddress=s==null?void 0:s.caipAddress},e))}paymentDetailsTemplate(){const n=m.getAllRequestedCaipNetworks().find(s=>s.caipNetworkId===this.paymentAsset.network);return l`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        .padding=${["6","8","6","8"]}
        gap="2"
      >
        <wui-flex alignItems="center" gap="1">
          <wui-text variant="h1-regular" color="primary">
            ${V(this.amount||"0")}
          </wui-text>

          <wui-flex flexDirection="column">
            <wui-text variant="h6-regular" color="secondary">
              ${this.paymentAsset.metadata.symbol||"Unknown"}
            </wui-text>
            <wui-text variant="md-medium" color="secondary"
              >on ${(n==null?void 0:n.name)||"Unknown"}</wui-text
            >
          </wui-flex>
        </wui-flex>

        <wui-flex class="left-image-container">
          <wui-image
            src=${w(this.paymentAsset.metadata.logoURI)}
            class="token-image"
          ></wui-image>
          <wui-image
            src=${w(P.getNetworkImage(n))}
            class="chain-image"
          ></wui-image>
        </wui-flex>
      </wui-flex>
    `}payWithWalletTemplate(){return Qe(this.paymentAsset.network)?this.caipAddress?this.connectedWalletTemplate():this.disconnectedWalletTemplate():l``}connectedWalletTemplate(){const{name:e,image:n}=this.getWalletProperties({namespace:this.namespace});return l`
      <wui-flex flexDirection="column" gap="3">
        <wui-list-item
          type="secondary"
          boxColor="foregroundSecondary"
          @click=${this.onWalletPayment}
          .boxed=${!1}
          ?chevron=${!0}
          ?fullSize=${!1}
          ?rounded=${!0}
          data-testid="wallet-payment-option"
          imageSrc=${w(n)}
          imageSize="3xl"
        >
          <wui-text variant="lg-regular" color="primary">Pay with ${e}</wui-text>
        </wui-list-item>

        <wui-list-item
          type="secondary"
          icon="power"
          iconColor="error"
          @click=${this.onDisconnect}
          data-testid="disconnect-button"
          ?chevron=${!1}
          boxColor="foregroundSecondary"
        >
          <wui-text variant="lg-regular" color="secondary">Disconnect</wui-text>
        </wui-list-item>
      </wui-flex>
    `}disconnectedWalletTemplate(){return l`<wui-list-item
      type="secondary"
      boxColor="foregroundSecondary"
      variant="icon"
      iconColor="default"
      iconVariant="overlay"
      icon="wallet"
      @click=${this.onWalletPayment}
      ?chevron=${!0}
      data-testid="wallet-payment-option"
    >
      <wui-text variant="lg-regular" color="primary">Pay with wallet</wui-text>
    </wui-list-item>`}templateExchangeOptions(){if(this.isLoading)return l`<wui-flex justifyContent="center" alignItems="center">
        <wui-loading-spinner size="md"></wui-loading-spinner>
      </wui-flex>`;const e=this.exchanges.filter(n=>ze(this.paymentAsset)?n.id===pe:n.id!==pe);return e.length===0?l`<wui-flex justifyContent="center" alignItems="center">
        <wui-text variant="md-medium" color="primary">No exchanges available</wui-text>
      </wui-flex>`:e.map(n=>l`
        <wui-list-item
          type="secondary"
          boxColor="foregroundSecondary"
          @click=${()=>this.onExchangePayment(n)}
          data-testid="exchange-option-${n.id}"
          ?chevron=${!0}
          imageSrc=${w(n.imageUrl)}
        >
          <wui-text flexGrow="1" variant="lg-regular" color="primary">
            Pay with ${n.name}
          </wui-text>
        </wui-list-item>
      `)}templateSeparator(){return l`<wui-separator text="or" bgColor="secondary"></wui-separator>`}async onWalletPayment(){if(!this.namespace)throw new Error("Namespace not found");this.caipAddress?F.push("PayQuote"):(await I.connect(),await B.open({view:"PayQuote"}))}onExchangePayment(e){u.setSelectedExchange(e),F.push("PayQuote")}async onDisconnect(){try{await T.disconnect(),await B.open({view:"Pay"})}catch{console.error("Failed to disconnect"),C.showError("Failed to disconnect")}}getWalletProperties({namespace:e}){if(!e)return{name:void 0,image:void 0};const n=this.activeConnectorIds[e];if(!n)return{name:void 0,image:void 0};const s=I.getConnector({id:n,namespace:e});if(!s)return{name:void 0,image:void 0};const i=P.getConnectorImage(s);return{name:s.name,image:i}}};k.styles=Xe;U([h()],k.prototype,"amount",void 0);U([h()],k.prototype,"namespace",void 0);U([h()],k.prototype,"paymentAsset",void 0);U([h()],k.prototype,"activeConnectorIds",void 0);U([h()],k.prototype,"caipAddress",void 0);U([h()],k.prototype,"exchanges",void 0);U([h()],k.prototype,"isLoading",void 0);k=U([R("w3m-pay-view")],k);const we=[{id:"received",title:"Receiving funds",icon:"dollar"},{id:"processing",title:"Swapping asset",icon:"recycleHorizontal"},{id:"sending",title:"Sending asset to the recipient address",icon:"send"}],fe=["success","submitted","failure","timeout","refund"],Je=L`
  :host {
    display: block;
    height: 100%;
    width: 100%;
  }

  wui-image {
    border-radius: ${({borderRadius:t})=>t.round};
  }

  .token-badge-container {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: ${({borderRadius:t})=>t[4]};
    z-index: 3;
    min-width: 105px;
  }

  .token-badge-container.loading {
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
    border: 3px solid ${({tokens:t})=>t.theme.backgroundPrimary};
  }

  .token-badge-container.success {
    background-color: ${({tokens:t})=>t.theme.backgroundPrimary};
    border: 3px solid ${({tokens:t})=>t.theme.backgroundPrimary};
  }

  .token-image-container {
    position: relative;
  }

  .token-image {
    border-radius: ${({borderRadius:t})=>t.round};
    width: 64px;
    height: 64px;
  }

  .token-image.success {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  .token-image.error {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  .token-image.loading {
    background: ${({colors:t})=>t.accent010};
  }

  .token-image wui-icon {
    width: 32px;
    height: 32px;
  }

  .token-badge {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border: 1px solid ${({tokens:t})=>t.theme.foregroundSecondary};
    border-radius: ${({borderRadius:t})=>t[4]};
  }

  .token-badge wui-text {
    white-space: nowrap;
  }

  .payment-lifecycle-container {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:t})=>t[6]};
    border-top-left-radius: ${({borderRadius:t})=>t[6]};
  }

  .payment-step-badge {
    padding: ${({spacing:t})=>t[1]} ${({spacing:t})=>t[2]};
    border-radius: ${({borderRadius:t})=>t[1]};
  }

  .payment-step-badge.loading {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  .payment-step-badge.error {
    background-color: ${({tokens:t})=>t.core.backgroundError};
  }

  .payment-step-badge.success {
    background-color: ${({tokens:t})=>t.core.backgroundSuccess};
  }

  .step-icon-container {
    position: relative;
    height: 40px;
    width: 40px;
    border-radius: ${({borderRadius:t})=>t.round};
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
  }

  .step-icon-box {
    position: absolute;
    right: -4px;
    bottom: -1px;
    padding: 2px;
    border-radius: ${({borderRadius:t})=>t.round};
    border: 2px solid ${({tokens:t})=>t.theme.backgroundPrimary};
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
  }

  .step-icon-box.success {
    background-color: ${({tokens:t})=>t.core.backgroundSuccess};
  }
`;var S=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};const Ze={received:["pending","success","submitted"],processing:["success","submitted"],sending:["success","submitted"]},et=3e3;let A=class extends O{constructor(){super(),this.unsubscribe=[],this.pollingInterval=null,this.paymentAsset=u.state.paymentAsset,this.quoteStatus=u.state.quoteStatus,this.quote=u.state.quote,this.amount=u.state.amount,this.namespace=void 0,this.caipAddress=void 0,this.profileName=null,this.activeConnectorIds=I.state.activeConnectorIds,this.selectedExchange=u.state.selectedExchange,this.initializeNamespace(),this.unsubscribe.push(u.subscribeKey("quoteStatus",e=>this.quoteStatus=e),u.subscribeKey("quote",e=>this.quote=e),I.subscribeKey("activeConnectorIds",e=>this.activeConnectorIds=e),u.subscribeKey("selectedExchange",e=>this.selectedExchange=e))}connectedCallback(){super.connectedCallback(),this.startPolling()}disconnectedCallback(){super.disconnectedCallback(),this.stopPolling(),this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column" .padding=${["3","0","0","0"]} gap="2">
        ${this.tokenTemplate()} ${this.paymentTemplate()} ${this.paymentLifecycleTemplate()}
      </wui-flex>
    `}tokenTemplate(){const e=V(this.amount||"0"),n=this.paymentAsset.metadata.symbol??"Unknown",i=m.getAllRequestedCaipNetworks().find(c=>c.caipNetworkId===this.paymentAsset.network),a=this.quoteStatus==="failure"||this.quoteStatus==="timeout"||this.quoteStatus==="refund";return this.quoteStatus==="success"||this.quoteStatus==="submitted"?l`<wui-flex alignItems="center" justifyContent="center">
        <wui-flex justifyContent="center" alignItems="center" class="token-image success">
          <wui-icon name="checkmark" color="success" size="inherit"></wui-icon>
        </wui-flex>
      </wui-flex>`:a?l`<wui-flex alignItems="center" justifyContent="center">
        <wui-flex justifyContent="center" alignItems="center" class="token-image error">
          <wui-icon name="close" color="error" size="inherit"></wui-icon>
        </wui-flex>
      </wui-flex>`:l`
      <wui-flex alignItems="center" justifyContent="center">
        <wui-flex class="token-image-container">
          <wui-pulse size="125px" rings="3" duration="4" opacity="0.5" variant="accent-primary">
            <wui-flex justifyContent="center" alignItems="center" class="token-image loading">
              <wui-icon name="paperPlaneTitle" color="accent-primary" size="inherit"></wui-icon>
            </wui-flex>
          </wui-pulse>

          <wui-flex
            justifyContent="center"
            alignItems="center"
            class="token-badge-container loading"
          >
            <wui-flex
              alignItems="center"
              justifyContent="center"
              gap="01"
              padding="1"
              class="token-badge"
            >
              <wui-image
                src=${w(P.getNetworkImage(i))}
                class="chain-image"
                size="mdl"
              ></wui-image>

              <wui-text variant="lg-regular" color="primary">${e} ${n}</wui-text>
            </wui-flex>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}paymentTemplate(){return l`
      <wui-flex flexDirection="column" gap="2" .padding=${["0","6","0","6"]}>
        ${this.renderPayment()}
        <wui-separator></wui-separator>
        ${this.renderWallet()}
      </wui-flex>
    `}paymentLifecycleTemplate(){const e=this.getStepsWithStatus();return l`
      <wui-flex flexDirection="column" padding="4" gap="2" class="payment-lifecycle-container">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">PAYMENT CYCLE</wui-text>

          ${this.renderPaymentCycleBadge()}
        </wui-flex>

        <wui-flex flexDirection="column" gap="5" .padding=${["2","0","2","0"]}>
          ${e.map(n=>this.renderStep(n))}
        </wui-flex>
      </wui-flex>
    `}renderPaymentCycleBadge(){var i;const e=this.quoteStatus==="failure"||this.quoteStatus==="timeout"||this.quoteStatus==="refund",n=this.quoteStatus==="success"||this.quoteStatus==="submitted";if(e)return l`
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge error"
          gap="1"
        >
          <wui-icon name="close" color="error" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="error">Failed</wui-text>
        </wui-flex>
      `;if(n)return l`
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge success"
          gap="1"
        >
          <wui-icon name="checkmark" color="success" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="success">Completed</wui-text>
        </wui-flex>
      `;const s=((i=this.quote)==null?void 0:i.timeInSeconds)??0;return l`
      <wui-flex alignItems="center" justifyContent="space-between" gap="3">
        <wui-flex
          justifyContent="center"
          alignItems="center"
          class="payment-step-badge loading"
          gap="1"
        >
          <wui-icon name="clock" color="default" size="xs"></wui-icon>
          <wui-text variant="sm-regular" color="primary">Est. ${s} sec</wui-text>
        </wui-flex>

        <wui-icon name="chevronBottom" color="default" size="xxs"></wui-icon>
      </wui-flex>
    `}renderPayment(){var o,c,g;const n=m.getAllRequestedCaipNetworks().find(v=>{var W;const M=(W=this.quote)==null?void 0:W.origin.currency.network;if(!M)return!1;const{chainId:j}=y.parseCaipNetworkId(M);return N.isLowerCaseMatch(v.id.toString(),j.toString())}),s=b.formatNumber(((o=this.quote)==null?void 0:o.origin.amount)||"0",{decimals:((c=this.quote)==null?void 0:c.origin.currency.metadata.decimals)??0}).toString(),i=V(s),a=((g=this.quote)==null?void 0:g.origin.currency.metadata.symbol)??"Unknown";return l`
      <wui-flex
        alignItems="flex-start"
        justifyContent="space-between"
        .padding=${["3","0","3","0"]}
      >
        <wui-text variant="lg-regular" color="secondary">Payment Method</wui-text>

        <wui-flex flexDirection="column" alignItems="flex-end" gap="1">
          <wui-flex alignItems="center" gap="01">
            <wui-text variant="lg-regular" color="primary">${i}</wui-text>
            <wui-text variant="lg-regular" color="secondary">${a}</wui-text>
          </wui-flex>

          <wui-flex alignItems="center" gap="1">
            <wui-text variant="md-regular" color="secondary">on</wui-text>
            <wui-image
              src=${w(P.getNetworkImage(n))}
              size="xs"
            ></wui-image>
            <wui-text variant="md-regular" color="secondary">${n==null?void 0:n.name}</wui-text>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}renderWallet(){return l`
      <wui-flex
        alignItems="flex-start"
        justifyContent="space-between"
        .padding=${["3","0","3","0"]}
      >
        <wui-text variant="lg-regular" color="secondary">Wallet</wui-text>

        ${this.renderWalletText()}
      </wui-flex>
    `}renderWalletText(){var i;const{image:e}=this.getWalletProperties({namespace:this.namespace}),{address:n}=this.caipAddress?y.parseCaipAddress(this.caipAddress):{},s=(i=this.selectedExchange)==null?void 0:i.name;return this.selectedExchange?l`
        <wui-flex alignItems="center" justifyContent="flex-end" gap="1">
          <wui-text variant="lg-regular" color="primary">${s}</wui-text>
          <wui-image src=${w(this.selectedExchange.imageUrl)} size="mdl"></wui-image>
        </wui-flex>
      `:l`
      <wui-flex alignItems="center" justifyContent="flex-end" gap="1">
        <wui-text variant="lg-regular" color="primary">
          ${Ae.getTruncateString({string:this.profileName||n||s||"",charsStart:this.profileName?16:4,charsEnd:this.profileName?0:6,truncate:this.profileName?"end":"middle"})}
        </wui-text>

        <wui-image src=${w(e)} size="mdl"></wui-image>
      </wui-flex>
    `}getStepsWithStatus(){return this.quoteStatus==="failure"||this.quoteStatus==="timeout"||this.quoteStatus==="refund"?we.map(n=>({...n,status:"failed"})):we.map(n=>{const i=(Ze[n.id]??[]).includes(this.quoteStatus)?"completed":"pending";return{...n,status:i}})}renderStep({title:e,icon:n,status:s}){return l`
      <wui-flex alignItems="center" gap="3">
        <wui-flex justifyContent="center" alignItems="center" class="step-icon-container">
          <wui-icon name=${n} color="default" size="mdl"></wui-icon>

          <wui-flex alignItems="center" justifyContent="center" class=${ye({"step-icon-box":!0,success:s==="completed"})}>
            ${this.renderStatusIndicator(s)}
          </wui-flex>
        </wui-flex>

        <wui-text variant="md-regular" color="primary">${e}</wui-text>
      </wui-flex>
    `}renderStatusIndicator(e){return e==="completed"?l`<wui-icon size="sm" color="success" name="checkmark"></wui-icon>`:e==="failed"?l`<wui-icon size="sm" color="error" name="close"></wui-icon>`:e==="pending"?l`<wui-loading-spinner color="accent-primary" size="sm"></wui-loading-spinner>`:null}startPolling(){this.pollingInterval||(this.fetchQuoteStatus(),this.pollingInterval=setInterval(()=>{this.fetchQuoteStatus()},et))}stopPolling(){this.pollingInterval&&(clearInterval(this.pollingInterval),this.pollingInterval=null)}async fetchQuoteStatus(){const e=u.state.requestId;if(!e||fe.includes(this.quoteStatus))this.stopPolling();else try{await u.fetchQuoteStatus({requestId:e}),fe.includes(this.quoteStatus)&&this.stopPolling()}catch{this.stopPolling()}}initializeNamespace(){var n,s;const e=m.state.activeChain;this.namespace=e,this.caipAddress=(n=m.getAccountData(e))==null?void 0:n.caipAddress,this.profileName=((s=m.getAccountData(e))==null?void 0:s.profileName)??null,this.unsubscribe.push(m.subscribeChainProp("accountState",i=>{this.caipAddress=i==null?void 0:i.caipAddress,this.profileName=(i==null?void 0:i.profileName)??null},e))}getWalletProperties({namespace:e}){if(!e)return{name:void 0,image:void 0};const n=this.activeConnectorIds[e];if(!n)return{name:void 0,image:void 0};const s=I.getConnector({id:n,namespace:e});if(!s)return{name:void 0,image:void 0};const i=P.getConnectorImage(s);return{name:s.name,image:i}}};A.styles=Je;S([h()],A.prototype,"paymentAsset",void 0);S([h()],A.prototype,"quoteStatus",void 0);S([h()],A.prototype,"quote",void 0);S([h()],A.prototype,"amount",void 0);S([h()],A.prototype,"namespace",void 0);S([h()],A.prototype,"caipAddress",void 0);S([h()],A.prototype,"profileName",void 0);S([h()],A.prototype,"activeConnectorIds",void 0);S([h()],A.prototype,"selectedExchange",void 0);A=S([R("w3m-pay-loading-view")],A);const tt=Ee`
  :host {
    display: block;
  }
`;var nt=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};let ne=class extends O{render(){return l`
      <wui-flex flexDirection="column" gap="4">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Pay</wui-text>
          <wui-shimmer width="60px" height="16px" borderRadius="4xs" variant="light"></wui-shimmer>
        </wui-flex>

        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Network Fee</wui-text>

          <wui-flex flexDirection="column" alignItems="flex-end" gap="2">
            <wui-shimmer
              width="75px"
              height="16px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>

            <wui-flex alignItems="center" gap="01">
              <wui-shimmer width="14px" height="14px" rounded variant="light"></wui-shimmer>
              <wui-shimmer
                width="49px"
                height="14px"
                borderRadius="4xs"
                variant="light"
              ></wui-shimmer>
            </wui-flex>
          </wui-flex>
        </wui-flex>

        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Service Fee</wui-text>
          <wui-shimmer width="75px" height="16px" borderRadius="4xs" variant="light"></wui-shimmer>
        </wui-flex>
      </wui-flex>
    `}};ne.styles=[tt];ne=nt([R("w3m-pay-fees-skeleton")],ne);const st=L`
  :host {
    display: block;
  }

  wui-image {
    border-radius: ${({borderRadius:t})=>t.round};
  }
`;var xe=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};let Y=class extends O{constructor(){super(),this.unsubscribe=[],this.quote=u.state.quote,this.unsubscribe.push(u.subscribeKey("quote",e=>this.quote=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var n,s,i;const e=b.formatNumber(((n=this.quote)==null?void 0:n.origin.amount)||"0",{decimals:((s=this.quote)==null?void 0:s.origin.currency.metadata.decimals)??0,round:6}).toString();return l`
      <wui-flex flexDirection="column" gap="4">
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">Pay</wui-text>
          <wui-text variant="md-regular" color="primary">
            ${e} ${((i=this.quote)==null?void 0:i.origin.currency.metadata.symbol)||"Unknown"}
          </wui-text>
        </wui-flex>

        ${this.quote&&this.quote.fees.length>0?this.quote.fees.map(a=>this.renderFee(a)):null}
      </wui-flex>
    `}renderFee(e){const n=e.id==="network",s=b.formatNumber(e.amount||"0",{decimals:e.currency.metadata.decimals??0,round:6}).toString();if(n){const a=m.getAllRequestedCaipNetworks().find(o=>N.isLowerCaseMatch(o.caipNetworkId,e.currency.network));return l`
        <wui-flex alignItems="center" justifyContent="space-between">
          <wui-text variant="md-regular" color="secondary">${e.label}</wui-text>

          <wui-flex flexDirection="column" alignItems="flex-end" gap="2">
            <wui-text variant="md-regular" color="primary">
              ${s} ${e.currency.metadata.symbol||"Unknown"}
            </wui-text>

            <wui-flex alignItems="center" gap="01">
              <wui-image
                src=${w(P.getNetworkImage(a))}
                size="xs"
              ></wui-image>
              <wui-text variant="sm-regular" color="secondary">
                ${(a==null?void 0:a.name)||"Unknown"}
              </wui-text>
            </wui-flex>
          </wui-flex>
        </wui-flex>
      `}return l`
      <wui-flex alignItems="center" justifyContent="space-between">
        <wui-text variant="md-regular" color="secondary">${e.label}</wui-text>
        <wui-text variant="md-regular" color="primary">
          ${s} ${e.currency.metadata.symbol||"Unknown"}
        </wui-text>
      </wui-flex>
    `}};Y.styles=[st];xe([h()],Y.prototype,"quote",void 0);Y=xe([R("w3m-pay-fees")],Y);const it=L`
  :host {
    display: block;
    width: 100%;
  }

  .disabled-container {
    padding: ${({spacing:t})=>t[2]};
    min-height: 168px;
  }

  wui-icon {
    width: ${({spacing:t})=>t[8]};
    height: ${({spacing:t})=>t[8]};
  }

  wui-flex > wui-text {
    max-width: 273px;
  }
`;var be=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};let z=class extends O{constructor(){super(),this.unsubscribe=[],this.selectedExchange=u.state.selectedExchange,this.unsubscribe.push(u.subscribeKey("selectedExchange",e=>this.selectedExchange=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=!!this.selectedExchange;return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
        class="disabled-container"
      >
        <wui-icon name="coins" color="default" size="inherit"></wui-icon>

        <wui-text variant="md-regular" color="primary" align="center">
          You don't have enough funds to complete this transaction
        </wui-text>

        ${e?null:l`<wui-button
              size="md"
              variant="neutral-secondary"
              @click=${this.dispatchConnectOtherWalletEvent.bind(this)}
              >Connect other wallet</wui-button
            >`}
      </wui-flex>
    `}dispatchConnectOtherWalletEvent(){this.dispatchEvent(new CustomEvent("connectOtherWallet",{detail:!0,bubbles:!0,composed:!0}))}};z.styles=[it];be([H({type:Array})],z.prototype,"selectedExchange",void 0);z=be([R("w3m-pay-options-empty")],z);const at=L`
  :host {
    display: block;
    width: 100%;
  }

  .pay-options-container {
    max-height: 196px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }

  .pay-options-container::-webkit-scrollbar {
    display: none;
  }

  .pay-option-container {
    border-radius: ${({borderRadius:t})=>t[4]};
    padding: ${({spacing:t})=>t[3]};
    min-height: 60px;
  }

  .token-images-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .chain-image {
    position: absolute;
    bottom: -3px;
    right: -5px;
    border: 2px solid ${({tokens:t})=>t.theme.foregroundSecondary};
  }
`;var rt=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};let se=class extends O{render(){return l`
      <wui-flex flexDirection="column" gap="2" class="pay-options-container">
        ${this.renderOptionEntry()} ${this.renderOptionEntry()} ${this.renderOptionEntry()}
      </wui-flex>
    `}renderOptionEntry(){return l`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        class="pay-option-container"
      >
        <wui-flex alignItems="center" gap="2">
          <wui-flex class="token-images-container">
            <wui-shimmer
              width="32px"
              height="32px"
              rounded
              variant="light"
              class="token-image"
            ></wui-shimmer>
            <wui-shimmer
              width="16px"
              height="16px"
              rounded
              variant="light"
              class="chain-image"
            ></wui-shimmer>
          </wui-flex>

          <wui-flex flexDirection="column" gap="1">
            <wui-shimmer
              width="74px"
              height="16px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>
            <wui-shimmer
              width="46px"
              height="14px"
              borderRadius="4xs"
              variant="light"
            ></wui-shimmer>
          </wui-flex>
        </wui-flex>
      </wui-flex>
    `}};se.styles=[at];se=rt([R("w3m-pay-options-skeleton")],se);const ot=L`
  :host {
    display: block;
    width: 100%;
  }

  .pay-options-container {
    max-height: 196px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    mask-image: var(--options-mask-image);
    -webkit-mask-image: var(--options-mask-image);
  }

  .pay-options-container::-webkit-scrollbar {
    display: none;
  }

  .pay-option-container {
    cursor: pointer;
    border-radius: ${({borderRadius:t})=>t[4]};
    padding: ${({spacing:t})=>t[3]};
    transition: background-color ${({durations:t})=>t.lg}
      ${({easings:t})=>t["ease-out-power-1"]};
    will-change: background-color;
  }

  .token-images-container {
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .token-image {
    border-radius: ${({borderRadius:t})=>t.round};
    width: 32px;
    height: 32px;
  }

  .chain-image {
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: -3px;
    right: -5px;
    border-radius: ${({borderRadius:t})=>t.round};
    border: 2px solid ${({tokens:t})=>t.theme.backgroundPrimary};
  }

  @media (hover: hover) and (pointer: fine) {
    .pay-option-container:hover {
      background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    }
  }
`;var K=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};const ct=300;let q=class extends O{constructor(){super(),this.unsubscribe=[],this.options=[],this.selectedPaymentAsset=null}disconnectedCallback(){var n,s;this.unsubscribe.forEach(i=>i()),(n=this.resizeObserver)==null||n.disconnect();const e=(s=this.shadowRoot)==null?void 0:s.querySelector(".pay-options-container");e==null||e.removeEventListener("scroll",this.handleOptionsListScroll.bind(this))}firstUpdated(){var n,s;const e=(n=this.shadowRoot)==null?void 0:n.querySelector(".pay-options-container");e&&(requestAnimationFrame(this.handleOptionsListScroll.bind(this)),e==null||e.addEventListener("scroll",this.handleOptionsListScroll.bind(this)),this.resizeObserver=new ResizeObserver(()=>{this.handleOptionsListScroll()}),(s=this.resizeObserver)==null||s.observe(e),this.handleOptionsListScroll())}render(){return l`
      <wui-flex flexDirection="column" gap="2" class="pay-options-container">
        ${this.options.map(e=>this.payOptionTemplate(e))}
      </wui-flex>
    `}payOptionTemplate(e){var ce,ue;const{network:n,metadata:s,asset:i,amount:a="0"}=e,c=m.getAllRequestedCaipNetworks().find(G=>G.caipNetworkId===n),g=`${n}:${i}`,v=`${(ce=this.selectedPaymentAsset)==null?void 0:ce.network}:${(ue=this.selectedPaymentAsset)==null?void 0:ue.asset}`,M=g===v,j=b.bigNumber(a,{safe:!0}),W=j.gt(0);return l`
      <wui-flex
        alignItems="center"
        justifyContent="space-between"
        gap="2"
        @click=${()=>{var G;return(G=this.onSelect)==null?void 0:G.call(this,e)}}
        class="pay-option-container"
      >
        <wui-flex alignItems="center" gap="2">
          <wui-flex class="token-images-container">
            <wui-image
              src=${w(s.logoURI)}
              class="token-image"
              size="3xl"
            ></wui-image>
            <wui-image
              src=${w(P.getNetworkImage(c))}
              class="chain-image"
              size="md"
            ></wui-image>
          </wui-flex>

          <wui-flex flexDirection="column" gap="1">
            <wui-text variant="lg-regular" color="primary">${s.symbol}</wui-text>
            ${W?l`<wui-text variant="sm-regular" color="secondary">
                  ${j.round(6).toString()} ${s.symbol}
                </wui-text>`:null}
          </wui-flex>
        </wui-flex>

        ${M?l`<wui-icon name="checkmark" size="md" color="success"></wui-icon>`:null}
      </wui-flex>
    `}handleOptionsListScroll(){var s;const e=(s=this.shadowRoot)==null?void 0:s.querySelector(".pay-options-container");if(!e)return;e.scrollHeight>ct?(e.style.setProperty("--options-mask-image",`linear-gradient(
          to bottom,
          rgba(0, 0, 0, calc(1 - var(--options-scroll--top-opacity))) 0px,
          rgba(200, 200, 200, calc(1 - var(--options-scroll--top-opacity))) 1px,
          black 50px,
          black calc(100% - 50px),
          rgba(155, 155, 155, calc(1 - var(--options-scroll--bottom-opacity))) calc(100% - 1px),
          rgba(0, 0, 0, calc(1 - var(--options-scroll--bottom-opacity))) 100%
        )`),e.style.setProperty("--options-scroll--top-opacity",le.interpolate([0,50],[0,1],e.scrollTop).toString()),e.style.setProperty("--options-scroll--bottom-opacity",le.interpolate([0,50],[0,1],e.scrollHeight-e.scrollTop-e.offsetHeight).toString())):(e.style.setProperty("--options-mask-image","none"),e.style.setProperty("--options-scroll--top-opacity","0"),e.style.setProperty("--options-scroll--bottom-opacity","0"))}};q.styles=[ot];K([H({type:Array})],q.prototype,"options",void 0);K([H()],q.prototype,"selectedPaymentAsset",void 0);K([H()],q.prototype,"onSelect",void 0);q=K([R("w3m-pay-options")],q);const ut=L`
  .payment-methods-container {
    background-color: ${({tokens:t})=>t.theme.foregroundPrimary};
    border-top-right-radius: ${({borderRadius:t})=>t[5]};
    border-top-left-radius: ${({borderRadius:t})=>t[5]};
  }

  .pay-options-container {
    background-color: ${({tokens:t})=>t.theme.foregroundSecondary};
    border-radius: ${({borderRadius:t})=>t[5]};
    padding: ${({spacing:t})=>t[1]};
  }

  w3m-tooltip-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: fit-content;
  }

  wui-image {
    border-radius: ${({borderRadius:t})=>t.round};
  }

  w3m-pay-options.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;var x=function(t,e,n,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,n):s,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(t,e,n,s);else for(var c=t.length-1;c>=0;c--)(o=t[c])&&(a=(i<3?o(a):i>3?o(e,n,a):o(e,n))||a);return i>3&&a&&Object.defineProperty(e,n,a),a};const Q={eip155:"ethereum",solana:"solana",bip122:"bitcoin",ton:"ton"},lt={eip155:{icon:Q.eip155,label:"EVM"},solana:{icon:Q.solana,label:"Solana"},bip122:{icon:Q.bip122,label:"Bitcoin"},ton:{icon:Q.ton,label:"Ton"}};let f=class extends O{constructor(){super(),this.unsubscribe=[],this.profileName=null,this.paymentAsset=u.state.paymentAsset,this.namespace=void 0,this.caipAddress=void 0,this.amount=u.state.amount,this.recipient=u.state.recipient,this.activeConnectorIds=I.state.activeConnectorIds,this.selectedPaymentAsset=u.state.selectedPaymentAsset,this.selectedExchange=u.state.selectedExchange,this.isFetchingQuote=u.state.isFetchingQuote,this.quoteError=u.state.quoteError,this.quote=u.state.quote,this.isFetchingTokenBalances=u.state.isFetchingTokenBalances,this.tokenBalances=u.state.tokenBalances,this.isPaymentInProgress=u.state.isPaymentInProgress,this.exchangeUrlForQuote=u.state.exchangeUrlForQuote,this.completedTransactionsCount=0,this.unsubscribe.push(u.subscribeKey("paymentAsset",e=>this.paymentAsset=e)),this.unsubscribe.push(u.subscribeKey("tokenBalances",e=>this.onTokenBalancesChanged(e))),this.unsubscribe.push(u.subscribeKey("isFetchingTokenBalances",e=>this.isFetchingTokenBalances=e)),this.unsubscribe.push(I.subscribeKey("activeConnectorIds",e=>this.activeConnectorIds=e)),this.unsubscribe.push(u.subscribeKey("selectedPaymentAsset",e=>this.selectedPaymentAsset=e)),this.unsubscribe.push(u.subscribeKey("isFetchingQuote",e=>this.isFetchingQuote=e)),this.unsubscribe.push(u.subscribeKey("quoteError",e=>this.quoteError=e)),this.unsubscribe.push(u.subscribeKey("quote",e=>this.quote=e)),this.unsubscribe.push(u.subscribeKey("amount",e=>this.amount=e)),this.unsubscribe.push(u.subscribeKey("recipient",e=>this.recipient=e)),this.unsubscribe.push(u.subscribeKey("isPaymentInProgress",e=>this.isPaymentInProgress=e)),this.unsubscribe.push(u.subscribeKey("selectedExchange",e=>this.selectedExchange=e)),this.unsubscribe.push(u.subscribeKey("exchangeUrlForQuote",e=>this.exchangeUrlForQuote=e)),this.resetQuoteState(),this.initializeNamespace(),this.fetchTokens()}disconnectedCallback(){super.disconnectedCallback(),this.resetAssetsState(),this.unsubscribe.forEach(e=>e())}updated(e){super.updated(e),e.has("selectedPaymentAsset")&&this.fetchQuote()}render(){return l`
      <wui-flex flexDirection="column">
        ${this.profileTemplate()}

        <wui-flex
          flexDirection="column"
          gap="4"
          class="payment-methods-container"
          .padding=${["4","4","5","4"]}
        >
          ${this.paymentOptionsViewTemplate()} ${this.amountWithFeeTemplate()}

          <wui-flex
            alignItems="center"
            justifyContent="space-between"
            .padding=${["1","0","1","0"]}
          >
            <wui-separator></wui-separator>
          </wui-flex>

          ${this.paymentActionsTemplate()}
        </wui-flex>
      </wui-flex>
    `}profileTemplate(){var o,c;if(this.selectedExchange){const g=b.formatNumber((o=this.quote)==null?void 0:o.origin.amount,{decimals:((c=this.quote)==null?void 0:c.origin.currency.metadata.decimals)??0}).toString();return l`
        <wui-flex
          .padding=${["4","3","4","3"]}
          alignItems="center"
          justifyContent="space-between"
          gap="2"
        >
          <wui-text variant="lg-regular" color="secondary">Paying with</wui-text>

          ${this.quote?l`<wui-text variant="lg-regular" color="primary">
                ${b.bigNumber(g,{safe:!0}).round(6).toString()}
                ${this.quote.origin.currency.metadata.symbol}
              </wui-text>`:l`<wui-shimmer width="80px" height="18px" variant="light"></wui-shimmer>`}
        </wui-flex>
      `}const e=_.getPlainAddress(this.caipAddress)??"",{name:n,image:s}=this.getWalletProperties({namespace:this.namespace}),{icon:i,label:a}=lt[this.namespace]??{};return l`
      <wui-flex
        .padding=${["4","3","4","3"]}
        alignItems="center"
        justifyContent="space-between"
        gap="2"
      >
        <wui-wallet-switch
          profileName=${w(this.profileName)}
          address=${w(e)}
          imageSrc=${w(s)}
          alt=${w(n)}
          @click=${this.onConnectOtherWallet.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>

        <wui-wallet-switch
          profileName=${w(a)}
          address=${w(e)}
          icon=${w(i)}
          iconSize="xs"
          .enableGreenCircle=${!1}
          alt=${w(a)}
          @click=${this.onConnectOtherWallet.bind(this)}
          data-testid="wui-wallet-switch"
        ></wui-wallet-switch>
      </wui-flex>
    `}initializeNamespace(){var n,s;const e=m.state.activeChain;this.namespace=e,this.caipAddress=(n=m.getAccountData(e))==null?void 0:n.caipAddress,this.profileName=((s=m.getAccountData(e))==null?void 0:s.profileName)??null,this.unsubscribe.push(m.subscribeChainProp("accountState",i=>this.onAccountStateChanged(i),e))}async fetchTokens(){if(this.namespace){let e;if(this.caipAddress){const{chainId:n,chainNamespace:s}=y.parseCaipAddress(this.caipAddress),i=`${s}:${n}`;e=m.getAllRequestedCaipNetworks().find(o=>o.caipNetworkId===i)}await u.fetchTokens({caipAddress:this.caipAddress,caipNetwork:e,namespace:this.namespace})}}fetchQuote(){if(this.amount&&this.recipient&&this.selectedPaymentAsset&&this.paymentAsset){const{address:e}=this.caipAddress?y.parseCaipAddress(this.caipAddress):{};u.fetchQuote({amount:this.amount.toString(),address:e,sourceToken:this.selectedPaymentAsset,toToken:this.paymentAsset,recipient:this.recipient})}}getWalletProperties({namespace:e}){if(!e)return{name:void 0,image:void 0};const n=this.activeConnectorIds[e];if(!n)return{name:void 0,image:void 0};const s=I.getConnector({id:n,namespace:e});if(!s)return{name:void 0,image:void 0};const i=P.getConnectorImage(s);return{name:s.name,image:i}}paymentOptionsViewTemplate(){return l`
      <wui-flex flexDirection="column" gap="2">
        <wui-text variant="sm-regular" color="secondary">CHOOSE PAYMENT OPTION</wui-text>
        <wui-flex class="pay-options-container">${this.paymentOptionsTemplate()}</wui-flex>
      </wui-flex>
    `}paymentOptionsTemplate(){const e=this.getPaymentAssetFromTokenBalances();if(this.isFetchingTokenBalances)return l`<w3m-pay-options-skeleton></w3m-pay-options-skeleton>`;if(e.length===0)return l`<w3m-pay-options-empty
        @connectOtherWallet=${this.onConnectOtherWallet.bind(this)}
      ></w3m-pay-options-empty>`;const n={disabled:this.isFetchingQuote};return l`<w3m-pay-options
      class=${ye(n)}
      .options=${e}
      .selectedPaymentAsset=${w(this.selectedPaymentAsset)}
      .onSelect=${this.onSelectedPaymentAssetChanged.bind(this)}
    ></w3m-pay-options>`}amountWithFeeTemplate(){return this.isFetchingQuote||!this.selectedPaymentAsset||this.quoteError?l`<w3m-pay-fees-skeleton></w3m-pay-fees-skeleton>`:l`<w3m-pay-fees></w3m-pay-fees>`}paymentActionsTemplate(){var i,a,o;const e=this.isFetchingQuote||this.isFetchingTokenBalances,n=this.isFetchingQuote||this.isFetchingTokenBalances||!this.selectedPaymentAsset||!!this.quoteError,s=b.formatNumber(((i=this.quote)==null?void 0:i.origin.amount)??0,{decimals:((a=this.quote)==null?void 0:a.origin.currency.metadata.decimals)??0}).toString();return this.selectedExchange?e||n?l`
          <wui-shimmer width="100%" height="48px" variant="light" ?rounded=${!0}></wui-shimmer>
        `:l`<wui-button
        size="lg"
        fullWidth
        variant="accent-secondary"
        @click=${this.onPayWithExchange.bind(this)}
      >
        ${`Continue in ${this.selectedExchange.name}`}

        <wui-icon name="arrowRight" color="inherit" size="sm" slot="iconRight"></wui-icon>
      </wui-button>`:l`
      <wui-flex alignItems="center" justifyContent="space-between">
        <wui-flex flexDirection="column" gap="1">
          <wui-text variant="md-regular" color="secondary">Order Total</wui-text>

          ${e||n?l`<wui-shimmer width="58px" height="32px" variant="light"></wui-shimmer>`:l`<wui-flex alignItems="center" gap="01">
                <wui-text variant="h4-regular" color="primary">${V(s)}</wui-text>

                <wui-text variant="lg-regular" color="secondary">
                  ${((o=this.quote)==null?void 0:o.origin.currency.metadata.symbol)||"Unknown"}
                </wui-text>
              </wui-flex>`}
        </wui-flex>

        ${this.actionButtonTemplate({isLoading:e,isDisabled:n})}
      </wui-flex>
    `}actionButtonTemplate(e){const n=X(this.quote),{isLoading:s,isDisabled:i}=e;let a="Pay";return n.length>1&&this.completedTransactionsCount===0&&(a="Approve"),l`
      <wui-button
        size="lg"
        variant="accent-primary"
        ?loading=${s||this.isPaymentInProgress}
        ?disabled=${i||this.isPaymentInProgress}
        @click=${()=>{n.length>0?this.onSendTransactions():this.onTransfer()}}
      >
        ${a}
        ${s?null:l`<wui-icon
              name="arrowRight"
              color="inherit"
              size="sm"
              slot="iconRight"
            ></wui-icon>`}
      </wui-button>
    `}getPaymentAssetFromTokenBalances(){return this.namespace?(this.tokenBalances[this.namespace]??[]).map(i=>{try{return Ve(i)}catch{return null}}).filter(i=>!!i).filter(i=>{const{chainId:a}=y.parseCaipNetworkId(i.network),{chainId:o}=y.parseCaipNetworkId(this.paymentAsset.network);return N.isLowerCaseMatch(i.asset,this.paymentAsset.asset)?!0:this.selectedExchange?!N.isLowerCaseMatch(a.toString(),o.toString()):!0}):[]}onTokenBalancesChanged(e){this.tokenBalances=e;const[n]=this.getPaymentAssetFromTokenBalances();n&&u.setSelectedPaymentAsset(n)}async onConnectOtherWallet(){await I.connect(),await B.open({view:"PayQuote"})}onAccountStateChanged(e){const{address:n}=this.caipAddress?y.parseCaipAddress(this.caipAddress):{};if(this.caipAddress=e==null?void 0:e.caipAddress,this.profileName=(e==null?void 0:e.profileName)??null,n){const{address:s}=this.caipAddress?y.parseCaipAddress(this.caipAddress):{};s?N.isLowerCaseMatch(s,n)||(this.resetAssetsState(),this.resetQuoteState(),this.fetchTokens()):B.close()}}onSelectedPaymentAssetChanged(e){this.isFetchingQuote||u.setSelectedPaymentAsset(e)}async onTransfer(){var n,s,i;const e=ee(this.quote);if(e){if(!N.isLowerCaseMatch((n=this.selectedPaymentAsset)==null?void 0:n.asset,e.deposit.currency))throw new Error("Quote asset is not the same as the selected payment asset");const o=((s=this.selectedPaymentAsset)==null?void 0:s.amount)??"0",c=b.formatNumber(e.deposit.amount,{decimals:((i=this.selectedPaymentAsset)==null?void 0:i.metadata.decimals)??0}).toString();if(!b.bigNumber(o).gte(c)){C.showError("Insufficient funds");return}if(this.quote&&this.selectedPaymentAsset&&this.caipAddress&&this.namespace){const{address:v}=y.parseCaipAddress(this.caipAddress);await u.onTransfer({chainNamespace:this.namespace,fromAddress:v,toAddress:e.deposit.receiver,amount:c,paymentAsset:this.selectedPaymentAsset}),u.setRequestId(e.requestId),F.push("PayLoading")}}}async onSendTransactions(){var o,c,g;const e=((o=this.selectedPaymentAsset)==null?void 0:o.amount)??"0",n=b.formatNumber(((c=this.quote)==null?void 0:c.origin.amount)??0,{decimals:((g=this.selectedPaymentAsset)==null?void 0:g.metadata.decimals)??0}).toString();if(!b.bigNumber(e).gte(n)){C.showError("Insufficient funds");return}const i=X(this.quote),[a]=X(this.quote,this.completedTransactionsCount);a&&this.namespace&&(await u.onSendTransaction({namespace:this.namespace,transactionStep:a}),this.completedTransactionsCount+=1,this.completedTransactionsCount===i.length&&(u.setRequestId(a.requestId),F.push("PayLoading")))}onPayWithExchange(){if(this.exchangeUrlForQuote){const e=_.returnOpenHref("","popupWindow","scrollbar=yes,width=480,height=720");if(!e)throw new Error("Could not create popup window");e.location.href=this.exchangeUrlForQuote;const n=ee(this.quote);n&&u.setRequestId(n.requestId),u.initiatePayment(),F.push("PayLoading")}}resetAssetsState(){u.setSelectedPaymentAsset(null)}resetQuoteState(){u.resetQuoteState()}};f.styles=ut;x([h()],f.prototype,"profileName",void 0);x([h()],f.prototype,"paymentAsset",void 0);x([h()],f.prototype,"namespace",void 0);x([h()],f.prototype,"caipAddress",void 0);x([h()],f.prototype,"amount",void 0);x([h()],f.prototype,"recipient",void 0);x([h()],f.prototype,"activeConnectorIds",void 0);x([h()],f.prototype,"selectedPaymentAsset",void 0);x([h()],f.prototype,"selectedExchange",void 0);x([h()],f.prototype,"isFetchingQuote",void 0);x([h()],f.prototype,"quoteError",void 0);x([h()],f.prototype,"quote",void 0);x([h()],f.prototype,"isFetchingTokenBalances",void 0);x([h()],f.prototype,"tokenBalances",void 0);x([h()],f.prototype,"isPaymentInProgress",void 0);x([h()],f.prototype,"exchangeUrlForQuote",void 0);x([h()],f.prototype,"completedTransactionsCount",void 0);f=x([R("w3m-pay-quote-view")],f);export{u as P};
