import { Modal, App } from "obsidian";

const STYLES_CSS = `
.notice-message {
  display: flex;
  flex-direction: column;
  gap: 0.5em; 
  width: 100%; 
  padding: 0; 
}

.tooltip-container {
  display: flex;
  flex-direction: column;
  gap: 0.5em; 
  padding: 0.75em; 
  background: #005454; 
  border: none; 
  border-radius: inherit; 
}

.tooltip-title {
  font-size: 16pt; 
  font-weight: 200; 
  color: #feca95; 
  line-height: var(--line-height-tight);
  margin: 0;
  padding: 0;
}

.tooltip-body {
  font-size: 12pt;
  font-weight: 100;
  color: #6b6967ff;
  line-height: var(--line-height-tight);
  margin: 0;
  padding: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}
`;

export function create_notice_documentfragment(title:string, msg:string) {
  // 1. 创建 DocumentFragment
    const fragment = document.createDocumentFragment();

    // 2. 创建悬浮提示的容器 div，并添加 class
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('tooltip-container');

    // 3. 创建标题 div，添加着重样式，并设置文本内容
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('tooltip-title');
    titleDiv.textContent = title;

    // 4. 创建内容 div，添加普通样式，并设置文本内容
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('tooltip-content');
    contentDiv.textContent = msg;

    // 5. 将标题和内容 div 添加到容器 div 中
    containerDiv.appendChild(titleDiv);
    containerDiv.appendChild(contentDiv);
    fragment.appendChild(containerDiv)

    return fragment;
}


export class NoticeModal extends Modal {
  title: string;
  msg: string;

  constructor(app: App, title:string, msg:string) {
    super(app);
    this.title = title;
    this.msg = msg;
  }

  isStyleInjected = false;

  onOpen() {

    if (!this.isStyleInjected) {
        const styleEl = document.createElement('style');
        styleEl.textContent = STYLES_CSS;
        document.head.appendChild(styleEl);
        this.isStyleInjected = true;
    }
    
    const { contentEl } = this;
   
    const fragment = create_notice_documentfragment(this.title, this.msg);
    
    contentEl.setText(fragment);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}