import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile } from 'obsidian';
import { FocusPopSettings, DEFAULT_SETTINGS } from 'focusPopSettingTab';
import FocusPopSettingTab from 'focusPopSettingTab';
import { createAudioManager } from 'audiomgr';
import { NoticeModal, create_notice_documentfragment } from 'modal_styles';

/**
 * 计时器状态
 * 负责标注计时器的状态
 */
const enum timer_status {
  "ready",
  "running",
  "pause"
}

/**
 * 音频播放类型
 * 负责描述在哪个时间点播放的音频
 */
const enum audio_type {
  "on_interval_start",
  "on_interval_end",
  "on_long_interval"
}

export default class FocusPop extends Plugin {

  settings : FocusPopSettings | undefined;
  status : timer_status = timer_status.ready;
  naughtiness_index = 0;
  // audio_urls : string[] = []; // 本地音频文件的 obsidian url
  audio_mgr: {
    init: () => AudioContext;
    playAudio: (url: string, delay?: number) => Promise<AudioBufferSourceNode>;
    playAudioSequence: (url: string, times: number[]) => Promise<AudioBufferSourceNode[]>;
    destroy: () => Promise<void>;
} | null = null;
  last_transaction_time: number; // 记录每次状态变更的时间戳
  concentration_deposit_time = 0; // 记录专注累计时间，单位秒
  SBI_concentration_status: HTMLElement;
  SBI_concentration_lasting: HTMLElement;


  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 插件入口
   */
  async onload() {
    await this.loadSettings();
    this.audio_mgr = createAudioManager();

    /***********************************
     **                               **
     **        侧 栏 按 钮 区          **
     **                               **
     **********************************/

    // ! DOING
    // 测试按钮
    const ribbonIconEl_test = this.addRibbonIcon('phone-call', 'DF样式测试', (evt: MouseEvent) => {

      const head = this.settings.msg1 ?? "Test head";
      const msg = this.settings.msg2 ?? "Test body";
      const g = create_notice_documentfragment(head, msg);
      new Notice(g, 0);
    });
    ribbonIconEl_test.addClass('focus-pop-ribbon-class');


    // 添加开始专注按钮
    // 开始或恢复专注状态
    // ==具体行为型函数== 其行为是软件功能的重要组成部分
    const ribbonIconEl_start = this.addRibbonIcon('play', '开始专注', (evt: MouseEvent) => {
      if (this.status === timer_status.ready) {
        this.transaction_from_ready_to_running();  
        this.reset_naughtiness_index();
      } else if (this.status === timer_status.pause) {
        this.transaction_from_pause_to_running();
        this.reset_naughtiness_index();
      } else {
        this.improve_naughtiness_index();
      }
      this.update_SBI_concentration_status();
      console.log(this.status);

    });
    ribbonIconEl_start.addClass('focus-pop-ribbon-class');

    // 添加暂停专注按钮
    // 暂停专注状态
    // ==具体行为型函数== 其行为是软件功能的重要组成部分
    const ribbonIconEl_pause = this.addRibbonIcon('pause', '停止计时', (evt: MouseEvent) => {  
      if (this.status === timer_status.running) {
        this.transaction_from_running_to_pause();
        this.reset_naughtiness_index();
      } else {
        this.improve_naughtiness_index();
      }
      this.update_SBI_concentration_status();
      console.log(this.status);

    });
    ribbonIconEl_pause.addClass('focus-pop-ribbon-class');

    // 添加终止专注按钮
    // 结束专注状态
    // ==具体行为型函数== 其行为是软件功能的重要组成部分
    const ribbonIconEl_stop = this.addRibbonIcon('circle-power', '结束专注', (evt: MouseEvent) => {

      if (this.status === timer_status.running) {
        this.transaction_from_running_to_ready();
        this.reset_naughtiness_index();        
      } else if (this.status === timer_status.pause) {
        this.transaction_from_pause_to_ready();
        this.reset_naughtiness_index();
      } else {
        this.improve_naughtiness_index(); 
      }
      this.update_SBI_concentration_status();
      console.log(this.status);

    });
    ribbonIconEl_stop.addClass('focus-pop-ribbon-class');
    


    /***********************************
     **                               **
     **         状 态 栏 区            **
     **                               **
     **********************************/

    // 初始化状态栏，移动端不支持状态栏
    this.SBI_concentration_status = this.addStatusBarItem();
    this.SBI_concentration_status.setText('专注状态: 尚未开始');

    this.SBI_concentration_lasting = this.addStatusBarItem();
    this.SBI_concentration_lasting.setText('已专注: 00:00:00');

    /**
     * TODO
     * 
     * 需要监测专注时长到达 90 分钟，并编写对应的事件 
     */
    this.registerInterval(
      window.setInterval(() => {
        this.update_SBI_concentration_lasting();
        if (this.concentration_deposit_time + Math.floor((Date.now() - this.last_transaction_time) / 1000) >= 90 * 60) {
          new Notice('专注时长已经到达 90 分钟！', 10000);
          // TODO
        }
      }, 1000)
    );

    /***********************************
     **                               **
     **        命 令 控 制 区          **
     **                               **
     **********************************/

    // 添加一个 Obsidian 命令，以后可以完善
    // TODO
    // 展示专注习惯数据的可视化统计
    this.addCommand({
      id: 'open-sample-modal-simple',
      name: '专注统计',
      callback: () => {
        // new ConcentrationStaticModal(this.app).open();
        // TODO
      }
    });

    // 测试
    // 添加一个 Obsidian 命令
    // TODO
    this.addCommand({
      id: 'test-modal-behavior',
      name: '点这个模态预览测试',
      callback: () => {
        new NoticeModal(this.app, '你好！', '世界！').open();
      }
    })

    // Obsidian 官方预留，添加一个 Obsidian 命令，以后可以完善
    // !TO-BE-DELETE-OR-CHANGE
    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: 'sample-editor-command',
      name: 'Sample editor command',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection());
        editor.replaceSelection('Sample Editor Command');
      }
    });

    // Obsidian 官方预留，添加一个 Obsidian 命令，以后可以完善
    // !TO-BE-DELETE-OR-CHANGE
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: 'open-sample-modal-complex',
      name: 'Open sample modal (complex)',
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new ConcentrationStaticModal(this.app).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      }
    });



    // 添加第三方插件配置页面
    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new FocusPopSettingTab(this.app, this));

    // Obsidian 官方提供，目前行为不明，建议别动
    // !TO-BE-DELETE-OR-CHANGE
    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      console.log('click', evt);
    });

    // Obsidian 官方提供，目前行为不明，建议别动
    // 大概是注册一个周期性触发事件
    // !TO-BE-DELETE-OR-CHANGE
    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
  }

  /***********************************
   **                               **
   **       Plugin on unmount       **
   **                               **
   **********************************/

  onunload() {
    if (this.audio_mgr != null) {
      this.audio_mgr.destroy();
    }
  }

  /***********************************
   **                               **
   **       Plugin Settings         **
   **                               **
   **********************************/


  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }


  /***********************************
   **                               **
   **       状态转移 handler         **
   **                               **
   **********************************/

  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 在就绪状态下按下开始按钮
   * 
   * 开始专注状态
   */
  transaction_from_ready_to_running() {
    console.log(`状态转移: ${this.status} -> ${timer_status.running}`);
    this.update_last_transaction_time();
    new Notice('开始专注~', 1500);
    this.status = timer_status.running;

    /*********** 音频处理部分 **********/
    this.play_audio_right_now();
    this.play_audio_on_transfer_to_running(this.concentration_deposit_time);
  }


  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 在专注状态下按下暂停按钮
   * 
   * 暂停专注状态
   */
  transaction_from_running_to_pause() {
    console.log(`状态转移: ${this.status} -> ${timer_status.pause}`);
    this.append_concentration_deposit_time();
    this.update_last_transaction_time();
    new Notice('停止专注 @~@', 1500);
    this.status = timer_status.pause;


    /*********** 音频处理部分 **********/
    this.stop_all_audios_on_terminate_or_pause();
  }

  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 在暂停状态下按下开始专注按钮
   * 
   * 恢复专注状态
   */
  transaction_from_pause_to_running() {
    console.log(`状态转移: ${this.status} -> ${timer_status.running}`);
    this.update_last_transaction_time();
    new Notice('恢复专注', 1500);
    this.status = timer_status.running;

    this.play_audio_right_now();
    this.play_audio_on_transfer_to_running(this.concentration_deposit_time)
  }

  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 在暂停状态下按下终止按钮
   * 
   * 结束专注状态
   */
  transaction_from_pause_to_ready() {
    console.log(`状态转移: ${this.status} -> ${timer_status.ready}`);
    this.append_concentration_deposit_time(); // 追加专注时间
    this.upload_concentrating_habit_data(); // 提交上传
    this.reset_concentration_deposit_time(); // 重置专注时间
    this.update_last_transaction_time();

    console.log(this.naughtiness_index);
    new Notice('终止专注', 2000);
    this.status = timer_status.ready;

    /*********** 音频处理部分 **********/
    this.stop_all_audios_on_terminate_or_pause();
  }

  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 在正常运行状态下按下终止按钮
   * 
   * 结束专注状态
   */
  transaction_from_running_to_ready() {
    console.log(`状态转移: ${this.status} -> ${timer_status.ready}`);
    this.append_concentration_deposit_time(); // 追加专注时间
    this.upload_concentrating_habit_data(); // 提交上传
    this.reset_concentration_deposit_time(); // 充值专注时间
    this.update_last_transaction_time(); 
    console.log(this.naughtiness_index);
    new Notice('终止专注', 2000);
    this.status = timer_status.ready;

    /*********** 音频处理部分 **********/
    this.stop_all_audios_on_terminate_or_pause();
  }
  
  /***********************************
   **                               **
   **          其 他 函 数           **
   **                               **
   **********************************/

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 确保 this plugin 能够正确获取到音频文件的 obsidian url
   * @param path_from_settings - 从设置中获取的音频文件路径字符串
   * @returns 
   */
  get_audio_url_by_settings_item(path_from_settings: string) : string {
    // console.log('正在查找文件：', path_from_settings);
   
    const file = this.app.vault.getAbstractFileByPath(path_from_settings); // 通过文件路径获取文件对象
    if (file instanceof TFile) { // 确保获取到的是文件而不是文件夹
      // 使用 getResourcePath 获取资源路径
      // console.log('file: ', file);
      const resourcePath = this.app.vault.getResourcePath(file);
      // console.log('resourcePath: ', resourcePath); 
      return resourcePath;
    } else {
      console.log('音频文件不存在，或路径指向的不是音频文件');
      new Notice(`音频文件不存在，或路径指向的不是音频文件: ${path_from_settings}`, 2000);
      return null;
    }
  }

  /**
   * ==具体行为型函数== 其行为是软件功能的重要组成部分
   * 
   * 根据已经专注的时长，当当前状态转移到专注状态时，根据配置文件注册未来的随机提示音时间
   * @param has_been_deposit 已经追加、累积的专注时长，单位（秒）
   */
  play_audio_on_transfer_to_running(has_been_deposit: number) {
    const audio_url_1 = this.obsidian_audio_url_redirect(audio_type.on_interval_start);
    const audio_url_2 = this.obsidian_audio_url_redirect(audio_type.on_interval_end);
    const audio_url_3 = this.obsidian_audio_url_redirect(audio_type.on_long_interval);
    const future_total = Math.floor(Number(this.settings.concentration_lasting)) * 60;
    const to_be_concentrate = future_total - has_been_deposit;
    const interval_min = Math.floor(Number(this.settings.interval_min)) * 60;
    const interval_max = Math.floor(Number(this.settings.interval_max)) * 60;
    const intervals = this.randomSplit(to_be_concentrate, interval_min, interval_max);
    this.audio_mgr.playAudioSequence(audio_url_1, intervals);
    this.audio_mgr.playAudioSequence(audio_url_2, intervals.map(t => t + 3 + Math.floor(Number(this.settings.interval_last))));
    this.audio_mgr.playAudio(audio_url_3, to_be_concentrate);    
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 将一个时间区间不均匀地分隔开
   * @param total 时间的总区间长度
   * @param interval_min 最短间隔（秒）
   * @param interval_max 最长间隔（秒）
   * @returns 
   */
  randomSplit(total:number, interval_min:number, interval_max:number) {
    const result = [];
    let current = 0;

    while (current < total) {
      const step = Math.floor(
        Math.random() * (interval_max - interval_min + 1)
      ) + interval_min;

      current += step;
      result.push(current);
    }
    result.pop(); // 移除最后一个，确保不超过 total
    return result;
  }


  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 立刻播放提示音，用于专注启动、恢复时的用户感知
   * @param audio_url - 如果不传入参数，则默认播放第一个音频
   * @returns 
   */
  play_audio_right_now(audio_url = this.obsidian_audio_url_redirect(audio_type.on_interval_start)) {
    this.audio_mgr.playAudio(audio_url);
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 根据需要播放的音频类型（枚举类型）来确定实际的Obsidian内部音频地址
   * @param audio_choosen either "on_interval_start", or "on_interval_end", or "on_long_interval"
   * @returns audio_url_contructed_by_obsidian
   */
  obsidian_audio_url_redirect(audio_choosen: audio_type):string {

    let target_url: string;
    switch (audio_choosen) {
      case audio_type.on_interval_start:
        target_url = this.get_audio_url_by_settings_item(this.settings.audio_played_on_interval_start);
        if (target_url == null) 
          {
            new Notice('No Audio Configurated.', 1500);
            return null;
          }
        else return target_url;
        break;
      case audio_type.on_interval_end:
        target_url = this.get_audio_url_by_settings_item(this.settings.audio_played_on_interval_end);
        if (target_url == null) 
          {
            new Notice('No Audio Configurated.', 1500);
            return null;
          }
        else return target_url;
        break;
      case audio_type.on_long_interval:
        target_url = this.get_audio_url_by_settings_item(this.settings.audio_played_on_long_interval);
        if (target_url == null) 
          {
            new Notice('No Audio Configurated.', 1500);
            return null;
          }
        break;
      default:
        console.log('Error audio rediect url.');
        return null;
    }
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 在暂停或结束专注时，清空音频播放内容
   */
  stop_all_audios_on_terminate_or_pause() {
    this.audio_mgr.destroy();
    this.audio_mgr = createAudioManager();
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * @returns 返回当前状态的字符串表示
   */
  status_to_string() : string {
    if (this.status == 0) {
      return '等待专注';
    } else if (this.status == 1) {
      return '正在专注';
    } else {
      return '暂停专注';
    }
  }


  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 更新状态栏的专注状态
   */
  update_SBI_concentration_status() {
    this.SBI_concentration_status.setText(`专注状态: ${this.status_to_string()}`);
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 更新状态栏中的专注计时
   */
  update_SBI_concentration_lasting() {
    if (this.status == 0 || this.status == 2) {
      this.SBI_concentration_lasting.setText(`已专注: ${this.time_format(this.concentration_deposit_time)}`);
    } else if (this.status == 1) {
      const now = Date.now();
      const delta = Math.floor((now - this.last_transaction_time) / 1000);
      this.SBI_concentration_lasting.setText(`已专注: ${this.time_format(this.concentration_deposit_time + delta)}`);
    } else {
      this.SBI_concentration_lasting.setText(`已专注: 00:00:00`);
    }
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 将时间间隔长度变成可读性更高时间字符串。例如：90 => '00:01:30'
   * 
   * @param seconds 时间间隔长度（秒）
   * @returns 可读性更高的时间字符串
   */
  time_format(seconds: number) : string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60); 
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 更新实例属性 last_transaction_time, 记录最新的状态转移发生的时刻
   */
  update_last_transaction_time() {
    this.last_transaction_time = Date.now();
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 更新实例属性 concentration_deposit_time，代表某个专注周期中已累计的专注时长
   * @param seconds 
   */
  set_concentration_deposit_time(seconds: number) {
    this.concentration_deposit_time = seconds;
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 更新实例属性 concentration_deposit_time，将其重置为 0
   * 
   * 通常在结束专注状态的状态转移函数中被调用
   */
  reset_concentration_deposit_time() {
    this.concentration_deposit_time = 0;
  }

  /**
   * ==封装型函数== 抽象一部分复杂的行为，以便修改
   * 
   * 更新实例属性 concentration_deposit_time，追加某个专注周期中已累计的专注时长
   * 
   * 通常在暂停专注状态的状态转移函数中被调用
   */
  append_concentration_deposit_time() {
    const now = Date.now();
    const delta = Math.floor((now - this.last_transaction_time) / 1000);
    this.set_concentration_deposit_time(this.concentration_deposit_time + delta);
  }

  
  /**
   * TODO --someday maybe--
   * 等待以后更新, 本地保存专注习惯数据
   */
  upload_concentrating_habit_data() {
    console.log('（暂时什么都不做）上传专注习惯数据');
  }

  /**
   * 彩蛋
   * 
   * !TO-BE-DELETE-OR-CHANGE
   * 重置调皮指数
   */
  reset_naughtiness_index() {
    if (this.status == 0) {
      console.log('当前状态: Ready');
    } else if (this.status == 1) {
      console.log('当前状态: Running');
    } else {
      console.log('当前状态: Pasue');
    }

    console.log('调皮指数归零');
    this.naughtiness_index = 0;
  }

  /**
   * 彩蛋
   * 
   * !TO-BE-DELETE-OR-CHANGE
   * 调皮指数+1
   */
  improve_naughtiness_index() {
    if (this.status == 0) {
      console.log('当前状态: Ready');
    } else if (this.status == 1) {
      console.log('当前状态: Running');
    } else {
      console.log('当前状态: Pasue');
    }
    console.log('变得更调皮了: ', this.naughtiness_index+1);
    this.naughtiness_index += 1;

    if (this.naughtiness_index < 7) {
      return;
    } else if (this.naughtiness_index >= 7 && this.naughtiness_index <= 18) {
      new Notice('不要调皮~', 3000);
    } else {
      new Notice('肯德基疯狂星期四 V 我 50!');
    }
  }


}

/**
 * 
 * TODO
 * 
 * modal 模态，暂时不要动
 */
class ConcentrationStaticModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText('专注总时间：199.2 小时\n\n\n\n专注次数：132 次');
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
