import{n as u,r as c,a as w,i as g,o as m,b as l,c as W,U as Ae,d as ke,v as fe,f as rt}from"./vendor-reown-appkit-ui-vz8T27tA.js";import{j as E,c as v,p,m as y,h as f,n as $,R as d,e as Re,k as at,f as A,C as x,T as ne,s as P,M as N,d as Xe,i as st,l as Ye,t as lt,w as Ee,b as Se,o as Qe,v as O,I as ct,S as dt,u as ut,a as pt}from"./vendor-reown-appkit-controllers-jkmAX4ms.js";import{C as be,E as Je}from"./vendor-reown-appkit-common-CkBKLiFV.js";import{H as ht,C as wt}from"./vendor-reown-appkit-utils-DiyVUbeF.js";import{P as me}from"./vendor-reown-appkit-pay-ClgtqooI.js";import{a as mt}from"./vendor-reown-appkit-wallet-HIGfPgUx.js";var ee=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let K=class extends g{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=E.state.connectors,this.count=v.state.count,this.filteredCount=v.state.filteredWallets.length,this.isFetchingRecommendedWallets=v.state.isFetchingRecommendedWallets,this.unsubscribe.push(E.subscribeKey("connectors",e=>this.connectors=e),v.subscribeKey("count",e=>this.count=e),v.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),v.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.connectors.find(b=>b.id==="walletConnect"),{allWallets:t}=p.state;if(!e||t==="HIDE"||t==="ONLY_MOBILE"&&!y.isMobile())return null;const o=v.state.featured.length,r=this.count+o,n=r<10?r:Math.floor(r/10)*10,a=this.filteredCount>0?this.filteredCount:n;let s=`${a}`;this.filteredCount>0?s=`${this.filteredCount}`:a<r&&(s=`${a}+`);const h=f.hasAnyConnection(be.CONNECTOR_ID.WALLET_CONNECT);return l`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${s}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${m(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${h}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){var e;$.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),d.push("AllWallets",{redirectView:(e=d.state.data)==null?void 0:e.redirectView})}};ee([u()],K.prototype,"tabIdx",void 0);ee([c()],K.prototype,"connectors",void 0);ee([c()],K.prototype,"count",void 0);ee([c()],K.prototype,"filteredCount",void 0);ee([c()],K.prototype,"isFetchingRecommendedWallets",void 0);K=ee([w("w3m-all-wallets-widget")],K);const ft=W`
  :host {
    margin-top: ${({spacing:i})=>i[1]};
  }
  wui-separator {
    margin: ${({spacing:i})=>i[3]} calc(${({spacing:i})=>i[3]} * -1)
      ${({spacing:i})=>i[2]} calc(${({spacing:i})=>i[3]} * -1);
    width: calc(100% + ${({spacing:i})=>i[3]} * 2);
  }
`;var te=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let V=class extends g{constructor(){super(),this.unsubscribe=[],this.explorerWallets=v.state.explorerWallets,this.connections=f.state.connections,this.connectorImages=Re.state.connectorImages,this.loadingTelegram=!1,this.unsubscribe.push(f.subscribeKey("connections",e=>this.connections=e),Re.subscribeKey("connectorImages",e=>this.connectorImages=e),v.subscribeKey("explorerFilteredWallets",e=>{this.explorerWallets=e!=null&&e.length?e:v.state.explorerWallets}),v.subscribeKey("explorerWallets",e=>{var t;(t=this.explorerWallets)!=null&&t.length||(this.explorerWallets=e)})),y.isTelegram()&&y.isIos()&&(this.loadingTelegram=!f.state.wcUri,this.unsubscribe.push(f.subscribeKey("wcUri",e=>this.loadingTelegram=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}connectorListTemplate(){return at.connectorList().map((e,t)=>e.kind==="connector"?this.renderConnector(e,t):this.renderWallet(e,t))}getConnectorNamespaces(e){var t;return e.subtype==="walletConnect"?[]:e.subtype==="multiChain"?((t=e.connector.connectors)==null?void 0:t.map(o=>o.chain))||[]:[e.connector.chain]}renderConnector(e,t){var z,H;const o=e.connector,r=A.getConnectorImage(o)||this.connectorImages[(o==null?void 0:o.imageId)??""],a=(this.connections.get(o.chain)??[]).some(Z=>ht.isLowerCaseMatch(Z.connectorId,o.id));let s,h;e.subtype==="walletConnect"?(s="qr code",h="accent"):e.subtype==="injected"||e.subtype==="announced"?(s=a?"connected":"installed",h=a?"info":"success"):(s=void 0,h=void 0);const b=f.hasAnyConnection(be.CONNECTOR_ID.WALLET_CONNECT),R=e.subtype==="walletConnect"||e.subtype==="external"?b:!1;return l`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${m(r)}
        .installed=${!0}
        name=${o.name??"Unknown"}
        .tagVariant=${h}
        tagLabel=${m(s)}
        data-testid=${`wallet-selector-${o.id.toLowerCase()}`}
        size="sm"
        @click=${()=>this.onClickConnector(e)}
        tabIdx=${m(this.tabIdx)}
        ?disabled=${R}
        rdnsId=${m(((z=o.explorerWallet)==null?void 0:z.rdns)||void 0)}
        walletRank=${m((H=o.explorerWallet)==null?void 0:H.order)}
        .namespaces=${this.getConnectorNamespaces(e)}
      >
      </w3m-list-wallet>
    `}onClickConnector(e){var o;const t=(o=d.state.data)==null?void 0:o.redirectView;if(e.subtype==="walletConnect"){E.setActiveConnector(e.connector),y.isMobile()?d.push("AllWallets"):d.push("ConnectingWalletConnect",{redirectView:t});return}if(e.subtype==="multiChain"){E.setActiveConnector(e.connector),d.push("ConnectingMultiChain",{redirectView:t});return}if(e.subtype==="injected"){E.setActiveConnector(e.connector),d.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}if(e.subtype==="announced"){if(e.connector.id==="walletConnect"){y.isMobile()?d.push("AllWallets"):d.push("ConnectingWalletConnect",{redirectView:t});return}d.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}d.push("ConnectingExternal",{connector:e.connector,redirectView:t})}renderWallet(e,t){const o=e.wallet,r=A.getWalletImage(o),a=f.hasAnyConnection(be.CONNECTOR_ID.WALLET_CONNECT),s=this.loadingTelegram,h=e.subtype==="recent"?"recent":void 0,b=e.subtype==="recent"?"info":void 0;return l`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${m(r)}
        name=${o.name??"Unknown"}
        @click=${()=>this.onClickWallet(e)}
        size="sm"
        data-testid=${`wallet-selector-${o.id}`}
        tabIdx=${m(this.tabIdx)}
        ?loading=${s}
        ?disabled=${a}
        rdnsId=${m(o.rdns||void 0)}
        walletRank=${m(o.order)}
        tagLabel=${m(h)}
        .tagVariant=${b}
      >
      </w3m-list-wallet>
    `}onClickWallet(e){var n;const t=(n=d.state.data)==null?void 0:n.redirectView,o=x.state.activeChain;if(e.subtype==="featured"){E.selectWalletConnector(e.wallet);return}if(e.subtype==="recent"){if(this.loadingTelegram)return;E.selectWalletConnector(e.wallet);return}if(e.subtype==="custom"){if(this.loadingTelegram)return;d.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t});return}if(this.loadingTelegram)return;const r=o?E.getConnector({id:e.wallet.id,namespace:o}):void 0;r?d.push("ConnectingExternal",{connector:r,redirectView:t}):d.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t})}};V.styles=ft;te([u({type:Number})],V.prototype,"tabIdx",void 0);te([c()],V.prototype,"explorerWallets",void 0);te([c()],V.prototype,"connections",void 0);te([c()],V.prototype,"connectorImages",void 0);te([c()],V.prototype,"loadingTelegram",void 0);V=te([w("w3m-connector-list")],V);var Le=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let ge=class extends g{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=this.generateTabs();return l`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const e=this.platforms.map(t=>t==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:t==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:t==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:t==="web"?{label:"Webapp",icon:"browser",platform:"web"}:t==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:t})=>t),e}onTabChange(e){var o;const t=this.platformTabs[e];t&&((o=this.onSelectPlatfrom)==null||o.call(this,t))}};Le([u({type:Array})],ge.prototype,"platforms",void 0);Le([u()],ge.prototype,"onSelectPlatfrom",void 0);ge=Le([w("w3m-connecting-header")],ge);const bt=W`
  :host {
    display: block;
    padding: 0 ${({spacing:i})=>i[5]} ${({spacing:i})=>i[5]};
  }
`;var Ze=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let ye=class extends g{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:e,app_store:t,play_store:o,chrome_store:r,homepage:n}=this.wallet,a=y.isMobile(),s=y.isIos(),h=y.isAndroid(),b=[t,o,n,r].filter(Boolean).length>1,R=Ae.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return b&&!a?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${()=>d.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!b&&n?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:t&&s?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:o&&h?l`
        <wui-cta-button
          label=${`Don't have ${R}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&y.openHref(this.wallet.app_store,"_blank")}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&y.openHref(this.wallet.play_store,"_blank")}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&y.openHref(this.wallet.homepage,"_blank")}};ye.styles=[bt];Ze([u({type:Object})],ye.prototype,"wallet",void 0);ye=Ze([w("w3m-mobile-download-links")],ye);const gt=W`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:i})=>i[1]} * -1);
    bottom: calc(${({spacing:i})=>i[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:i})=>i.lg};
    transition-timing-function: ${({easings:i})=>i["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:i})=>i[4]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:i})=>i["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`;var L=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};class k extends g{constructor(){var e,t,o,r,n;super(),this.wallet=(e=d.state.data)==null?void 0:e.wallet,this.connector=(t=d.state.data)==null?void 0:t.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=A.getConnectorImage(this.connector)??A.getWalletImage(this.wallet),this.name=((o=this.wallet)==null?void 0:o.name)??((r=this.connector)==null?void 0:r.name)??"Wallet",this.isRetrying=!1,this.uri=f.state.wcUri,this.error=f.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(f.subscribeKey("wcUri",a=>{var s;this.uri=a,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,(s=this.onConnect)==null||s.call(this))}),f.subscribeKey("wcError",a=>this.error=a)),(y.isTelegram()||y.isSafari())&&y.isIos()&&f.state.wcUri&&((n=this.onConnect)==null||n.call(this))}firstUpdated(){var e;(e=this.onAutoConnect)==null||e.call(this),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),f.setWcError(!1),clearTimeout(this.timeout)}render(){var o;(o=this.onRender)==null||o.call(this),this.onShowRetry();const e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let t="";return this.label?t=this.label:(t=`Continue in ${this.name}`,this.error&&(t="Connection declined")),l`
      <wui-flex
        data-error=${m(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${m(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${t}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?l`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?l`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){var e;if(this.error&&!this.showRetry){this.showRetry=!0;const t=(e=this.shadowRoot)==null?void 0:e.querySelector("wui-button");t==null||t.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){var e,t;f.setWcError(!1),this.onRetry?(this.isRetrying=!0,(e=this.onRetry)==null||e.call(this)):(t=this.onConnect)==null||t.call(this)}loaderTemplate(){const e=ne.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return l`<wui-loading-thumbnail radius=${t*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(y.copyToClopboard(this.uri),P.showSuccess("Link copied"))}catch{P.showError("Failed to copy")}}}k.styles=gt;L([c()],k.prototype,"isRetrying",void 0);L([c()],k.prototype,"uri",void 0);L([c()],k.prototype,"error",void 0);L([c()],k.prototype,"ready",void 0);L([c()],k.prototype,"showRetry",void 0);L([c()],k.prototype,"label",void 0);L([c()],k.prototype,"secondaryBtnLabel",void 0);L([c()],k.prototype,"secondaryLabel",void 0);L([c()],k.prototype,"isLoading",void 0);L([u({type:Boolean})],k.prototype,"isMobile",void 0);L([u()],k.prototype,"onRetry",void 0);var yt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Ve=class extends k{constructor(){var e;if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),$.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:(e=this.wallet)==null?void 0:e.display_index,walletRank:this.wallet.order,view:d.state.view}})}async onConnectProxy(){try{this.error=!1;const{connectors:e}=E.state,t=e.find(o=>{var r,n,a;return o.type==="ANNOUNCED"&&((r=o.info)==null?void 0:r.rdns)===((n=this.wallet)==null?void 0:n.rdns)||o.type==="INJECTED"||o.name===((a=this.wallet)==null?void 0:a.name)});if(t)await f.connectExternal(t,t.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");N.close()}catch(e){e instanceof Xe&&e.originalName===Je.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?$.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):$.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(e==null?void 0:e.message)??"Unknown"}}),this.error=!0}}};Ve=yt([w("w3m-connecting-wc-browser")],Ve);var vt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Me=class extends k{constructor(){var e;if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),$.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:(e=this.wallet)==null?void 0:e.display_index,walletRank:this.wallet.order,view:d.state.view}})}onRenderProxy(){var e;!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:t,name:o}=this.wallet,{redirect:r,href:n}=y.formatNativeUrl(t,this.uri);f.setWcLinking({name:o,href:n}),f.setRecentWallet(this.wallet),y.openHref(r,"_blank")}catch{this.error=!0}}};Me=vt([w("w3m-connecting-wc-desktop")],Me);var ie=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let G=class extends k{constructor(){var e;if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=p.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{st.onConnectMobile(this.wallet)},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=Ye.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(f.subscribeKey("wcUri",()=>{this.onHandleURI()})),$.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:(e=this.wallet)==null?void 0:e.display_index,walletRank:this.wallet.order,view:d.state.view}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){var e;this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,(e=this.onConnect)==null||e.call(this))}onTryAgain(){var e;f.setWcError(!1),(e=this.onConnect)==null||e.call(this)}};ie([c()],G.prototype,"redirectDeeplink",void 0);ie([c()],G.prototype,"redirectUniversalLink",void 0);ie([c()],G.prototype,"target",void 0);ie([c()],G.prototype,"preferUniversalLinks",void 0);ie([c()],G.prototype,"isLoading",void 0);G=ie([w("w3m-connecting-wc-mobile")],G);const xt=W`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:i})=>i[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:i})=>i.xl};
    animation-timing-function: ${({easings:i})=>i["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var et=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let ve=class extends k{constructor(){super(),this.basic=!1}firstUpdated(){var e,t,o;this.basic||$.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:((e=this.wallet)==null?void 0:e.name)??"WalletConnect",platform:"qrcode",displayIndex:(t=this.wallet)==null?void 0:t.display_index,walletRank:(o=this.wallet)==null?void 0:o.order,view:d.state.view}})}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this.unsubscribe)==null||e.forEach(t=>t())}render(){return this.onRenderProxy(),l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0)}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const e=this.wallet?this.wallet.name:void 0;f.setWcLinking(void 0),f.setRecentWallet(this.wallet);const t=ne.state.themeVariables["--apkt-qr-color"]??ne.state.themeVariables["--w3m-qr-color"];return l` <wui-qr-code
      theme=${ne.state.themeMode}
      uri=${this.uri}
      imageSrc=${m(A.getWalletImage(this.wallet))}
      color=${m(t)}
      alt=${m(e)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const e=!this.uri||!this.ready;return l`<wui-button
      .disabled=${e}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};ve.styles=xt;et([u({type:Boolean})],ve.prototype,"basic",void 0);ve=et([w("w3m-connecting-wc-qrcode")],ve);var Ct=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let ze=class extends g{constructor(){var e,t,o;if(super(),this.wallet=(e=d.state.data)==null?void 0:e.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");$.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:(t=this.wallet)==null?void 0:t.display_index,walletRank:(o=this.wallet)==null?void 0:o.order,view:d.state.view}})}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${m(A.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};ze=Ct([w("w3m-connecting-wc-unsupported")],ze);var tt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let _e=class extends k{constructor(){var e,t;if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=Ye.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(f.subscribeKey("wcUri",()=>{this.updateLoadingState()})),$.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:(e=this.wallet)==null?void 0:e.display_index,walletRank:(t=this.wallet)==null?void 0:t.order,view:d.state.view}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){var e;if((e=this.wallet)!=null&&e.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:t,name:o}=this.wallet,{redirect:r,href:n}=y.formatUniversalUrl(t,this.uri);f.setWcLinking({name:o,href:n}),f.setRecentWallet(this.wallet),y.openHref(r,"_blank")}catch{this.error=!0}}};tt([c()],_e.prototype,"isLoading",void 0);_e=tt([w("w3m-connecting-wc-web")],_e);const $t=W`
  :host([data-mobile-fullscreen='true']) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :host([data-mobile-fullscreen='true']) wui-ux-by-reown {
    margin-top: auto;
  }
`;var J=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let F=class extends g{constructor(){var e;super(),this.wallet=(e=d.state.data)==null?void 0:e.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!p.state.siwx,this.remoteFeatures=p.state.remoteFeatures,this.displayBranding=!0,this.basic=!1,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(p.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return p.state.enableMobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),l`
      ${this.headerTemplate()}
      <div class="platform-container">${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){var e;return!((e=this.remoteFeatures)!=null&&e.reownBranding)||!this.displayBranding?null:l`<wui-ux-by-reown></wui-ux-by-reown>`}async initializeConnection(e=!1){var t,o;if(!(this.platform==="browser"||p.state.manualWCControl&&!e))try{const{wcPairingExpiry:r,status:n}=f.state,{redirectView:a}=d.state.data??{};if(e||p.state.enableEmbedded||y.isPairingExpired(r)||n==="connecting"){const s=f.getConnections(x.state.activeChain),h=(t=this.remoteFeatures)==null?void 0:t.multiWallet,b=s.length>0;await f.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(b&&h?(d.replace("ProfileWallets"),P.showSuccess("New Wallet Added")):a?d.replace(a):N.close())}}catch(r){if(r instanceof Error&&r.message.includes("An error occurred when attempting to switch chain")&&!p.state.enableNetworkSwitch&&x.state.activeChain){x.setActiveCaipNetwork(wt.getUnsupportedNetwork(`${x.state.activeChain}:${(o=x.state.activeCaipNetwork)==null?void 0:o.id}`)),x.showUnsupportedChainUI();return}r instanceof Xe&&r.originalName===Je.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?$.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:r.message}}):$.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:(r==null?void 0:r.message)??"Unknown"}}),f.setWcError(!0),P.showError(r.message??"Connection error"),f.resetWcConnection(),d.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:e,desktop_link:t,webapp_link:o,injected:r,rdns:n}=this.wallet,a=r==null?void 0:r.map(({injected_id:we})=>we).filter(Boolean),s=[...n?[n]:a??[]],h=p.state.isUniversalProvider?!1:s.length,b=e,R=o,z=f.checkInstalled(s),H=h&&z,Z=t&&!y.isMobile();H&&!x.state.noAdapters&&this.platforms.push("browser"),b&&this.platforms.push(y.isMobile()?"mobile":"qrcode"),R&&this.platforms.push("web"),Z&&this.platforms.push("desktop"),!H&&h&&!x.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return l`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return l`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return l`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return l`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return l`<w3m-connecting-wc-qrcode ?basic=${this.basic}></w3m-connecting-wc-qrcode>`;default:return l`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?l`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){var o;const t=(o=this.shadowRoot)==null?void 0:o.querySelector("div");t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};F.styles=$t;J([c()],F.prototype,"platform",void 0);J([c()],F.prototype,"platforms",void 0);J([c()],F.prototype,"isSiwxEnabled",void 0);J([c()],F.prototype,"remoteFeatures",void 0);J([u({type:Boolean})],F.prototype,"displayBranding",void 0);J([u({type:Boolean})],F.prototype,"basic",void 0);F=J([w("w3m-connecting-wc-view")],F);var Ne=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let re=class extends g{constructor(){super(),this.unsubscribe=[],this.isMobile=y.isMobile(),this.remoteFeatures=p.state.remoteFeatures,this.unsubscribe.push(p.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(this.isMobile){const{featured:e,recommended:t}=v.state,{customWallets:o}=p.state,r=lt.getRecentWallets(),n=e.length||t.length||(o==null?void 0:o.length)||r.length;return l`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${n?l`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return l`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view ?basic=${!0} .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){var e;return(e=this.remoteFeatures)!=null&&e.reownBranding?l` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};Ne([c()],re.prototype,"isMobile",void 0);Ne([c()],re.prototype,"remoteFeatures",void 0);re=Ne([w("w3m-connecting-wc-basic-view")],re);const Wt=W`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:i})=>i[2]};
    padding: ${({spacing:i})=>i[3]} ${({spacing:i})=>i[0]};
    background-color: ${({tokens:i})=>i.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:i})=>i[4]}, 20px);
    transition:
      color ${({durations:i})=>i.lg} ${({easings:i})=>i["ease-out-power-1"]},
      background-color ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-1"]},
      border-radius ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:i})=>i.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:i})=>i.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:i})=>i.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:i})=>i.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:i})=>i.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:i})=>i.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var D=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let T=class extends g{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.isImpressed=!1,this.explorerId="",this.walletQuery="",this.certified=!1,this.displayIndex=0,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting?(this.visible=!0,this.fetchImageSrc(),this.sendImpressionEvent()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){var t,o;const e=((t=this.wallet)==null?void 0:t.badge_type)==="certified";return l`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${m(e?"certified":void 0)}
            >${(o=this.wallet)==null?void 0:o.name}</wui-text
          >
          ${e?l`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){var e,t;return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():l`
      <wui-wallet-image
        size="lg"
        imageSrc=${m(this.imageSrc)}
        name=${m((e=this.wallet)==null?void 0:e.name)}
        .installed=${((t=this.wallet)==null?void 0:t.installed)??!1}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return l`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=A.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await A.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}sendImpressionEvent(){!this.wallet||this.isImpressed||(this.isImpressed=!0,$.sendWalletImpressionEvent({name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.explorerId,view:d.state.view,query:this.walletQuery,certified:this.certified,displayIndex:this.displayIndex}))}};T.styles=Wt;D([c()],T.prototype,"visible",void 0);D([c()],T.prototype,"imageSrc",void 0);D([c()],T.prototype,"imageLoading",void 0);D([c()],T.prototype,"isImpressed",void 0);D([u()],T.prototype,"explorerId",void 0);D([u()],T.prototype,"walletQuery",void 0);D([u()],T.prototype,"certified",void 0);D([u()],T.prototype,"displayIndex",void 0);D([u({type:Object})],T.prototype,"wallet",void 0);T=D([w("w3m-all-wallets-list-item")],T);const kt=W`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:i})=>i.xl};
    animation-timing-function: ${({easings:i})=>i["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:i})=>i[4]};
    padding-bottom: ${({spacing:i})=>i[4]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var ue=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};const qe="local-paginator";let X=class extends g{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!v.state.wallets.length,this.wallets=v.state.wallets,this.mobileFullScreen=p.state.enableMobileFullScreen,this.unsubscribe.push(v.subscribeKey("wallets",e=>this.wallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){var e;this.unsubscribe.forEach(t=>t()),(e=this.paginationObserver)==null||e.disconnect()}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),l`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){var t;this.loading=!0;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-grid");e&&(await v.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,t){return[...Array(e)].map(()=>l`
        <wui-card-select-loader type="wallet" id=${m(t)}></wui-card-select-loader>
      `)}walletsTemplate(){return Ee.getWalletConnectWallets(this.wallets).map((e,t)=>l`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${e.id}"
          @click=${()=>this.onConnectWallet(e)}
          .wallet=${e}
          explorerId=${e.id}
          certified=${this.badge==="certified"}
          displayIndex=${t}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:e,recommended:t,featured:o,count:r,mobileFilteredOutWalletsLength:n}=v.state,a=window.innerWidth<352?3:4,s=e.length+t.length;let b=Math.ceil(s/a)*a-s+a;return b-=e.length?o.length%a:0,r===0&&o.length>0?null:r===0||[...o,...e,...t].length<r-(n??0)?this.shimmerTemplate(b,qe):null}createPaginationObserver(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelector(`#${qe}`);e&&(this.paginationObserver=new IntersectionObserver(([o])=>{if(o!=null&&o.isIntersecting&&!this.loading){const{page:r,count:n,wallets:a}=v.state;a.length<n&&v.fetchWalletsByPage({page:r+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){E.selectWalletConnector(e)}};X.styles=kt;ue([c()],X.prototype,"loading",void 0);ue([c()],X.prototype,"wallets",void 0);ue([c()],X.prototype,"badge",void 0);ue([c()],X.prototype,"mobileFullScreen",void 0);X=ue([w("w3m-all-wallets-list")],X);const St=ke`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
    height: auto;
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var pe=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Y=class extends g{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.mobileFullScreen=p.state.enableMobileFullScreen,this.query=""}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.onSearch(),this.loading?l`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await v.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:e}=v.state,t=Ee.markWalletsAsInstalled(e),o=Ee.filterWalletsByWcSupport(t);return o.length?l`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${o.map((r,n)=>l`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(r)}
              .wallet=${r}
              data-testid="wallet-search-item-${r.id}"
              explorerId=${r.id}
              certified=${this.badge==="certified"}
              walletQuery=${this.query}
              displayIndex=${n}
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:l`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){E.selectWalletConnector(e)}};Y.styles=St;pe([c()],Y.prototype,"loading",void 0);pe([c()],Y.prototype,"mobileFullScreen",void 0);pe([u()],Y.prototype,"query",void 0);pe([u()],Y.prototype,"badge",void 0);Y=pe([w("w3m-all-wallets-search")],Y);var je=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let ae=class extends g{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=y.debounce(e=>{this.search=e})}render(){const e=this.search.length>=2;return l`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge==="certified"}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?l`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:l`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onCertifiedSwitchChange(e){e.detail?(this.badge="certified",P.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return y.isMobile()?l`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){d.push("ConnectingWalletConnect")}};je([c()],ae.prototype,"search",void 0);je([c()],ae.prototype,"badge",void 0);ae=je([w("w3m-all-wallets-view")],ae);var Rt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Oe=class extends g{constructor(){var e;super(...arguments),this.wallet=(e=d.state.data)==null?void 0:e.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return l`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){var e;return(e=this.wallet)!=null&&e.chrome_store?l`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){var e;return(e=this.wallet)!=null&&e.app_store?l`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){var e;return(e=this.wallet)!=null&&e.play_store?l`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){var e;return(e=this.wallet)!=null&&e.homepage?l`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}openStore(e){e.href&&this.wallet&&($.sendEvent({type:"track",event:"GET_WALLET",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.wallet.id,type:e.type}}),y.openHref(e.href,"_blank"))}onChromeStore(){var e;(e=this.wallet)!=null&&e.chrome_store&&this.openStore({href:this.wallet.chrome_store,type:"chrome_store"})}onAppStore(){var e;(e=this.wallet)!=null&&e.app_store&&this.openStore({href:this.wallet.app_store,type:"app_store"})}onPlayStore(){var e;(e=this.wallet)!=null&&e.play_store&&this.openStore({href:this.wallet.play_store,type:"play_store"})}onHomePage(){var e;(e=this.wallet)!=null&&e.homepage&&this.openStore({href:this.wallet.homepage,type:"homepage"})}};Oe=Rt([w("w3m-downloads-view")],Oe);const gi=Object.freeze(Object.defineProperty({__proto__:null,get W3mAllWalletsView(){return ae},get W3mConnectingWcBasicView(){return re},get W3mDownloadsView(){return Oe}},Symbol.toStringTag,{value:"Module"})),Et=W`
  :host {
    display: block;
    position: absolute;
    top: ${({spacing:i})=>i[3]};
    left: ${({spacing:i})=>i[4]};
    right: ${({spacing:i})=>i[4]};
    opacity: 0;
    pointer-events: none;
  }
`;var it=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};const _t={info:{backgroundColor:"fg-350",iconColor:"fg-325",icon:"info"},success:{backgroundColor:"success-glass-reown-020",iconColor:"success-125",icon:"checkmark"},warning:{backgroundColor:"warning-glass-reown-020",iconColor:"warning-100",icon:"warningCircle"},error:{backgroundColor:"error-glass-reown-020",iconColor:"error-125",icon:"warning"}};let xe=class extends g{constructor(){super(),this.unsubscribe=[],this.open=Se.state.open,this.onOpen(!0),this.unsubscribe.push(Se.subscribeKey("open",e=>{this.open=e,this.onOpen(!1)}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const{message:e,variant:t}=Se.state,o=_t[t];return l`
      <wui-alertbar
        message=${e}
        backgroundColor=${o==null?void 0:o.backgroundColor}
        iconColor=${o==null?void 0:o.iconColor}
        icon=${o==null?void 0:o.icon}
        type=${t}
      ></wui-alertbar>
    `}onOpen(e){this.open?(this.animate([{opacity:0,transform:"scale(0.85)"},{opacity:1,transform:"scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: auto"):e||(this.animate([{opacity:1,transform:"scale(1)"},{opacity:0,transform:"scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"}),this.style.cssText="pointer-events: none")}};xe.styles=Et;it([c()],xe.prototype,"open",void 0);xe=it([w("w3m-alertbar")],xe);const q={ACCOUNT_TABS:[{label:"Tokens"},{label:"Activity"}],VIEW_DIRECTION:{Next:"next",Prev:"prev"},ANIMATION_DURATIONS:{HeaderText:120},VIEWS_WITH_LEGAL_FOOTER:["Connect","ConnectWallets","OnRampTokenSelect","OnRampFiatSelect","OnRampProviders"],VIEWS_WITH_DEFAULT_FOOTER:["Networks"]},Ot=W`
  wui-image {
    border-radius: ${({borderRadius:i})=>i.round};
  }

  .transfers-badge {
    background-color: ${({tokens:i})=>i.theme.foregroundPrimary};
    border: 1px solid ${({tokens:i})=>i.theme.foregroundSecondary};
    border-radius: ${({borderRadius:i})=>i[4]};
  }
`;var De=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let se=class extends g{constructor(){super(),this.unsubscribe=[],this.paymentAsset=me.state.paymentAsset,this.amount=me.state.amount,this.unsubscribe.push(me.subscribeKey("paymentAsset",e=>{this.paymentAsset=e}),me.subscribeKey("amount",e=>{this.amount=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){const t=x.getAllRequestedCaipNetworks().find(o=>o.caipNetworkId===this.paymentAsset.network);return l`<wui-flex
      alignItems="center"
      gap="1"
      .padding=${["1","2","1","1"]}
      class="transfers-badge"
    >
      <wui-image src=${m(this.paymentAsset.metadata.logoURI)} size="xl"></wui-image>
      <wui-text variant="lg-regular" color="primary">
        ${this.amount} ${this.paymentAsset.metadata.symbol}
      </wui-text>
      <wui-text variant="sm-regular" color="secondary">
        on ${(t==null?void 0:t.name)??"Unknown"}
      </wui-text>
    </wui-flex>`}};se.styles=[Ot];De([u()],se.prototype,"paymentAsset",void 0);De([u()],se.prototype,"amount",void 0);se=De([w("w3m-pay-header")],se);const Tt=W`
  :host {
    height: 60px;
  }

  :host > wui-flex {
    box-sizing: border-box;
    background-color: var(--local-header-background-color);
  }

  wui-text {
    background-color: var(--local-header-background-color);
  }

  wui-flex.w3m-header-title {
    transform: translateY(0);
    opacity: 1;
  }

  wui-flex.w3m-header-title[view-direction='prev'] {
    animation:
      slide-down-out 120ms forwards ${({easings:i})=>i["ease-out-power-2"]},
      slide-down-in 120ms forwards ${({easings:i})=>i["ease-out-power-2"]};
    animation-delay: 0ms, 200ms;
  }

  wui-flex.w3m-header-title[view-direction='next'] {
    animation:
      slide-up-out 120ms forwards ${({easings:i})=>i["ease-out-power-2"]},
      slide-up-in 120ms forwards ${({easings:i})=>i["ease-out-power-2"]};
    animation-delay: 0ms, 200ms;
  }

  wui-icon-button[data-hidden='true'] {
    opacity: 0 !important;
    pointer-events: none;
  }

  @keyframes slide-up-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(3px);
      opacity: 0;
    }
  }

  @keyframes slide-up-in {
    from {
      transform: translateY(-3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slide-down-out {
    from {
      transform: translateY(0px);
      opacity: 1;
    }
    to {
      transform: translateY(-3px);
      opacity: 0;
    }
  }

  @keyframes slide-down-in {
    from {
      transform: translateY(3px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;var M=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};const It=["SmartSessionList"],Pt={PayWithExchange:fe.tokens.theme.foregroundPrimary};function Ke(){var h,b,R,z,H,Z,we,He;const i=(b=(h=d.state.data)==null?void 0:h.connector)==null?void 0:b.name,e=(z=(R=d.state.data)==null?void 0:R.wallet)==null?void 0:z.name,t=(Z=(H=d.state.data)==null?void 0:H.network)==null?void 0:Z.name,o=e??i,r=E.getConnectors(),n=r.length===1&&((we=r[0])==null?void 0:we.id)==="w3m-email",a=(He=x.getAccountData())==null?void 0:He.socialProvider,s=a?a.charAt(0).toUpperCase()+a.slice(1):"Connect Social";return{Connect:`Connect ${n?"Email":""} Wallet`,Create:"Create Wallet",ChooseAccountName:void 0,Account:void 0,AccountSettings:void 0,AllWallets:"All Wallets",ApproveTransaction:"Approve Transaction",BuyInProgress:"Buy",UsageExceeded:"Usage Exceeded",ConnectingExternal:o??"Connect Wallet",ConnectingWalletConnect:o??"WalletConnect",ConnectingWalletConnectBasic:"WalletConnect",ConnectingSiwe:"Sign In",Convert:"Convert",ConvertSelectToken:"Select token",ConvertPreview:"Preview Convert",Downloads:o?`Get ${o}`:"Downloads",EmailLogin:"Email Login",EmailVerifyOtp:"Confirm Email",EmailVerifyDevice:"Register Device",GetWallet:"Get a Wallet",Networks:"Choose Network",OnRampProviders:"Choose Provider",OnRampActivity:"Activity",OnRampTokenSelect:"Select Token",OnRampFiatSelect:"Select Currency",Pay:"How you pay",ProfileWallets:"Wallets",SwitchNetwork:t??"Switch Network",Transactions:"Activity",UnsupportedChain:"Switch Network",UpgradeEmailWallet:"Upgrade Your Wallet",UpdateEmailWallet:"Edit Email",UpdateEmailPrimaryOtp:"Confirm Current Email",UpdateEmailSecondaryOtp:"Confirm New Email",WhatIsABuy:"What is Buy?",RegisterAccountName:"Choose Name",RegisterAccountNameSuccess:"",WalletReceive:"Receive",WalletCompatibleNetworks:"Compatible Networks",Swap:"Swap",SwapSelectToken:"Select Token",SwapPreview:"Preview Swap",WalletSend:"Send",WalletSendPreview:"Review Send",WalletSendSelectToken:"Select Token",WalletSendConfirmed:"Confirmed",WhatIsANetwork:"What is a network?",WhatIsAWallet:"What is a Wallet?",ConnectWallets:"Connect Wallet",ConnectSocials:"All Socials",ConnectingSocial:s,ConnectingMultiChain:"Select Chain",ConnectingFarcaster:"Farcaster",SwitchActiveChain:"Switch Chain",SmartSessionCreated:void 0,SmartSessionList:"Smart Sessions",SIWXSignMessage:"Sign In",PayLoading:"Processing payment...",PayQuote:"Payment Quote",DataCapture:"Profile",DataCaptureOtpConfirm:"Confirm Email",FundWallet:"Fund Wallet",PayWithExchange:"Deposit from Exchange",PayWithExchangeSelectAsset:"Select Asset",SmartAccountSettings:"Smart Account Settings"}}let j=class extends g{constructor(){super(),this.unsubscribe=[],this.heading=Ke()[d.state.view],this.network=x.state.activeCaipNetwork,this.networkImage=A.getNetworkImage(this.network),this.showBack=!1,this.prevHistoryLength=1,this.view=d.state.view,this.viewDirection="",this.unsubscribe.push(Re.subscribeNetworkImages(()=>{this.networkImage=A.getNetworkImage(this.network)}),d.subscribeKey("view",e=>{setTimeout(()=>{this.view=e,this.heading=Ke()[e]},q.ANIMATION_DURATIONS.HeaderText),this.onViewChange(),this.onHistoryChange()}),x.subscribeKey("activeCaipNetwork",e=>{this.network=e,this.networkImage=A.getNetworkImage(this.network)}))}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){const e=Pt[d.state.view]??fe.tokens.theme.backgroundPrimary;return this.style.setProperty("--local-header-background-color",e),l`
      <wui-flex
        .padding=${["0","4","0","4"]}
        justifyContent="space-between"
        alignItems="center"
      >
        ${this.leftHeaderTemplate()} ${this.titleTemplate()} ${this.rightHeaderTemplate()}
      </wui-flex>
    `}onWalletHelp(){$.sendEvent({type:"track",event:"CLICK_WALLET_HELP"}),d.push("WhatIsAWallet")}async onClose(){await Qe.safeClose()}rightHeaderTemplate(){var t,o,r;const e=(r=(o=(t=p)==null?void 0:t.state)==null?void 0:o.features)==null?void 0:r.smartSessions;return d.state.view!=="Account"||!e?this.closeButtonTemplate():l`<wui-flex>
      <wui-icon-button
        icon="clock"
        size="lg"
        iconSize="lg"
        type="neutral"
        variant="primary"
        @click=${()=>d.push("SmartSessionList")}
        data-testid="w3m-header-smart-sessions"
      ></wui-icon-button>
      ${this.closeButtonTemplate()}
    </wui-flex> `}closeButtonTemplate(){return l`
      <wui-icon-button
        icon="close"
        size="lg"
        type="neutral"
        variant="primary"
        iconSize="lg"
        @click=${this.onClose.bind(this)}
        data-testid="w3m-header-close"
      ></wui-icon-button>
    `}titleTemplate(){if(this.view==="PayQuote")return l`<w3m-pay-header></w3m-pay-header>`;const e=It.includes(this.view);return l`
      <wui-flex
        view-direction="${this.viewDirection}"
        class="w3m-header-title"
        alignItems="center"
        gap="2"
      >
        <wui-text
          display="inline"
          variant="lg-regular"
          color="primary"
          data-testid="w3m-header-text"
        >
          ${this.heading}
        </wui-text>
        ${e?l`<wui-tag variant="accent" size="md">Beta</wui-tag>`:null}
      </wui-flex>
    `}leftHeaderTemplate(){var b;const{view:e}=d.state,t=e==="Connect",o=p.state.enableEmbedded,r=e==="ApproveTransaction",n=e==="ConnectingSiwe",a=e==="Account",s=p.state.enableNetworkSwitch,h=r||n||t&&o;return a&&s?l`<wui-select
        id="dynamic"
        data-testid="w3m-account-select-network"
        active-network=${m((b=this.network)==null?void 0:b.name)}
        @click=${this.onNetworks.bind(this)}
        imageSrc=${m(this.networkImage)}
      ></wui-select>`:this.showBack&&!h?l`<wui-icon-button
        data-testid="header-back"
        id="dynamic"
        icon="chevronLeft"
        size="lg"
        iconSize="lg"
        type="neutral"
        variant="primary"
        @click=${this.onGoBack.bind(this)}
      ></wui-icon-button>`:l`<wui-icon-button
      data-hidden=${!t}
      id="dynamic"
      icon="helpCircle"
      size="lg"
      iconSize="lg"
      type="neutral"
      variant="primary"
      @click=${this.onWalletHelp.bind(this)}
    ></wui-icon-button>`}onNetworks(){this.isAllowedNetworkSwitch()&&($.sendEvent({type:"track",event:"CLICK_NETWORKS"}),d.push("Networks"))}isAllowedNetworkSwitch(){const e=x.getAllRequestedCaipNetworks(),t=e?e.length>1:!1,o=e==null?void 0:e.find(({id:r})=>{var n;return r===((n=this.network)==null?void 0:n.id)});return t||!o}onViewChange(){const{history:e}=d.state;let t=q.VIEW_DIRECTION.Next;e.length<this.prevHistoryLength&&(t=q.VIEW_DIRECTION.Prev),this.prevHistoryLength=e.length,this.viewDirection=t}async onHistoryChange(){var o;const{history:e}=d.state,t=(o=this.shadowRoot)==null?void 0:o.querySelector("#dynamic");e.length>1&&!this.showBack&&t?(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!0,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"})):e.length<=1&&this.showBack&&t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.showBack=!1,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}onGoBack(){d.goBack()}};j.styles=Tt;M([c()],j.prototype,"heading",void 0);M([c()],j.prototype,"network",void 0);M([c()],j.prototype,"networkImage",void 0);M([c()],j.prototype,"showBack",void 0);M([c()],j.prototype,"prevHistoryLength",void 0);M([c()],j.prototype,"view",void 0);M([c()],j.prototype,"viewDirection",void 0);j=M([w("w3m-header")],j);const At=ke`
  :host {
    display: block;
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: 11px;
    left: 50%;
    width: max-content;
  }
`;var nt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Ce=class extends g{constructor(){super(),this.unsubscribe=[],this.timeout=void 0,this.open=P.state.open,this.unsubscribe.push(P.subscribeKey("open",e=>{this.open=e,this.onOpen()}))}disconnectedCallback(){clearTimeout(this.timeout),this.unsubscribe.forEach(e=>e())}render(){const{message:e,variant:t}=P.state;return l` <wui-snackbar message=${e} variant=${t}></wui-snackbar> `}onOpen(){clearTimeout(this.timeout),this.open?(this.animate([{opacity:0,transform:"translateX(-50%) scale(0.85)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:150,fill:"forwards",easing:"ease"}),this.timeout&&clearTimeout(this.timeout),P.state.autoClose&&(this.timeout=setTimeout(()=>P.hide(),2500))):this.animate([{opacity:1,transform:"translateX(-50%) scale(1)"},{opacity:0,transform:"translateX(-50%) scale(0.85)"}],{duration:150,fill:"forwards",easing:"ease"})}};Ce.styles=At;nt([c()],Ce.prototype,"open",void 0);Ce=nt([w("w3m-snackbar")],Ce);const Lt=ke`
  :host {
    width: 100%;
    display: block;
  }
`;var Be=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let le=class extends g{constructor(){super(),this.unsubscribe=[],this.text="",this.open=O.state.open,this.unsubscribe.push(d.subscribeKey("view",()=>{O.hide()}),N.subscribeKey("open",e=>{e||O.hide()}),O.subscribeKey("open",e=>{this.open=e}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),O.hide()}render(){return l`
      <div
        @pointermove=${this.onMouseEnter.bind(this)}
        @pointerleave=${this.onMouseLeave.bind(this)}
      >
        ${this.renderChildren()}
      </div>
    `}renderChildren(){return l`<slot></slot> `}onMouseEnter(){const e=this.getBoundingClientRect();if(!this.open){const t=document.querySelector("w3m-modal"),o={width:e.width,height:e.height,left:e.left,top:e.top};if(t){const r=t.getBoundingClientRect();o.left=e.left-(window.innerWidth-r.width)/2,o.top=e.top-(window.innerHeight-r.height)/2}O.showTooltip({message:this.text,triggerRect:o,variant:"shade"})}}onMouseLeave(e){this.contains(e.relatedTarget)||O.hide()}};le.styles=[Lt];Be([u()],le.prototype,"text",void 0);Be([c()],le.prototype,"open",void 0);le=Be([w("w3m-tooltip-trigger")],le);const Nt=W`
  :host {
    pointer-events: none;
  }

  :host > wui-flex {
    display: var(--w3m-tooltip-display);
    opacity: var(--w3m-tooltip-opacity);
    padding: 9px ${({spacing:i})=>i[3]} 10px ${({spacing:i})=>i[3]};
    border-radius: ${({borderRadius:i})=>i[3]};
    color: ${({tokens:i})=>i.theme.backgroundPrimary};
    position: absolute;
    top: var(--w3m-tooltip-top);
    left: var(--w3m-tooltip-left);
    transform: translate(calc(-50% + var(--w3m-tooltip-parent-width)), calc(-100% - 8px));
    max-width: calc(var(--apkt-modal-width) - ${({spacing:i})=>i[5]});
    transition: opacity ${({durations:i})=>i.lg}
      ${({easings:i})=>i["ease-out-power-2"]};
    will-change: opacity;
    opacity: 0;
    animation-duration: ${({durations:i})=>i.xl};
    animation-timing-function: ${({easings:i})=>i["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  :host([data-variant='shade']) > wui-flex {
    background-color: ${({tokens:i})=>i.theme.foregroundPrimary};
  }

  :host([data-variant='shade']) > wui-flex > wui-text {
    color: ${({tokens:i})=>i.theme.textSecondary};
  }

  :host([data-variant='fill']) > wui-flex {
    background-color: ${({tokens:i})=>i.theme.backgroundPrimary};
    border: 1px solid ${({tokens:i})=>i.theme.borderPrimary};
  }

  wui-icon {
    position: absolute;
    width: 12px !important;
    height: 4px !important;
    color: ${({tokens:i})=>i.theme.foregroundPrimary};
  }

  wui-icon[data-placement='top'] {
    bottom: 0px;
    left: 50%;
    transform: translate(-50%, 95%);
  }

  wui-icon[data-placement='bottom'] {
    top: 0;
    left: 50%;
    transform: translate(-50%, -95%) rotate(180deg);
  }

  wui-icon[data-placement='right'] {
    top: 50%;
    left: 0;
    transform: translate(-65%, -50%) rotate(90deg);
  }

  wui-icon[data-placement='left'] {
    top: 50%;
    right: 0%;
    transform: translate(65%, -50%) rotate(270deg);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var he=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Q=class extends g{constructor(){super(),this.unsubscribe=[],this.open=O.state.open,this.message=O.state.message,this.triggerRect=O.state.triggerRect,this.variant=O.state.variant,this.unsubscribe.push(O.subscribe(e=>{this.open=e.open,this.message=e.message,this.triggerRect=e.triggerRect,this.variant=e.variant}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){this.dataset.variant=this.variant;const e=this.triggerRect.top,t=this.triggerRect.left;return this.style.cssText=`
    --w3m-tooltip-top: ${e}px;
    --w3m-tooltip-left: ${t}px;
    --w3m-tooltip-parent-width: ${this.triggerRect.width/2}px;
    --w3m-tooltip-display: ${this.open?"flex":"none"};
    --w3m-tooltip-opacity: ${this.open?1:0};
    `,l`<wui-flex>
      <wui-icon data-placement="top" size="inherit" name="cursor"></wui-icon>
      <wui-text color="primary" variant="sm-regular">${this.message}</wui-text>
    </wui-flex>`}};Q.styles=[Nt];he([c()],Q.prototype,"open",void 0);he([c()],Q.prototype,"message",void 0);he([c()],Q.prototype,"triggerRect",void 0);he([c()],Q.prototype,"variant",void 0);Q=he([w("w3m-tooltip")],Q);const oe={getTabsByNamespace(i){var t;return!!i&&i===be.CHAIN.EVM?((t=p.state.remoteFeatures)==null?void 0:t.activity)===!1?q.ACCOUNT_TABS.filter(o=>o.label!=="Activity"):q.ACCOUNT_TABS:[]},isValidReownName(i){return/^[a-zA-Z0-9]+$/gu.test(i)},isValidEmail(i){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/gu.test(i)},validateReownName(i){return i.replace(/\^/gu,"").toLowerCase().replace(/[^a-zA-Z0-9]/gu,"")},hasFooter(){var e;const i=d.state.view;if(q.VIEWS_WITH_LEGAL_FOOTER.includes(i)){const{termsConditionsUrl:t,privacyPolicyUrl:o}=p.state,r=(e=p.state.features)==null?void 0:e.legalCheckbox;return!(!t&&!o||r)}return q.VIEWS_WITH_DEFAULT_FOOTER.includes(i)}},jt=W`
  :host wui-ux-by-reown {
    padding-top: 0;
  }

  :host wui-ux-by-reown.branding-only {
    padding-top: ${({spacing:i})=>i[3]};
  }

  a {
    text-decoration: none;
    color: ${({tokens:i})=>i.core.textAccentPrimary};
    font-weight: 500;
  }
`;var ot=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let $e=class extends g{constructor(){super(),this.unsubscribe=[],this.remoteFeatures=p.state.remoteFeatures,this.unsubscribe.push(p.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){var n;const{termsConditionsUrl:e,privacyPolicyUrl:t}=p.state,o=(n=p.state.features)==null?void 0:n.legalCheckbox;return!e&&!t||o?l`
        <wui-flex flexDirection="column"> ${this.reownBrandingTemplate(!0)} </wui-flex>
      `:l`
      <wui-flex flexDirection="column">
        <wui-flex .padding=${["4","3","3","3"]} justifyContent="center">
          <wui-text color="secondary" variant="md-regular" align="center">
            By connecting your wallet, you agree to our <br />
            ${this.termsTemplate()} ${this.andTemplate()} ${this.privacyTemplate()}
          </wui-text>
        </wui-flex>
        ${this.reownBrandingTemplate()}
      </wui-flex>
    `}andTemplate(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=p.state;return e&&t?"and":""}termsTemplate(){const{termsConditionsUrl:e}=p.state;return e?l`<a href=${e} target="_blank" rel="noopener noreferrer"
      >Terms of Service</a
    >`:null}privacyTemplate(){const{privacyPolicyUrl:e}=p.state;return e?l`<a href=${e} target="_blank" rel="noopener noreferrer"
      >Privacy Policy</a
    >`:null}reownBrandingTemplate(e=!1){var t;return(t=this.remoteFeatures)!=null&&t.reownBranding?e?l`<wui-ux-by-reown class="branding-only"></wui-ux-by-reown>`:l`<wui-ux-by-reown></wui-ux-by-reown>`:null}};$e.styles=[jt];ot([c()],$e.prototype,"remoteFeatures",void 0);$e=ot([w("w3m-legal-footer")],$e);const Dt=ke``;var Bt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let Te=class extends g{render(){const{termsConditionsUrl:e,privacyPolicyUrl:t}=p.state;return!e&&!t?null:l`
      <wui-flex
        .padding=${["4","3","3","3"]}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap="3"
      >
        <wui-text color="secondary" variant="md-regular" align="center">
          We work with the best providers to give you the lowest fees and best support. More options
          coming soon!
        </wui-text>

        ${this.howDoesItWorkTemplate()}
      </wui-flex>
    `}howDoesItWorkTemplate(){return l` <wui-link @click=${this.onWhatIsBuy.bind(this)}>
      <wui-icon size="xs" color="accent-primary" slot="iconLeft" name="helpCircle"></wui-icon>
      How does it work?
    </wui-link>`}onWhatIsBuy(){$.sendEvent({type:"track",event:"SELECT_WHAT_IS_A_BUY",properties:{isSmartAccount:ct(x.state.activeChain)===mt.ACCOUNT_TYPES.SMART_ACCOUNT}}),d.push("WhatIsABuy")}};Te.styles=[Dt];Te=Bt([w("w3m-onramp-providers-footer")],Te);const Ut=W`
  :host {
    display: block;
  }

  div.container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    height: auto;
    display: block;
  }

  div.container[status='hide'] {
    animation: fade-out;
    animation-duration: var(--apkt-duration-dynamic);
    animation-timing-function: ${({easings:i})=>i["ease-out-power-2"]};
    animation-fill-mode: both;
    animation-delay: 0s;
  }

  div.container[status='show'] {
    animation: fade-in;
    animation-duration: var(--apkt-duration-dynamic);
    animation-timing-function: ${({easings:i})=>i["ease-out-power-2"]};
    animation-fill-mode: both;
    animation-delay: var(--apkt-duration-dynamic);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      filter: blur(6px);
    }
    to {
      opacity: 1;
      filter: blur(0px);
    }
  }

  @keyframes fade-out {
    from {
      opacity: 1;
      filter: blur(0px);
    }
    to {
      opacity: 0;
      filter: blur(6px);
    }
  }
`;var Ue=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let ce=class extends g{constructor(){super(...arguments),this.resizeObserver=void 0,this.unsubscribe=[],this.status="hide",this.view=d.state.view}firstUpdated(){this.status=oe.hasFooter()?"show":"hide",this.unsubscribe.push(d.subscribeKey("view",e=>{this.view=e,this.status=oe.hasFooter()?"show":"hide",this.status==="hide"&&document.documentElement.style.setProperty("--apkt-footer-height","0px")})),this.resizeObserver=new ResizeObserver(e=>{for(const t of e)if(t.target===this.getWrapper()){const o=`${t.contentRect.height}px`;document.documentElement.style.setProperty("--apkt-footer-height",o)}}),this.resizeObserver.observe(this.getWrapper())}render(){return l`
      <div class="container" status=${this.status}>${this.templatePageContainer()}</div>
    `}templatePageContainer(){return oe.hasFooter()?l` ${this.templateFooter()}`:null}templateFooter(){switch(this.view){case"Networks":return this.templateNetworksFooter();case"Connect":case"ConnectWallets":case"OnRampFiatSelect":case"OnRampTokenSelect":return l`<w3m-legal-footer></w3m-legal-footer>`;case"OnRampProviders":return l`<w3m-onramp-providers-footer></w3m-onramp-providers-footer>`;default:return null}}templateNetworksFooter(){return l` <wui-flex
      class="footer-in"
      padding="3"
      flexDirection="column"
      gap="3"
      alignItems="center"
    >
      <wui-text variant="md-regular" color="secondary" align="center">
        Your connected wallet may not support some of the networks available for this dApp
      </wui-text>
      <wui-link @click=${this.onNetworkHelp.bind(this)}>
        <wui-icon size="sm" color="accent-primary" slot="iconLeft" name="helpCircle"></wui-icon>
        What is a network
      </wui-link>
    </wui-flex>`}onNetworkHelp(){$.sendEvent({type:"track",event:"CLICK_NETWORK_HELP"}),d.push("WhatIsANetwork")}getWrapper(){var e;return(e=this.shadowRoot)==null?void 0:e.querySelector("div.container")}};ce.styles=[Ut];Ue([c()],ce.prototype,"status",void 0);Ue([c()],ce.prototype,"view",void 0);ce=Ue([w("w3m-footer")],ce);const Ft=W`
  :host {
    display: block;
    width: inherit;
  }
`;var Fe=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let de=class extends g{constructor(){super(),this.unsubscribe=[],this.viewState=d.state.view,this.history=d.state.history.join(","),this.unsubscribe.push(d.subscribeKey("view",()=>{this.history=d.state.history.join(","),document.documentElement.style.setProperty("--apkt-duration-dynamic","var(--apkt-durations-lg)")}))}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),document.documentElement.style.setProperty("--apkt-duration-dynamic","0s")}render(){return l`${this.templatePageContainer()}`}templatePageContainer(){return l`<w3m-router-container
      history=${this.history}
      .setView=${()=>{this.viewState=d.state.view}}
    >
      ${this.viewTemplate(this.viewState)}
    </w3m-router-container>`}viewTemplate(e){switch(e){case"AccountSettings":return l`<w3m-account-settings-view></w3m-account-settings-view>`;case"Account":return l`<w3m-account-view></w3m-account-view>`;case"AllWallets":return l`<w3m-all-wallets-view></w3m-all-wallets-view>`;case"ApproveTransaction":return l`<w3m-approve-transaction-view></w3m-approve-transaction-view>`;case"BuyInProgress":return l`<w3m-buy-in-progress-view></w3m-buy-in-progress-view>`;case"ChooseAccountName":return l`<w3m-choose-account-name-view></w3m-choose-account-name-view>`;case"Connect":return l`<w3m-connect-view></w3m-connect-view>`;case"Create":return l`<w3m-connect-view walletGuide="explore"></w3m-connect-view>`;case"ConnectingWalletConnect":return l`<w3m-connecting-wc-view></w3m-connecting-wc-view>`;case"ConnectingWalletConnectBasic":return l`<w3m-connecting-wc-basic-view></w3m-connecting-wc-basic-view>`;case"ConnectingExternal":return l`<w3m-connecting-external-view></w3m-connecting-external-view>`;case"ConnectingSiwe":return l`<w3m-connecting-siwe-view></w3m-connecting-siwe-view>`;case"ConnectWallets":return l`<w3m-connect-wallets-view></w3m-connect-wallets-view>`;case"ConnectSocials":return l`<w3m-connect-socials-view></w3m-connect-socials-view>`;case"ConnectingSocial":return l`<w3m-connecting-social-view></w3m-connecting-social-view>`;case"DataCapture":return l`<w3m-data-capture-view></w3m-data-capture-view>`;case"DataCaptureOtpConfirm":return l`<w3m-data-capture-otp-confirm-view></w3m-data-capture-otp-confirm-view>`;case"Downloads":return l`<w3m-downloads-view></w3m-downloads-view>`;case"EmailLogin":return l`<w3m-email-login-view></w3m-email-login-view>`;case"EmailVerifyOtp":return l`<w3m-email-verify-otp-view></w3m-email-verify-otp-view>`;case"EmailVerifyDevice":return l`<w3m-email-verify-device-view></w3m-email-verify-device-view>`;case"GetWallet":return l`<w3m-get-wallet-view></w3m-get-wallet-view>`;case"Networks":return l`<w3m-networks-view></w3m-networks-view>`;case"SwitchNetwork":return l`<w3m-network-switch-view></w3m-network-switch-view>`;case"ProfileWallets":return l`<w3m-profile-wallets-view></w3m-profile-wallets-view>`;case"Transactions":return l`<w3m-transactions-view></w3m-transactions-view>`;case"OnRampProviders":return l`<w3m-onramp-providers-view></w3m-onramp-providers-view>`;case"OnRampTokenSelect":return l`<w3m-onramp-token-select-view></w3m-onramp-token-select-view>`;case"OnRampFiatSelect":return l`<w3m-onramp-fiat-select-view></w3m-onramp-fiat-select-view>`;case"UpgradeEmailWallet":return l`<w3m-upgrade-wallet-view></w3m-upgrade-wallet-view>`;case"UpdateEmailWallet":return l`<w3m-update-email-wallet-view></w3m-update-email-wallet-view>`;case"UpdateEmailPrimaryOtp":return l`<w3m-update-email-primary-otp-view></w3m-update-email-primary-otp-view>`;case"UpdateEmailSecondaryOtp":return l`<w3m-update-email-secondary-otp-view></w3m-update-email-secondary-otp-view>`;case"UnsupportedChain":return l`<w3m-unsupported-chain-view></w3m-unsupported-chain-view>`;case"Swap":return l`<w3m-swap-view></w3m-swap-view>`;case"SwapSelectToken":return l`<w3m-swap-select-token-view></w3m-swap-select-token-view>`;case"SwapPreview":return l`<w3m-swap-preview-view></w3m-swap-preview-view>`;case"WalletSend":return l`<w3m-wallet-send-view></w3m-wallet-send-view>`;case"WalletSendSelectToken":return l`<w3m-wallet-send-select-token-view></w3m-wallet-send-select-token-view>`;case"WalletSendPreview":return l`<w3m-wallet-send-preview-view></w3m-wallet-send-preview-view>`;case"WalletSendConfirmed":return l`<w3m-send-confirmed-view></w3m-send-confirmed-view>`;case"WhatIsABuy":return l`<w3m-what-is-a-buy-view></w3m-what-is-a-buy-view>`;case"WalletReceive":return l`<w3m-wallet-receive-view></w3m-wallet-receive-view>`;case"WalletCompatibleNetworks":return l`<w3m-wallet-compatible-networks-view></w3m-wallet-compatible-networks-view>`;case"WhatIsAWallet":return l`<w3m-what-is-a-wallet-view></w3m-what-is-a-wallet-view>`;case"ConnectingMultiChain":return l`<w3m-connecting-multi-chain-view></w3m-connecting-multi-chain-view>`;case"WhatIsANetwork":return l`<w3m-what-is-a-network-view></w3m-what-is-a-network-view>`;case"ConnectingFarcaster":return l`<w3m-connecting-farcaster-view></w3m-connecting-farcaster-view>`;case"SwitchActiveChain":return l`<w3m-switch-active-chain-view></w3m-switch-active-chain-view>`;case"RegisterAccountName":return l`<w3m-register-account-name-view></w3m-register-account-name-view>`;case"RegisterAccountNameSuccess":return l`<w3m-register-account-name-success-view></w3m-register-account-name-success-view>`;case"SmartSessionCreated":return l`<w3m-smart-session-created-view></w3m-smart-session-created-view>`;case"SmartSessionList":return l`<w3m-smart-session-list-view></w3m-smart-session-list-view>`;case"SIWXSignMessage":return l`<w3m-siwx-sign-message-view></w3m-siwx-sign-message-view>`;case"Pay":return l`<w3m-pay-view></w3m-pay-view>`;case"PayLoading":return l`<w3m-pay-loading-view></w3m-pay-loading-view>`;case"PayQuote":return l`<w3m-pay-quote-view></w3m-pay-quote-view>`;case"FundWallet":return l`<w3m-fund-wallet-view></w3m-fund-wallet-view>`;case"PayWithExchange":return l`<w3m-deposit-from-exchange-view></w3m-deposit-from-exchange-view>`;case"PayWithExchangeSelectAsset":return l`<w3m-deposit-from-exchange-select-asset-view></w3m-deposit-from-exchange-select-asset-view>`;case"UsageExceeded":return l`<w3m-usage-exceeded-view></w3m-usage-exceeded-view>`;case"SmartAccountSettings":return l`<w3m-smart-account-settings-view></w3m-smart-account-settings-view>`;default:return l`<w3m-connect-view></w3m-connect-view>`}}};de.styles=[Ft];Fe([c()],de.prototype,"viewState",void 0);Fe([c()],de.prototype,"history",void 0);de=Fe([w("w3m-router")],de);const Ht=W`
  :host {
    z-index: ${({tokens:i})=>i.core.zIndex};
    display: block;
    backface-visibility: hidden;
    will-change: opacity;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    opacity: 0;
    background-color: ${({tokens:i})=>i.theme.overlay};
    backdrop-filter: blur(0px);
    transition:
      opacity ${({durations:i})=>i.lg} ${({easings:i})=>i["ease-out-power-2"]},
      backdrop-filter ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-2"]};
    will-change: opacity;
  }

  :host(.open) {
    opacity: 1;
    backdrop-filter: blur(8px);
  }

  :host(.appkit-modal) {
    position: relative;
    pointer-events: unset;
    background: none;
    width: 100%;
    opacity: 1;
  }

  wui-card {
    max-width: var(--apkt-modal-width);
    width: 100%;
    position: relative;
    outline: none;
    transform: translateY(4px);
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
    transition:
      transform ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-2"]},
      border-radius ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-1"]},
      background-color ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-1"]},
      box-shadow ${({durations:i})=>i.lg}
        ${({easings:i})=>i["ease-out-power-1"]};
    will-change: border-radius, background-color, transform, box-shadow;
    background-color: ${({tokens:i})=>i.theme.backgroundPrimary};
    padding: var(--local-modal-padding);
    box-sizing: border-box;
  }

  :host(.open) wui-card {
    transform: translateY(0px);
  }

  wui-card::before {
    z-index: 1;
    pointer-events: none;
    content: '';
    position: absolute;
    inset: 0;
    border-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
    transition: box-shadow ${({durations:i})=>i.lg}
      ${({easings:i})=>i["ease-out-power-2"]};
    transition-delay: ${({durations:i})=>i.md};
    will-change: box-shadow;
  }

  :host([data-mobile-fullscreen='true']) wui-card::before {
    border-radius: 0px;
  }

  :host([data-border='true']) wui-card::before {
    box-shadow: inset 0px 0px 0px 4px ${({tokens:i})=>i.theme.foregroundSecondary};
  }

  :host([data-border='false']) wui-card::before {
    box-shadow: inset 0px 0px 0px 1px ${({tokens:i})=>i.theme.borderPrimaryDark};
  }

  :host([data-border='true']) wui-card {
    animation:
      fade-in ${({durations:i})=>i.lg} ${({easings:i})=>i["ease-out-power-2"]},
      card-background-border var(--apkt-duration-dynamic)
        ${({easings:i})=>i["ease-out-power-2"]};
    animation-fill-mode: backwards, both;
    animation-delay: var(--apkt-duration-dynamic);
  }

  :host([data-border='false']) wui-card {
    animation:
      fade-in ${({durations:i})=>i.lg} ${({easings:i})=>i["ease-out-power-2"]},
      card-background-default var(--apkt-duration-dynamic)
        ${({easings:i})=>i["ease-out-power-2"]};
    animation-fill-mode: backwards, both;
    animation-delay: 0s;
  }

  :host(.appkit-modal) wui-card {
    max-width: var(--apkt-modal-width);
  }

  wui-card[shake='true'] {
    animation:
      fade-in ${({durations:i})=>i.lg} ${({easings:i})=>i["ease-out-power-2"]},
      w3m-shake ${({durations:i})=>i.xl}
        ${({easings:i})=>i["ease-out-power-2"]};
  }

  wui-flex {
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @media (max-height: 700px) and (min-width: 431px) {
    wui-flex {
      align-items: flex-start;
    }

    wui-card {
      margin: var(--apkt-spacing-6) 0px;
    }
  }

  @media (max-width: 430px) {
    :host([data-mobile-fullscreen='true']) {
      height: 100dvh;
    }
    :host([data-mobile-fullscreen='true']) wui-flex {
      align-items: stretch;
    }
    :host([data-mobile-fullscreen='true']) wui-card {
      max-width: 100%;
      height: 100%;
      border-radius: 0;
      border: none;
    }
    :host(:not([data-mobile-fullscreen='true'])) wui-flex {
      align-items: flex-end;
    }

    :host(:not([data-mobile-fullscreen='true'])) wui-card {
      max-width: 100%;
      border-bottom: none;
    }

    :host(:not([data-mobile-fullscreen='true'])) wui-card[data-embedded='true'] {
      border-bottom-left-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
      border-bottom-right-radius: clamp(0px, var(--apkt-borderRadius-8), 44px);
    }

    :host(:not([data-mobile-fullscreen='true'])) wui-card:not([data-embedded='true']) {
      border-bottom-left-radius: 0px;
      border-bottom-right-radius: 0px;
    }

    wui-card[shake='true'] {
      animation: w3m-shake 0.5s ${({easings:i})=>i["ease-out-power-2"]};
    }
  }

  @keyframes fade-in {
    0% {
      transform: scale(0.99) translateY(4px);
    }
    100% {
      transform: scale(1) translateY(0);
    }
  }

  @keyframes w3m-shake {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1) rotate(-1deg);
    }
    40% {
      transform: scale(1) rotate(1.5deg);
    }
    60% {
      transform: scale(1) rotate(-1.5deg);
    }
    80% {
      transform: scale(1) rotate(1deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes card-background-border {
    from {
      background-color: ${({tokens:i})=>i.theme.backgroundPrimary};
    }
    to {
      background-color: ${({tokens:i})=>i.theme.foregroundSecondary};
    }
  }

  @keyframes card-background-default {
    from {
      background-color: ${({tokens:i})=>i.theme.foregroundSecondary};
    }
    to {
      background-color: ${({tokens:i})=>i.theme.backgroundPrimary};
    }
  }
`;var B=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};const Ge="scroll-lock",Vt={PayWithExchange:"0",PayWithExchangeSelectAsset:"0",Pay:"0",PayQuote:"0",PayLoading:"0"};class I extends g{constructor(){super(),this.unsubscribe=[],this.abortController=void 0,this.hasPrefetched=!1,this.enableEmbedded=p.state.enableEmbedded,this.open=N.state.open,this.caipAddress=x.state.activeCaipAddress,this.caipNetwork=x.state.activeCaipNetwork,this.shake=N.state.shake,this.filterByNamespace=E.state.filterByNamespace,this.padding=fe.spacing[1],this.mobileFullScreen=p.state.enableMobileFullScreen,this.initializeTheming(),v.prefetchAnalyticsConfig(),this.unsubscribe.push(N.subscribeKey("open",e=>e?this.onOpen():this.onClose()),N.subscribeKey("shake",e=>this.shake=e),x.subscribeKey("activeCaipNetwork",e=>this.onNewNetwork(e)),x.subscribeKey("activeCaipAddress",e=>this.onNewAddress(e)),p.subscribeKey("enableEmbedded",e=>this.enableEmbedded=e),E.subscribeKey("filterByNamespace",e=>{var t;this.filterByNamespace!==e&&!((t=x.getAccountData(e))!=null&&t.caipAddress)&&(v.fetchRecommendedWallets(),this.filterByNamespace=e)}),d.subscribeKey("view",()=>{this.dataset.border=oe.hasFooter()?"true":"false",this.padding=Vt[d.state.view]??fe.spacing[1]}))}firstUpdated(){if(this.dataset.border=oe.hasFooter()?"true":"false",this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.caipAddress){if(this.enableEmbedded){N.close(),this.prefetch();return}this.onNewAddress(this.caipAddress)}this.open&&this.onOpen(),this.enableEmbedded&&this.prefetch()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.onRemoveKeyboardListener()}render(){return this.style.setProperty("--local-modal-padding",this.padding),this.enableEmbedded?l`${this.contentTemplate()}
        <w3m-tooltip></w3m-tooltip> `:this.open?l`
          <wui-flex @click=${this.onOverlayClick.bind(this)} data-testid="w3m-modal-overlay">
            ${this.contentTemplate()}
          </wui-flex>
          <w3m-tooltip></w3m-tooltip>
        `:null}contentTemplate(){return l` <wui-card
      shake="${this.shake}"
      data-embedded="${m(this.enableEmbedded)}"
      role="alertdialog"
      aria-modal="true"
      tabindex="0"
      data-testid="w3m-modal-card"
    >
      <w3m-header></w3m-header>
      <w3m-router></w3m-router>
      <w3m-footer></w3m-footer>
      <w3m-snackbar></w3m-snackbar>
      <w3m-alertbar></w3m-alertbar>
    </wui-card>`}async onOverlayClick(e){if(e.target===e.currentTarget){if(this.mobileFullScreen)return;await this.handleClose()}}async handleClose(){await Qe.safeClose()}initializeTheming(){const{themeVariables:e,themeMode:t}=ne.state,o=Ae.getColorTheme(t);rt(e,o)}onClose(){this.open=!1,this.classList.remove("open"),this.onScrollUnlock(),P.hide(),this.onRemoveKeyboardListener()}onOpen(){this.open=!0,this.classList.add("open"),this.onScrollLock(),this.onAddKeyboardListener()}onScrollLock(){const e=document.createElement("style");e.dataset.w3m=Ge,e.textContent=`
      body {
        touch-action: none;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      w3m-modal {
        pointer-events: auto;
      }
    `,document.head.appendChild(e)}onScrollUnlock(){const e=document.head.querySelector(`style[data-w3m="${Ge}"]`);e&&e.remove()}onAddKeyboardListener(){var t;this.abortController=new AbortController;const e=(t=this.shadowRoot)==null?void 0:t.querySelector("wui-card");e==null||e.focus(),window.addEventListener("keydown",o=>{if(o.key==="Escape")this.handleClose();else if(o.key==="Tab"){const{tagName:r}=o.target;r&&!r.includes("W3M-")&&!r.includes("WUI-")&&(e==null||e.focus())}},this.abortController)}onRemoveKeyboardListener(){var e;(e=this.abortController)==null||e.abort(),this.abortController=void 0}async onNewAddress(e){const t=x.state.isSwitchingNamespace,o=d.state.view==="ProfileWallets";!e&&!t&&!o&&N.close(),await dt.initializeIfEnabled(e),this.caipAddress=e,x.setIsSwitchingNamespace(!1)}onNewNetwork(e){var b,R;const t=this.caipNetwork,o=(b=t==null?void 0:t.caipNetworkId)==null?void 0:b.toString(),r=(R=e==null?void 0:e.caipNetworkId)==null?void 0:R.toString(),n=o!==r,a=d.state.view==="UnsupportedChain",s=N.state.open;let h=!1;this.enableEmbedded&&d.state.view==="SwitchNetwork"&&(h=!0),n&&ut.resetState(),s&&a&&(h=!0),h&&d.state.view!=="SIWXSignMessage"&&d.goBack(),this.caipNetwork=e}prefetch(){this.hasPrefetched||(v.prefetch(),v.fetchWalletsByPage({page:1}),this.hasPrefetched=!0)}}I.styles=Ht;B([u({type:Boolean})],I.prototype,"enableEmbedded",void 0);B([c()],I.prototype,"open",void 0);B([c()],I.prototype,"caipAddress",void 0);B([c()],I.prototype,"caipNetwork",void 0);B([c()],I.prototype,"shake",void 0);B([c()],I.prototype,"filterByNamespace",void 0);B([c()],I.prototype,"padding",void 0);B([c()],I.prototype,"mobileFullScreen",void 0);let Ie=class extends I{};Ie=B([w("w3m-modal")],Ie);let Pe=class extends I{};Pe=B([w("appkit-modal")],Pe);const Mt=W`
  .icon-box {
    width: 64px;
    height: 64px;
    border-radius: ${({borderRadius:i})=>i[5]};
    background-color: ${({colors:i})=>i.semanticError010};
  }
`;var zt=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let We=class extends g{constructor(){super()}render(){return l`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        gap="4"
        .padding="${["1","3","4","3"]}"
      >
        <wui-flex justifyContent="center" alignItems="center" class="icon-box">
          <wui-icon size="xxl" color="error" name="warningCircle"></wui-icon>
        </wui-flex>

        <wui-text variant="lg-medium" color="primary" align="center">
          The app isn't responding as expected
        </wui-text>
        <wui-text variant="md-regular" color="secondary" align="center">
          Try again or reach out to the app team for help.
        </wui-text>

        <wui-button
          variant="neutral-secondary"
          size="md"
          @click=${this.onTryAgainClick.bind(this)}
          data-testid="w3m-usage-exceeded-button"
        >
          <wui-icon color="inherit" slot="iconLeft" name="refresh"></wui-icon>
          Try Again
        </wui-button>
      </wui-flex>
    `}onTryAgainClick(){d.goBack()}};We.styles=Mt;We=zt([w("w3m-usage-exceeded-view")],We);const qt=W`
  :host {
    width: 100%;
  }
`;var S=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};let C=class extends g{constructor(){super(...arguments),this.hasImpressionSent=!1,this.walletImages=[],this.imageSrc="",this.name="",this.size="md",this.tabIdx=void 0,this.disabled=!1,this.showAllWallets=!1,this.loading=!1,this.loadingSpinnerColor="accent-100",this.rdnsId="",this.displayIndex=void 0,this.walletRank=void 0,this.namespaces=[]}connectedCallback(){super.connectedCallback()}disconnectedCallback(){super.disconnectedCallback(),this.cleanupIntersectionObserver()}updated(e){super.updated(e),(e.has("name")||e.has("imageSrc")||e.has("walletRank"))&&(this.hasImpressionSent=!1),e.has("walletRank")&&this.walletRank&&!this.intersectionObserver&&this.setupIntersectionObserver()}setupIntersectionObserver(){this.intersectionObserver=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&!this.loading&&!this.hasImpressionSent&&this.sendImpressionEvent()})},{threshold:.1}),this.intersectionObserver.observe(this)}cleanupIntersectionObserver(){this.intersectionObserver&&(this.intersectionObserver.disconnect(),this.intersectionObserver=void 0)}sendImpressionEvent(){!this.name||this.hasImpressionSent||!this.walletRank||(this.hasImpressionSent=!0,(this.rdnsId||this.name)&&$.sendWalletImpressionEvent({name:this.name,walletRank:this.walletRank,rdnsId:this.rdnsId,view:d.state.view,displayIndex:this.displayIndex}))}handleGetWalletNamespaces(){return Object.keys(pt.state.adapters).length>1?this.namespaces:[]}render(){return l`
      <wui-list-wallet
        .walletImages=${this.walletImages}
        imageSrc=${m(this.imageSrc)}
        name=${this.name}
        size=${m(this.size)}
        tagLabel=${m(this.tagLabel)}
        .tagVariant=${this.tagVariant}
        .walletIcon=${this.walletIcon}
        .tabIdx=${this.tabIdx}
        .disabled=${this.disabled}
        .showAllWallets=${this.showAllWallets}
        .loading=${this.loading}
        loadingSpinnerColor=${this.loadingSpinnerColor}
        .namespaces=${this.handleGetWalletNamespaces()}
      ></wui-list-wallet>
    `}};C.styles=qt;S([u({type:Array})],C.prototype,"walletImages",void 0);S([u()],C.prototype,"imageSrc",void 0);S([u()],C.prototype,"name",void 0);S([u()],C.prototype,"size",void 0);S([u()],C.prototype,"tagLabel",void 0);S([u()],C.prototype,"tagVariant",void 0);S([u()],C.prototype,"walletIcon",void 0);S([u()],C.prototype,"tabIdx",void 0);S([u({type:Boolean})],C.prototype,"disabled",void 0);S([u({type:Boolean})],C.prototype,"showAllWallets",void 0);S([u({type:Boolean})],C.prototype,"loading",void 0);S([u({type:String})],C.prototype,"loadingSpinnerColor",void 0);S([u()],C.prototype,"rdnsId",void 0);S([u()],C.prototype,"displayIndex",void 0);S([u()],C.prototype,"walletRank",void 0);S([u({type:Array})],C.prototype,"namespaces",void 0);C=S([w("w3m-list-wallet")],C);const Kt=W`
  :host {
    --local-duration-height: 0s;
    --local-duration: ${({durations:i})=>i.lg};
    --local-transition: ${({easings:i})=>i["ease-out-power-2"]};
  }

  .container {
    display: block;
    overflow: hidden;
    overflow: hidden;
    position: relative;
    height: var(--local-container-height);
    transition: height var(--local-duration-height) var(--local-transition);
    will-change: height, padding-bottom;
  }

  .container[data-mobile-fullscreen='true'] {
    overflow: scroll;
  }

  .page {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    width: inherit;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background-color: ${({tokens:i})=>i.theme.backgroundPrimary};
    border-bottom-left-radius: var(--local-border-bottom-radius);
    border-bottom-right-radius: var(--local-border-bottom-radius);
    transition: border-bottom-left-radius var(--local-duration) var(--local-transition);
  }

  .page[data-mobile-fullscreen='true'] {
    height: 100%;
  }

  .page-content {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .footer {
    height: var(--apkt-footer-height);
  }

  div.page[view-direction^='prev-'] .page-content {
    animation:
      slide-left-out var(--local-duration) forwards var(--local-transition),
      slide-left-in var(--local-duration) forwards var(--local-transition);
    animation-delay: 0ms, var(--local-duration, ${({durations:i})=>i.lg});
  }

  div.page[view-direction^='next-'] .page-content {
    animation:
      slide-right-out var(--local-duration) forwards var(--local-transition),
      slide-right-in var(--local-duration) forwards var(--local-transition);
    animation-delay: 0ms, var(--local-duration, ${({durations:i})=>i.lg});
  }

  @keyframes slide-left-out {
    from {
      transform: translateX(0px) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
    to {
      transform: translateX(8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes slide-left-in {
    from {
      transform: translateX(-8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
    to {
      transform: translateX(0) translateY(0) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
  }

  @keyframes slide-right-out {
    from {
      transform: translateX(0px) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
    to {
      transform: translateX(-8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
  }

  @keyframes slide-right-in {
    from {
      transform: translateX(8px) scale(0.99);
      opacity: 0;
      filter: blur(4px);
    }
    to {
      transform: translateX(0) translateY(0) scale(1);
      opacity: 1;
      filter: blur(0px);
    }
  }
`;var U=function(i,e,t,o){var r=arguments.length,n=r<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(i,e,t,o);else for(var s=i.length-1;s>=0;s--)(a=i[s])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n};const Gt=60;let _=class extends g{constructor(){super(...arguments),this.resizeObserver=void 0,this.transitionDuration="0.15s",this.transitionFunction="",this.history="",this.view="",this.setView=void 0,this.viewDirection="",this.historyState="",this.previousHeight="0px",this.mobileFullScreen=p.state.enableMobileFullScreen,this.onViewportResize=()=>{this.updateContainerHeight()}}updated(e){if(e.has("history")){const t=this.history;this.historyState!==""&&this.historyState!==t&&this.onViewChange(t)}e.has("transitionDuration")&&this.style.setProperty("--local-duration",this.transitionDuration),e.has("transitionFunction")&&this.style.setProperty("--local-transition",this.transitionFunction)}firstUpdated(){var e;this.transitionFunction&&this.style.setProperty("--local-transition",this.transitionFunction),this.style.setProperty("--local-duration",this.transitionDuration),this.historyState=this.history,this.resizeObserver=new ResizeObserver(t=>{var o;for(const r of t)if(r.target===this.getWrapper()){let n=r.contentRect.height;const a=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--apkt-footer-height")||"0");if(this.mobileFullScreen){const s=((o=window.visualViewport)==null?void 0:o.height)||window.innerHeight,h=this.getHeaderHeight();n=s-h-a,this.style.setProperty("--local-border-bottom-radius","0px")}else n=n+a,this.style.setProperty("--local-border-bottom-radius",a?"var(--apkt-borderRadius-5)":"0px");this.style.setProperty("--local-container-height",`${n}px`),this.previousHeight!=="0px"&&this.style.setProperty("--local-duration-height",this.transitionDuration),this.previousHeight=`${n}px`}}),this.resizeObserver.observe(this.getWrapper()),this.updateContainerHeight(),window.addEventListener("resize",this.onViewportResize),(e=window.visualViewport)==null||e.addEventListener("resize",this.onViewportResize)}disconnectedCallback(){var t;const e=this.getWrapper();e&&this.resizeObserver&&this.resizeObserver.unobserve(e),window.removeEventListener("resize",this.onViewportResize),(t=window.visualViewport)==null||t.removeEventListener("resize",this.onViewportResize)}render(){return l`
      <div class="container" data-mobile-fullscreen="${m(this.mobileFullScreen)}">
        <div
          class="page"
          data-mobile-fullscreen="${m(this.mobileFullScreen)}"
          view-direction="${this.viewDirection}"
        >
          <div class="page-content">
            <slot></slot>
          </div>
        </div>
      </div>
    `}onViewChange(e){const t=e.split(",").filter(Boolean),o=this.historyState.split(",").filter(Boolean),r=o.length,n=t.length,a=t[t.length-1]||"",s=Ae.cssDurationToNumber(this.transitionDuration);let h="";n>r?h="next":n<r?h="prev":n===r&&t[n-1]!==o[r-1]&&(h="next"),this.viewDirection=`${h}-${a}`,setTimeout(()=>{var b;this.historyState=e,(b=this.setView)==null||b.call(this,a)},s),setTimeout(()=>{this.viewDirection=""},s*2)}getWrapper(){var e;return(e=this.shadowRoot)==null?void 0:e.querySelector("div.page")}updateContainerHeight(){var r;const e=this.getWrapper();if(!e)return;const t=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--apkt-footer-height")||"0");let o=0;if(this.mobileFullScreen){const n=((r=window.visualViewport)==null?void 0:r.height)||window.innerHeight,a=this.getHeaderHeight();o=n-a-t,this.style.setProperty("--local-border-bottom-radius","0px")}else o=e.getBoundingClientRect().height+t,this.style.setProperty("--local-border-bottom-radius",t?"var(--apkt-borderRadius-5)":"0px");this.style.setProperty("--local-container-height",`${o}px`),this.previousHeight!=="0px"&&this.style.setProperty("--local-duration-height",this.transitionDuration),this.previousHeight=`${o}px`}getHeaderHeight(){return Gt}};_.styles=[Kt];U([u({type:String})],_.prototype,"transitionDuration",void 0);U([u({type:String})],_.prototype,"transitionFunction",void 0);U([u({type:String})],_.prototype,"history",void 0);U([u({type:String})],_.prototype,"view",void 0);U([u({attribute:!1})],_.prototype,"setView",void 0);U([c()],_.prototype,"viewDirection",void 0);U([c()],_.prototype,"historyState",void 0);U([c()],_.prototype,"previousHeight",void 0);U([c()],_.prototype,"mobileFullScreen",void 0);_=U([w("w3m-router-container")],_);const Ai=Object.freeze(Object.defineProperty({__proto__:null,get AppKitModal(){return Pe},get W3mListWallet(){return C},get W3mModal(){return Ie},W3mModalBase:I,get W3mRouterContainer(){return _},get W3mUsageExceededView(){return We}},Symbol.toStringTag,{value:"Module"}));export{gi as b,Ai as w};
