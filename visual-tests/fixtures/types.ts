/** 单个测试样本的元信息 */
export interface Fixture {
  /** 唯一 id，用于文件命名和报告引用 */
  readonly id: string;
  /** 来源标记（可追溯） */
  readonly source: 'readability' | 'custom';
  /** fixture 文件绝对路径 */
  readonly file: string;
  /** 该 fixture 覆盖的特性标签，用于报告分组 */
  readonly features: string[];
  /** 简短描述 */
  readonly description: string;
}
