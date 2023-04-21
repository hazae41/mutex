export class Mutex {

  #promise?: Promise<void>

  /**
   * Just a mutex
   */
  constructor() { }

  /**
   * Lock this mutex
   * @param callback 
   * @returns 
   */
  lock<T>(callback: () => Promise<T>): Promise<T> {
    const promise = this.#promise
      ? this.#promise.then(callback)
      : callback()

    this.#promise = promise
      .then(() => { })
      .catch(() => { })
      .finally(() => this.#promise = undefined)

    return promise
  }

  get promise() {
    return this.#promise
  }

}