export class ObjectPool<T> {
  private pool: T[] = [];
  private _activeCount: number = 0;
  private readonly factory: () => T;
  private readonly resetFn: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, initialSize: number) {
    this.factory = factory;
    this.resetFn = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  get activeLength(): number {
    return this._activeCount;
  }

  acquire(): T {
    if (this._activeCount < this.pool.length) {
      const item = this.pool[this._activeCount] as T;
      this._activeCount++;
      return item;
    }
    const item = this.factory();
    this.pool.push(item);
    this._activeCount++;
    return item;
  }

  release(item: T): void {
    const index = this.pool.indexOf(item);
    if (index === -1 || index >= this._activeCount) return;
    this._activeCount--;
    const swapItem = this.pool[this._activeCount] as T;
    this.pool[index] = swapItem;
    this.pool[this._activeCount] = item;
    this.resetFn(item);
  }

  getActive(): readonly T[] {
    return this.pool.slice(0, this._activeCount);
  }

  clear(): void {
    for (let i = 0; i < this._activeCount; i++) {
      const item = this.pool[i] as T;
      this.resetFn(item);
    }
    this._activeCount = 0;
  }
}
