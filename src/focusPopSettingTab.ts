import FocusPop from "main";
import { App, Setting, PluginSettingTab } from "obsidian";

export interface FocusPopSettings {
  /**
   * 专注周期时长，单位为分钟，默认 90 分钟
   */
  concentration_lasting? : string, 

  /**
   * 提醒间隔(min) | 最短提醒间隔，默认为 3 分钟
   */
  interval_min? : string, // 提醒间隔(min) 

  /**
   * 提醒间隔(max) | 最长提醒间隔，默认为 5 分钟
   */
  interval_max? : string,// 提醒间隔(max) 

  /**
   * 休息时长 | 休息时长，默认为 10 秒
   */
  interval_last? : string, // 休息时长

  /**
   * 长休息时长 | 在一整个专注周期结束时的长休息的时长，默认为 20 分钟
   */
  long_interval_last? : string, // 长休息时长

  /**
   * 在休息开始时播放的提示音
   */
  audio_played_on_interval_start? : string, // 提示音1

  /**
   * 在休息结束时播放的提示音
   */
  audio_played_on_interval_end? : string, // 
  
  /**
   * 在长休息开始时播放的提示音
   */
  audio_played_on_long_interval? : string // 提示音3
}

export const DEFAULT_SETTINGS: FocusPopSettings = {
  concentration_lasting : '90',
  interval_min : '3', // 提醒间隔(min) 
  interval_max : '5',// 提醒间隔(max) 
  interval_last : '10', // 休息时长
  long_interval_last : '20', // 长休息时长
  audio_played_on_interval_start : null, // 提示音1
  audio_played_on_interval_end : null, // 提示音2
  audio_played_on_long_interval : null // 提示音3
}

export default class FocusPopSettingTab extends PluginSettingTab {
  plugin: FocusPop;

  constructor(app: App, plugin: FocusPop) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();


    new Setting(containerEl)
      .setName('专注周期时长')
      .setDesc('默认为 90 分钟')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.concentration_lasting)
        .onChange(async (value) => {
          this.plugin.settings.concentration_lasting = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('最短提醒间隔')
      .setDesc('最短提醒间隔 （min), 默认为 3 分钟')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.interval_min)
        .onChange(async (value) => {
          this.plugin.settings.interval_min = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('最长提醒间隔')
      .setDesc('最长提醒间隔 （max), 默认为 5 分钟')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.interval_max)
        .onChange(async (value) => {
          this.plugin.settings.interval_max = value;
          await this.plugin.saveSettings();
        })
    );


    new Setting(containerEl)
      .setName('休息时长')
      .setDesc('默认为 10 秒')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.interval_last)
        .onChange(async (value) => {
          this.plugin.settings.interval_last = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('长休息时长')
      .setDesc('长休息时长，默认为 20 分钟')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.long_interval_last)
        .onChange(async (value) => {
          this.plugin.settings.long_interval_last = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('提示音1')
      .setDesc('在短休息开始时播放的音频, 不建议使用较长的音频\n填写完整的文件路径名\n例如：appendx目录下的音频文件ding.flac, 则填写为 appendix/ding.flac')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.audio_played_on_interval_start)
        .onChange(async (value) => {
          this.plugin.settings.audio_played_on_interval_start = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('提示音2')
      .setDesc('在短休息结束时播放的音频, 不建议使用较长的音频\n填写完整的文件路径名\n例如：appendx目录下的音频文件ding.flac, 则填写为 appendix/ding.flac')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.audio_played_on_interval_end)
        .onChange(async (value) => {
          this.plugin.settings.audio_played_on_interval_end = value;
          await this.plugin.saveSettings();
        })
    );

    new Setting(containerEl)
      .setName('提示音3')
      .setDesc('在长休息开始时播放的音频\n填写完整的文件路径名\n例如：appendx目录下的音频文件ding.flac, 则填写为 appendix/ding.flac')
      .addText(text => text
        .setPlaceholder('filename with mp3/wav/... etc')
        .setValue(this.plugin.settings.audio_played_on_long_interval)
        .onChange(async (value) => {
          this.plugin.settings.audio_played_on_long_interval = value;
          await this.plugin.saveSettings();
        })
    );
  }
}

/**
 * 设置界面需要提供的选项
 * 
 * 1. 专注时长 | 一个专注周期的时长，单位为分钟，默认 90 分钟；
 * 2. 提醒间隔(min) | 最短提醒间隔
 * 3. 提醒间隔(max) | 最长提醒间隔
 * 4. 休息时长 | 休息时长，最短 10 秒，最长 30 秒
 * 5. 长休息时长 | 在一整个专注周期结束时的长休息的时长
 * 6. 提示音1 | 短休息开始时播放的音频，不填写则使用默认音频
 * 7. 提示音2 | 短休息结束时播放的音频，不填写则与提示音1使用相同的音频
 * 8. 提示音3 | 长休息开始时播放的音频，没有默认音频，不填写则不会播放任何音频
 */