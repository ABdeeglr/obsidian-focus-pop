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
  background: var(--background-secondary-alt);
  border: 1px solid var(--background-modifer-success);
  border-radius: var(--radius-l);
  padding: 1.2em;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tooltip-title {
  font-family: 'Impact', sans-serif;
  font-size: var(--font-size-h1);
  font-weight: 600; 
  color: var(--text-interface);
  border: 4px dashed #00FFFF;
  box-shadow: 0 0 15px rgba(255, 255, 0, 0.7);
}

.tooltip-content {
  font-size: var(--font-size-normal);
  font-weight: 400;
  color: var(--text-faint);
  line-height: var(--line-height-tight);
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
    contentDiv.classList.add('tooltip-contnet');
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