/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 范围一组函数，管理音频播放
 * @returns 音频管理器
 */
export function createAudioManager() {
  let audioCtx: AudioContext | null = null;

  const init = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  };

  const destroy = async () => {
    if (audioCtx) {
      await audioCtx.close();
      audioCtx = null;
    }
  };

  /**
   * 在 n 秒后播放音频
   * @param url 音频文件地址
   * @param delay 延迟播放（秒）
   * @returns
   */
  const playAudio = async (url: string, delay = 0) => {
    // console.time('playAudio');

    const ctx = init();
    // console.timeLog("playAudio", "音频上下文准备就绪");

    const response = await fetch(url);
    // console.timeLog("playAudio", "请求源文件完成");

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    // console.timeLog("playAudio", "解码音频数据完成");

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    // console.timeLog("playAudio", "注册音频事件完成");

    source.start(ctx.currentTime + delay);
    // console.timeEnd('playAudio');

    return source; // 返回 source，以便外部需要时 stop()
  };

  /**
   * 批量播放
   * @param url 音频文件地址
   * @param times 未来的时刻（整数数组）
   * @returns
   */
  const playAudioSequence = async (url: string, times: number[]) => {
    // console.time('playAudioSequence');
    const ctx = init();
    // console.timeLog("playAudioSequence", "音频上下文准备就绪");

    const response = await fetch(url);
    // console.timeLog("playAudioSequence", "请求源文件完成");

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    // console.timeLog("playAudioSequence", "解码音频数据完成");

    const sources: AudioBufferSourceNode[] = [];
    for (const t of times) {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(ctx.currentTime + t);
      // console.timeLog("playAudioSequence", "注册音频事件完成");
      sources.push(source);
    }

    // console.timeEnd('playAudioSequence');
    return sources; // 返回所有 source
  };


  const res =  {
    init,
    playAudio,
    playAudioSequence,
    destroy,
  };

  return res;
}